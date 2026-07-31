# 附录：SqlWhitelistValidator 完整代码

> 本页是系列第二篇《SQL注入——拼接与白名单改造》配套工具的完整实现：可独立运行（含 `main` 演示），复制到任意 Java 8+ 项目即可使用。

核心原则：凡是要拼进 SQL 字符串的外部输入，必须在进入 XML 之前先过白名单校验。

- 拼「值」→ 一律用 `#{}` 预编译，不要用本工具。
- 拼「列名/排序/表名」→ `#{}` 不可用，只能白名单校验后再用 `${}` 拼接。

```java
/**
 * SQL 白名单校验工具：修复 MyBatis 中被迫使用 ${} 拼接动态列名 / 排序字段 / 分表名时的注入风险。
 *
 * 本类可独立运行（含 main 演示），复制到任意 Java 8+ 项目即可使用。
 */
public final class SqlWhitelistValidator {

    // 1. 动态列名白名单：只允许 sensorN_value 形式的列（N 为 1~15）
    private static final java.util.regex.Pattern COLUMN_PATTERN =
            java.util.regex.Pattern.compile("^sensor\\d{1,2}_value$");

    // 2. 排序字段白名单：用枚举/集合维护允许排序的列
    private static final java.util.Set<String> ALLOWED_SORT =
            java.util.Set.of("collect_time", "device_id");

    // 3. 分表名白名单：只允许 sensor_data_YYYY 形式（year 由服务端计算，仍加格式校验）
    private static final java.util.regex.Pattern TABLE_PATTERN =
            java.util.regex.Pattern.compile("^sensor_data_\\d{4}$");

    private SqlWhitelistValidator() {
        // 工具类，禁止实例化
    }

    /**
     * 列名白名单：过滤掉所有非法列，返回安全列列表。
     * 但若过滤后为空（说明入参全是非法列），直接抛异常，避免拼出无意义 SQL。
     */
    public static java.util.List<String> validateColumns(java.util.List<String> columns) {
        java.util.List<String> safe = columns.stream()
                .filter(c -> c != null && COLUMN_PATTERN.matcher(c).matches())
                .collect(java.util.stream.Collectors.toList());
        if (safe.isEmpty()) {
            throw new IllegalArgumentException("非法列名，已拦截：" + columns);
        }
        return safe;
    }

    /**
     * 排序字段白名单：非法则回落到默认列（降级而非报错，保证查询可用）。
     */
    public static String validateSortField(String sortField, String defaultField) {
        return (sortField != null && ALLOWED_SORT.contains(sortField)) ? sortField : defaultField;
    }

    /**
     * 表名白名单：只允许安全格式，非法直接抛异常。
     */
    public static String validateTableName(String tableName) {
        if (tableName == null || !TABLE_PATTERN.matcher(tableName).matches()) {
            throw new IllegalArgumentException("非法表名，已拦截：" + tableName);
        }
        return tableName;
    }

    // 演示：直接 java SqlWhitelistValidator 运行
    public static void main(String[] args) {
        // 列名：混入一个 inject 列，自动被过滤
        System.out.println("[列名] 安全结果 = "
                + validateColumns(java.util.List.of("sensor1_value", "sensor12_value", "drop table")));

        // 排序：合法走原值，非法回落默认
        System.out.println("[排序] 合法字段 = " + validateSortField("collect_time", "collect_time"));
        System.out.println("[排序] 非法字段 = " + validateSortField("evil_col", "collect_time"));

        // 表名：合法通过
        System.out.println("[表名] 合法表名 = " + validateTableName("sensor_data_2026"));

        // 触发异常演示（取消注释可见效果）
        // validateColumns(java.util.List.of("'; drop table sensor_data; --"));
    }
}
```
