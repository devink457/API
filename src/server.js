require("dotenv").config();
const express = require("express");
const { conectarDB } = require("./config/db");
const ticketsRoutes = require("./routes/tickets.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const categoriasRoutes = require("./routes/categorias.routes");
const authRoutes = require("./routes/auth.routes");
const { verificarToken, permitirRoles } = require("./middlewares/auth.middleware");


const app = express();
const PORT = 3000;

// Permitir recibir datos JSON
app.use(express.json());

// Login público

app.use("/api/auth", authRoutes);

// Rutas protegidas con JWT
app.use("/api/tickets", verificarToken, ticketsRoutes);

app.use(
  "/api/usuarios",
  verificarToken,
  permitirRoles("administrador"),
  usuariosRoutes
);

app.use("/api/categorias", verificarToken, categoriasRoutes);
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


 // Manejar rutas que no existen
app.use((req, res) => {
    res.status(404).json({
        mensaje: "La ruta solicitada no existe"
    });
});

// Manejo de errores de Express, incluido JSON mal formado
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            mensaje: "El cuerpo de la petición contiene JSON inválido"
        });
    }

    console.error("Error inesperado:", err.message);

    return res.status(500).json({
        mensaje: "Error interno del servidor"
    });
});


app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
