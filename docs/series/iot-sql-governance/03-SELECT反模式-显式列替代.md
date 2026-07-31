# 物联网平台 SQL 治理手记（三）：SELECT * 反模式——用 Base_Column_List 与显式列替代

> 技术栈：MyBatis + MySQL
> 适合谁读：需要消除手写 Mapper 中 `select *` 与 `t.*` 的开发者

## 1. 问题背景

`select *` 写起来最省事，却是教科书级的反模式。本文讲清楚它的问题、来源，以及怎么改得既安全又清爽。

## 2. 为什么 SELECT * 是反模式

### 2.1 多表 JOIN 时，同名列会打架

当语句同时写 `select i.*, ii.*`，两张表若有同名列，比如都有 `id`、`create_time`、`remark`，MyBatis 按列名到属性逐个映射，后出现的会覆盖前面的，导致某些字段永远拿不到正确值，而且极难排查。

```text
i.*  →  id=1, name=A   ← 先映射，记下了
ii.* →  id=2, name=B   ← 后映射，把上面的 id/name 覆盖掉
结果：对象的 id=2, name=B   （数据错位，但程序不报错）
```

只有一张表用 `i.*` 时没事；一旦 `i.*, ii.*` 同时出现，同名列就会撞车。

### 2.2 多查了用不上的列，还走不了覆盖索引

`select *` 会把所有列都读出来，包括用不上的大字段，`text`、`blob`、长 `varchar`，白白增加磁盘 IO、内存和网传开销。

更重要的是，因为读了非索引列，数据库没法用覆盖索引。可以打个比方：

```text
【走覆盖索引】只查索引里就有的列 → 在索引里直接拿到 → 不用回表，快
【select *】    查所有列         → 索引里只有一部分 → 还得回表取其余列 → 多一次 IO，慢
```

所谓覆盖索引，就是你要的字段刚好都在索引里，数据库不必再去翻原表。`select *` 把原表所有列都拽出来，自然覆盖不了。

### 2.3 表结构一变，容易出怪事

给表加一列，`select *` 会把新列也查出来；如果上层用 `Map` 接收，可能把新增的敏感字段一并序列化给前端。反之删列或改列顺序，也可能让依赖列顺序的代码错位。

### 2.4 执行计划不稳定

`select *` 让数据库的优化器很难做只取部分列的优化，比如列裁剪，复杂查询上尤其明显。

## 3. 它怎么来的

用 MBG 生成了 `BaseResultMap` 和 `Base_Column_List`，规范本该写 `select <include refid="Base_Column_List"/>`。但手写时为了少写几行，尤其是多表 JOIN，直接 `select *` 或 `i.*`，把规范抛到脑后。典型如：

```xml
<!-- 摄像头设备列表：单表 select * -->
<select id="selectCameraList" resultType="CameraDevice">
    SELECT * FROM camera_device
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
    </where>
    ORDER BY create_time DESC
</select>
```

## 4. 改造方案

### 4.1 单表 → `<include refid="Base_Column_List"/>`

```xml
<!-- 新代码 -->
<select id="selectCameraList" resultType="CameraDevice">
    SELECT <include refid="Base_Column_List"/>
    FROM camera_device
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
    </where>
    ORDER BY create_time DESC
</select>
```

`Base_Column_List` 由 MBG 维护，和 `BaseResultMap` 严格对应，改表结构时重新生成即可，不会出现列错位。

### 4.2 多表 JOIN → 主表用别名，附属表只取要的列

JOIN 场景不能整表 `include`，但要避免 `i.*, ii.*` 两个通配一起用。正确做法：主表列出需要的列，或单独用一个 `i.*`，附属表只取要的列：

```xml
<!-- 旧代码（已删除） -->
SELECT i.*, ii.*, it.type_name
FROM device i, sensor_data ii, sensor_type it
WHERE i.node_id = ii.node_id AND i.type_id = it.type_id

<!-- 新代码：主表列显式列出，附属表只选需要的 -->
SELECT
    i.device_id, i.device_name, i.device_mac, i.type_id, i.zone_id,
    ii.collect_time, ii.sensor1_value,
    it.type_name
FROM sensor_data ii
INNER JOIN device i ON ii.device_id = i.device_id
INNER JOIN sensor_type it ON i.type_id = it.type_id
```

如果确实要把整张主表映射成对象，可以 `SELECT i.*` 只对一个表用，其它表的列显式列出，避免同名列冲突。

### 4.3 单表查询改用 MyBatis-Plus Wrapper

单表查询可直接删掉 XML，改用 `LambdaQueryWrapper`：

```java
cameraDeviceMapper.selectList(
    new LambdaQueryWrapper<CameraDevice>()
        .like(StringUtils.isNotBlank(name), CameraDevice::getName, name)
        .orderByDesc(CameraDevice::getCreateTime));
```

### 4.4 动态列场景（呼应第二篇）

如果列是动态的，前端勾选，别退回 `select *`，而是用第二篇的白名单加显式 `include`：

```xml
SELECT <include refid="Base_Column_List"/>,
<foreach collection="extraColumns" open="" separator="," close="" item="col">
    ${col}
</foreach>
FROM sensor_data
```

注意 `extraColumns` 必须经过白名单校验，否则又回到注入敞口。

## 5. 改造对照

| 场景 | 改造前 | 改造后 |
|------|--------|--------|
| 单表 | `select *` | `<include refid="Base_Column_List"/>` |
| 多表 JOIN | `i.*, ii.*` 通配 | 主表别名 + 显式列 |
| 单表查询 | 手写 SQL | `LambdaQueryWrapper` |
| 动态列 | `select *` | 白名单列 + `include` |

## 6. 注意事项

1. `i.*` 单独用一个表是允许的，别和 `ii.*` 一起用。只要保证最终 SELECT 列表里没有两张表的同名列撞车即可
2. 改完核对列是否齐全。用单测确认新语句查出的列能完整映射到对象或 DTO 的所有字段，避免漏列导致属性为 null
3. `Base_Column_List` 要随表结构更新。加列后重新生成 MBG，否则 `include` 出来的列不全

## 7. 总结

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| 单表 | `select *` | `Base_Column_List` |
| 多表 JOIN | `i.*, ii.*` 通配 | 主表别名 + 显式列 |
| 列映射 | 同名列相互覆盖 | 列唯一、映射确定 |
| 索引利用 | 易回表 | 可走覆盖索引 |
| 单表查询 | 手写 SQL | Wrapper 改写 |

下一篇讲性能反模式：前导通配 LIKE、ORDER BY 无 LIMIT、GROUP BY 过多列、COUNT(*) 与深分页。
