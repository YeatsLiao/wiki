# SQL 注入——危险的 ${} 拼接与白名单改造

> 技术栈：MyBatis + MySQL
> 适合谁读：需要修复手写 Mapper 中 `${}` 字符串拼接注入的开发者

## 1. 问题背景

MyBatis 里有两个长得很像的符号：`#{}` 和 `${}`，新手很容易搞混，但它们的行为完全不同：

- `#{}` 是预编译占位符。MyBatis 会先把它变成 `?`，再由数据库驱动把值填进去。填进去的值永远被当成数据，不会被当成 SQL 命令
- `${}` 是直接拼接。MyBatis 把变量的值原样贴进 SQL 文本，再交给数据库执行。如果这个值来自用户，比如前端传参，攻击者就能往里塞任意 SQL

动态列名是最容易中招的地方：比如前端让用户勾选想看哪些列，开发者用 `${column}` 把列名贴进 SQL，而 `column` 完全来自用户请求、没有任何检查，这就是注入口。

## 2. #{} 到底做了什么

把 `#{}` 理解成填空题：

```java
// MyBatis 把 where status = #{status} 变成：
String sql = "select * from device where status = ?";   // 卷子先印好，留个空
PreparedStatement ps = conn.prepareStatement(sql);
ps.setInt(1, status);   // 答案单独填进去，永远只是数据
```

不管你传什么，它都只是答案。就算传 `1; DROP TABLE device`，数据库也只当它是一个整型参数，类型不对直接报错，绝不会去执行 `DROP`。

而 `${}` 在 MyBatis 解析阶段就把文本替换好了，生成的 SQL 已经是一整句，数据库照单全收。

## 3. 注入是怎么发生的

```text
攻击者          接口层          Mapper XML          数据库
  │ columns=["正常值",           │                 │
  │  "(select sleep(5))"]        │                 │
  ├────────────────────────────>│                 │
  │                             ├─ 直接代入 ${column}>│
  │                             │                 ├─ 执行含 sleep 的 SQL
  │<──────── 响应延迟 5 秒 ─────────────────────────┤
  │        → 攻击者确认：这里有注入漏洞               │
```

`sleep(5)` 是最典型的盲注探测：如果接口明显变慢，攻击者就知道注入点成立，接着就能拖库、读权限表，甚至写入数据。

## 4. 为什么有人会用 ${}

根因是一个矛盾：列名和排序字段没法用参数 `#{}` 表示，可业务上又必须让列名动态变化。

因为 `#{}` 会给值套上引号，所以 `ORDER BY #{column}` 会变成 `ORDER BY 'device_id'`，数据库把它当成字符串而不是列名，直接报错。于是动态列名场景下，开发者顺手用了 `${}`：

```xml
<!-- 设备数据表字段很多，前端可勾选要看哪些列 -->
<select id="selectSensorDataById" resultMap="BaseResultMap">
    select device_id, collect_time
    <foreach collection="columns" open="," separator="," close=" " item="column">
        ${column}          <!-- 把前端传来的列名直接贴进 SQL -->
    </foreach>
    from sensor_data
    where device_id = #{deviceId}
</select>
```

`columns` 是前端勾选的要看哪些传感器字段。`#{}` 用不了，开发者就用了 `${column}`，而它来自用户请求、没有校验，于是成了注入口。

## 5. 危害

1. 数据泄露：用 UNION 注入读取用户表、配置表、令牌等敏感数据
2. 数据破坏：用子查询或堆叠注入执行 `UPDATE`/`DELETE`，甚至 `DROP TABLE`
3. 越权：绕过业务层的数据权限，比如 `zone_id` 过滤，看到本不该看的设备的全部历史数据
4. 拒绝服务：像上面的 `sleep()` 盲注，或构造超大数据集，把数据库拖垮

## 6. 修复方案

一句话原则：凡是来自外部的值，要么填空题用 `#{}`，要么先过白名单再拼接用 `${}`。

### 6.1 先判断：拼的是值还是标识符

```text
你要拼进 SQL 的是什么？
├── 值（数字/字符串/日期）   → 用 #{} 预编译，绝不裸拼
└── 标识符（列名/表名/排序）
    ├── 能枚举（列就那几个） → 白名单校验后 ${} 拼接
    └── 不能枚举             → 重构：用固定 SQL + 参数化查询
```

### 6.2 值类 ${} → #{}

如果 `${}` 拼的是值而不是列名，直接改成 `#{}`：

```xml
<!-- 旧代码（已删除） -->
where status = ${status}

<!-- 新代码 -->
where status = #{status}
```

### 6.3 列名/排序类 ${field} → 白名单校验

动态列名必须拼接，`#{}` 用不了，那就保证拼进去的内容一定是个合法列名。做法是在 Service 调用 Mapper 之前，对 `columns` 逐个校验：

```java
// 允许的动态列：sensor1_value ~ sensor15_value
private static final Pattern COLUMN_PATTERN =
        Pattern.compile("^sensor\\d{1,2}_value$");

public List<SensorData> queryByColumns(Long deviceId, List<String> columns) {
    // 白名单过滤：非法的列名直接拒绝，不进 SQL
    List<String> safeColumns = columns.stream()
            .filter(c -> COLUMN_PATTERN.matcher(c).matches())
            .collect(Collectors.toList());
    if (safeColumns.isEmpty()) {
        throw new IllegalArgumentException("非法列名");
    }
    return sensorDataMapper.selectSensorDataById(deviceId, safeColumns);
}
```

```xml
<!-- 新代码：columns 已经过白名单，这里拼接是安全的 -->
<select id="selectSensorDataById" resultMap="BaseResultMap">
    select device_id, collect_time
    <foreach collection="columns" open="," separator="," close=" " item="column">
        ${column}
    </foreach>
    from sensor_data
    where device_id = #{deviceId}
</select>
```

也可以用一个允许列清单，枚举或配置，来维护，比正则更直观。关键一点：校验必须发生在进入 XML 之前，XML 里永远不要信任 `${}`。

### 6.4 排序字段同理

`ORDER BY ${sortField}` 也要白名单：

```java
private static final Set<String> ALLOWED_SORT = Set.of("collect_time", "device_id");
String sortField = ALLOWED_SORT.contains(req.getSortField())
        ? req.getSortField() : "collect_time";   // 非法则回落到默认列
```

### 6.5 分表名场景

分表，如 `sensor_data_2026`，的表名也要来自服务端计算并校验，绝不能让用户传：

```java
private static final Pattern TABLE_PATTERN = Pattern.compile("^sensor_data_\\d{4}$");
String table = TABLE_PATTERN.matcher(tableName).matches() ? tableName : "sensor_data_2026";
```

完整的、可独立运行的白名单工具见[附录：SqlWhitelistValidator 完整代码](./06-附录-SqlWhitelistValidator完整代码.md)，覆盖列名、排序、表名三类，带 `main` 演示。

## 7. 验证

给改过的方法补单元测试，至少覆盖三种入参：

- 正常列名列表 → 查询成功
- 含一个非法列名 → 抛异常或被过滤
- 超长、带特殊字符，如 `; drop table` → 被拦截

## 8. 注意事项

1. `${}` 不是不能用，是不能拼外部输入。拼常量，如分表名 `table_${year}`，year 是服务端算的，相对安全，但仍建议加格式校验
2. 白名单优于黑名单。别想着把空格、分号、注释符过滤掉来防注入，攻击者有数不清的等价变形。只允许白名单里的东西进 SQL
3. `#{}` 解决不了列名问题。别为了用 `#{}` 而去拼个字符串再传进去，那只是把拼接挪到 Java 层，本质没变

## 9. 总结

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| 参数值拼接 | `${x}` 注入敞口 | `#{x}` 预编译 |
| 动态列名 | `${column}` 裸拼外部输入 | 白名单校验后拼接 |
| 排序字段 | `${sort}` 裸拼 | 枚举/集合白名单 |
| 分表名 | 可能拼外部输入 | 服务端计算 + 格式校验 |
| 验证 | 无 | 单测 + 脚本复跑归零 |

下一篇讲 `SELECT *` 反模式，它不像注入那样一击致命，但会悄悄拖慢查询、埋下维护地雷。
