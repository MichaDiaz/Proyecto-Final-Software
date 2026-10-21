using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace HomeClassApi.Services
{
    public static class SqlData
    {
        private static string ConnectionString => ConfigurationManager.ConnectionStrings["HomeClassDb"].ConnectionString;

        public static List<Dictionary<string, object>> Query(string sql, params SqlParameter[] parameters)
        {
            var rows = new List<Dictionary<string, object>>();
            using (var connection = new SqlConnection(ConnectionString))
            using (var command = new SqlCommand(sql, connection))
            {
                if (parameters != null) command.Parameters.AddRange(parameters);
                connection.Open();
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>();
                        for (var i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        }
                        rows.Add(row);
                    }
                }
            }
            return rows;
        }

        public static int Execute(string sql, params SqlParameter[] parameters)
        {
            using (var connection = new SqlConnection(ConnectionString))
            using (var command = new SqlCommand(sql, connection))
            {
                if (parameters != null) command.Parameters.AddRange(parameters);
                connection.Open();
                return command.ExecuteNonQuery();
            }
        }

        public static object Scalar(string sql, params SqlParameter[] parameters)
        {
            using (var connection = new SqlConnection(ConnectionString))
            using (var command = new SqlCommand(sql, connection))
            {
                if (parameters != null) command.Parameters.AddRange(parameters);
                connection.Open();
                return command.ExecuteScalar();
            }
        }

        public static SqlParameter Param(string name, SqlDbType type, object value, int size = 0)
        {
            var parameter = size > 0 ? new SqlParameter(name, type, size) : new SqlParameter(name, type);
            if (type == SqlDbType.Decimal)
            {
                parameter.Precision = 9;
                parameter.Scale = 2;
            }
            parameter.Value = value ?? System.DBNull.Value;
            return parameter;
        }
    }
}