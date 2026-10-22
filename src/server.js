
const express = require("express");
const { conectarDB } = require("./config/db");
const ticketsRoutes = require("./routes/tickets.routes");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/tickets", ticketsRoutes);

// Ruta de bienvenida
app.get("/", (req, res) => {
    res.status(200).json({
        mensaje: "API de soporte de tickets",
        estado: "servidor activo"
    });
});

// Verificar la conexión con SQL Server
app.get("/api/health/db", async (req, res) => {
    try {
        const pool = await conectarDB();

        const resultado = await pool.request().query(`
            SELECT
                DB_NAME() AS baseDatos,
                SUSER_SNAME() AS usuario
        `);

        res.status(200).json({
            mensaje: "Conexión a SQL Server exitosa",
            ...resultado.recordset[0]
        });
    } catch (error) {
        console.error("Error al consultar SQL Server:", error.message);

        res.status(500).json({
            mensaje: "No se pudo conectar con la base de datos"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
