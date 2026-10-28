
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, conectarDB } = require("../config/db");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { correo, contra } = req.body || {};

  if (
    typeof correo !== "string" ||
    !correo.trim() ||
    typeof contra !== "string" ||
    !contra
  ) {
    return res.status(400).json({
      mensaje: "Ingresa tu correo y contraseña",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET no está configurado");
    return res.status(500).json({
      mensaje: "Error de configuración del servidor",
    });
  }

  try {
    const pool = await conectarDB();

    const resultado = await pool
      .request()
      .input("correo", sql.NVarChar(150), correo.trim().toLowerCase())
      .query(`
        SELECT
          id_usuario,
          nombre,
          correo,
          contra,
          rol,
          activo
        FROM usuarios
        WHERE correo = @correo
      `);

    const usuario = resultado.recordset[0];

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const valida = await bcrypt.compare(contra, usuario.contra);

    if (!valida) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
        algorithm: "HS256",
      }
    );

    return res.status(200).json({
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error de autenticación:", error.message);

    return res.status(500).json({
      mensaje: "Error al iniciar sesión",
    });
  }
});

module.exports = router;
