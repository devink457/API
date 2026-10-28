
const express = require("express");
const { sql, conectarDB } = require("../config/db");
const { permitirRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

const ESTADOS = [
  "abierto",
  "pendiente",
  "en_proceso",
  "resuelto",
  "cerrado",
];

const PRIORIDADES = [
  "baja",
  "media",
  "alta",
  "critica",
];

const CAMPOS_PERMITIDOS = [
  "titulo",
  "descripcion",
  "estado",
  "prioridad",
  "id_cliente",
  "id_tecnico",
  "id_categoria",
];

function validarId(valor) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarTicket(datos, parcial = false) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return "Los datos del ticket deben ser un objeto JSON.";
  }

  const campos = Object.keys(datos);

  if (campos.some((campo) => !CAMPOS_PERMITIDOS.includes(campo))) {
    return "La solicitud contiene campos no permitidos.";
  }

  if (parcial && campos.length === 0) {
    return "Debes proporcionar al menos un campo para actualizar.";
  }

  if (!parcial) {
    const requeridos = [
      "titulo",
      "descripcion",
      "id_cliente",
      "id_categoria",
    ];

    if (requeridos.some((campo) => datos[campo] === undefined)) {
      return "Faltan campos obligatorios del ticket.";
    }
  }

  for (const campo of ["titulo", "descripcion"]) {
    if (datos[campo] !== undefined) {
      if (
        typeof datos[campo] !== "string" ||
        !datos[campo].trim()
      ) {
        return `El campo ${campo} debe contener texto válido.`;
      }
    }
  }

  if (
    datos.estado !== undefined &&
    !ESTADOS.includes(datos.estado)
  ) {
    return "El estado indicado no es válido.";
  }

  if (
    datos.prioridad !== undefined &&
    !PRIORIDADES.includes(datos.prioridad)
  ) {
    return "La prioridad indicada no es válida.";
  }

  for (const campo of ["id_cliente", "id_categoria"]) {
    if (
      datos[campo] !== undefined &&
      !validarId(datos[campo])
    ) {
      return `El campo ${campo} debe contener un ID válido.`;
    }
  }

  if (
    datos.id_tecnico !== undefined &&
    datos.id_tecnico !== null &&
    datos.id_tecnico !== "" &&
    !validarId(datos.id_tecnico)
  ) {
    return "El ID del técnico no es válido.";
  }

  return null;
}

function agregarParametros(request, datos) {
  const tipos = {
    titulo: sql.NVarChar(150),
    descripcion: sql.NVarChar(sql.MAX),
    estado: sql.VarChar(30),
    prioridad: sql.VarChar(20),
    id_cliente: sql.Int,
    id_tecnico: sql.Int,
    id_categoria: sql.Int,
  };

  for (const [campo, valor] of Object.entries(datos)) {
    let valorFinal = valor;

    if (["titulo", "descripcion"].includes(campo)) {
      valorFinal = valor.trim();
    }

    if (["id_cliente", "id_categoria", "id_tecnico"].includes(campo)) {
      valorFinal =
        valor === null || valor === ""
          ? null
          : Number(valor);
    }

    request.input(campo, tipos[campo], valorFinal);
  }

  return request;
}

// CONSULTAR TODOS LOS TICKETS
// Acceso: cualquier usuario autenticado
router.get("/", async (req, res) => {
  try {
    const pool = await conectarDB();

    const resultado = await pool.request().query(`
      SELECT *
      FROM tickets
      ORDER BY id_ticket DESC
    `);

    return res.status(200).json({
      mensaje: "Tickets obtenidos correctamente",
      total: resultado.recordset.length,
      tickets: resultado.recordset,
    });
  } catch (error) {
    console.error("Error al consultar tickets:", error.message);

    return res.status(500).json({
      mensaje: "Error al consultar los tickets",
    });
  }
});

// CONSULTAR UN TICKET POR ID
// Acceso: cualquier usuario autenticado
router.get("/:id", async (req, res) => {
  const id = validarId(req.params.id);

  if (!id) {
    return res.status(400).json({
      mensaje: "ID de ticket inválido",
    });
  }

  try {
    const pool = await conectarDB();

    const resultado = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT *
        FROM tickets
        WHERE id_ticket = @id
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Ticket no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Ticket encontrado",
      ticket: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al consultar ticket:", error.message);

    return res.status(500).json({
      mensaje: "Error al consultar el ticket",
    });
  }
});

// CREAR TICKET
// Acceso: administrador y técnico
router.post(
  "/",
  permitirRoles("administrador", "tecnico"),
  async (req, res) => {
    const datos = req.body;
    const errorValidacion = validarTicket(datos);

    if (errorValidacion) {
      return res.status(400).json({
        mensaje: errorValidacion,
      });
    }

    try {
      const pool = await conectarDB();

      const ticket = {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        estado: datos.estado ?? "abierto",
        prioridad: datos.prioridad ?? "media",
        id_cliente: datos.id_cliente,
        id_tecnico: datos.id_tecnico ?? null,
        id_categoria: datos.id_categoria,
      };

      const request = agregarParametros(pool.request(), ticket);

      const resultado = await request.query(`
        INSERT INTO tickets (
          titulo,
          descripcion,
          estado,
          prioridad,
          id_cliente,
          id_tecnico,
          id_categoria
        )
        OUTPUT INSERTED.*
        VALUES (
          @titulo,
          @descripcion,
          @estado,
          @prioridad,
          @id_cliente,
          @id_tecnico,
          @id_categoria
        )
      `);

      return res.status(201).json({
        mensaje: "Ticket creado correctamente",
        ticket: resultado.recordset[0],
      });
    } catch (error) {
      console.error("Error al crear ticket:", error.message);

      return res.status(500).json({
        mensaje: "Error al crear el ticket",
      });
    }
  }
);

// ACTUALIZAR TICKET
// Acceso: administrador y técnico
router.put(
  "/:id",
  permitirRoles("administrador", "tecnico"),
  async (req, res) => {
    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({
        mensaje: "ID de ticket inválido",
      });
    }

    const datos = req.body;
    const errorValidacion = validarTicket(datos, true);

    if (errorValidacion) {
      return res.status(400).json({
        mensaje: errorValidacion,
      });
    }

    try {
      const pool = await conectarDB();

      const request = agregarParametros(pool.request(), datos);

      request.input("id", sql.Int, id);

      const asignaciones = Object.keys(datos)
        .map((campo) => `${campo} = @${campo}`)
        .join(", ");

      const resultado = await request.query(`
        UPDATE tickets
        SET ${asignaciones}
        OUTPUT INSERTED.*
        WHERE id_ticket = @id
      `);

      if (resultado.recordset.length === 0) {
        return res.status(404).json({
          mensaje: "Ticket no encontrado",
        });
      }

      return res.status(200).json({
        mensaje: "Ticket actualizado correctamente",
        ticket: resultado.recordset[0],
      });
    } catch (error) {
      console.error("Error al actualizar ticket:", error.message);

      return res.status(500).json({
        mensaje: "Error al actualizar el ticket",
      });
    }
  }
);

// ELIMINAR TICKET
// Acceso: solo administrador
router.delete(
  "/:id",
  permitirRoles("administrador"),
  async (req, res) => {
    const id = validarId(req.params.id);

    if (!id) {
      return res.status(400).json({
        mensaje: "ID de ticket inválido",
      });
    }

    try {
      const pool = await conectarDB();

      const resultado = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          DELETE FROM tickets
          OUTPUT DELETED.id_ticket
          WHERE id_ticket = @id
        `);

      if (resultado.recordset.length === 0) {
        return res.status(404).json({
          mensaje: "Ticket no encontrado",
        });
      }

      return res.status(200).json({
        mensaje: "Ticket eliminado correctamente",
        id_ticket: id,
      });
    } catch (error) {
      console.error("Error al eliminar ticket:", error.message);

      return res.status(500).json({
        mensaje: "Error al eliminar el ticket",
      });
    }
  }
);

module.exports = router;
