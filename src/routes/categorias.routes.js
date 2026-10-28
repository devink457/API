
const express = require("express");
const { conectarDB } = require("../config/db");

const router = express.Router();

// GET /api/categorias
router.get("/", async (req, res) => {
    try {
        const pool = await conectarDB();

        const resultado = await pool.request().query(`
            SELECT
                id_categoria,
                nombre,
                descripcion,
                activa
            FROM categorias
            WHERE activa = 1
            ORDER BY nombre ASC
        `);

        return res.status(200).json({
            mensaje: "Categorías obtenidas correctamente",
            total: resultado.recordset.length,
            categorias: resultado.recordset
        });

    } catch (error) {
        console.error("Error al consultar categorías:", error.message);

        return res.status(500).json({
            mensaje: "Error al consultar categorías"
        });
    }
});

module.exports = router;
