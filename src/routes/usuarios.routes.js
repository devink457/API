
const express = require("express");
const bcrypt = require("bcryptjs");
const { sql, conectarDB } = require("../config/db");

const router = express.Router();

const ROLES = ["cliente", "tecnico", "administrador"];

// GET /api/usuarios
// Consultar usuarios registrados
router.get("/", async (req, res) => {
    try {
        const pool = await conectarDB();

        const resultado = await pool.request().query(`
            SELECT
                id_usuario,
                nombre,
                correo,
                rol,
                activo,
                fecha_creacion
            FROM usuarios
            ORDER BY id_usuario DESC
        `);

        return res.status(200).json({
            mensaje: "Usuarios obtenidos correctamente",
            total: resultado.recordset.length,
            usuarios: resultado.recordset
        });

    } catch (error) {
        console.error("Error al consultar usuarios:", error.message);

        return res.status(500).json({
            mensaje: "Error al consultar usuarios"
        });
    }
});

// POST /api/usuarios
// Registrar un nuevo usuario
router.post("/", async (req, res) => {
    const {
        nombre,
        correo,
        contra,
        rol = "cliente"
    } = req.body || {};

    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        nombre.trim().length > 100 ||
        typeof correo !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) ||
        correo.trim().length > 150 ||
        typeof contra !== "string" ||
        contra.length < 8 ||
        contra.length > 72 ||
        !ROLES.includes(rol)
    ) {
        return res.status(400).json({
            mensaje: "Verifica nombre, correo, contraseña (8 a 72 caracteres) y rol"
        });
    }

    try {
        const pool = await conectarDB();

        const correoNormalizado = correo.trim().toLowerCase();

        // Verificar que el correo no esté registrado
        const existente = await pool.request()
            .input("correo", sql.NVarChar(150), correoNormalizado)
            .query(`
                SELECT id_usuario
                FROM usuarios
                WHERE correo = @correo
            `);

        if (existente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado"
            });
        }

        // Proteger la contraseña mediante hash
        const hash = await bcrypt.hash(contra, 12);

        // Registrar usuario
        const resultado = await pool.request()
            .input("nombre", sql.NVarChar(100), nombre.trim())
            .input("correo", sql.NVarChar(150), correoNormalizado)
            .input("contra", sql.NVarChar(255), hash)
            .input("rol", sql.NVarChar(20), rol)
            .query(`
                INSERT INTO usuarios (
                    nombre,
                    correo,
                    contra,
                    rol
                )
                OUTPUT
                    INSERTED.id_usuario,
                    INSERTED.nombre,
                    INSERTED.correo,
                    INSERTED.rol,
                    INSERTED.activo,
                    INSERTED.fecha_creacion
                VALUES (
                    @nombre,
                    @correo,
                    @contra,
                    @rol
                )
            `);

        return res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: resultado.recordset[0]
        });

    } catch (error) {
        if (error.number === 2601 || error.number === 2627) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado"
            });
        }

        console.error("Error al registrar usuario:", error.message);

        return res.status(500).json({
            mensaje: "Error al registrar usuario"
        });
    }
});

module.exports = router;
