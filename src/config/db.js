
const sql = require("mssql/msnodesqlv8");

const config = {
    connectionString:
        "Driver={ODBC Driver 17 for SQL Server};" +
        "Server=localhost\\SQLEXPRESS;" +
        "Database=soporte_tickets;" +
        "Trusted_Connection=Yes;" +
        "TrustServerCertificate=Yes;"
};

async function conectarDB() {
    const pool = await sql.connect(config);
    return pool;
}

module.exports = {
    sql,
    conectarDB
};
