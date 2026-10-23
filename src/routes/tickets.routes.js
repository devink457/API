
const express = require("express");
const { sql, conectarDB } = require("../config/db");

const router = express.Router();

// Valores permitidos por la base de datos
const ESTADOS_PERMITIDOS = [
    "abierto",
    "pendiente",
    "en_proceso",
    "resuelto",
    "cerrado"
];

const PRIORIDADES_PERMITIDAS = [
    "baja",
    "media",
    "alta",
    "critica"
];

// GET /api/tickets
// Obtener todos los tickets
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
            tickets: resultado.recordset
        });
    } catch (error) {
        console.error("Error al obtener tickets:", error.message);

        return res.status(500).json({
            mensaje: "Error interno al consultar los tickets"
        });
    }
});

// GET /api/tickets/:id
// Obtener un ticket por ID
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: "El ID del ticket debe ser un entero positivo"
        });
    }

    try {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input("id_ticket", sql.Int, id)
            .query(`
                SELECT *
                FROM tickets
                WHERE id_ticket = @id_ticket
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró un ticket con ese ID"
            });
        }

        return res.status(200).json({
            mensaje: "Ticket obtenido correctamente",
            ticket: resultado.recordset[0]
        });
    } catch (error) {
        console.error("Error al obtener ticket:", error.message);

        return res.status(500).json({
            mensaje: "Error interno al consultar el ticket"
        });
    }
});

// POST /api/tickets
// Crear un ticket
router.post("/", async (req, res) => {
    const {
        titulo,
        descripcion,
        id_cliente,
        id_tecnico,
        id_categoria,
        estado,
        prioridad
    } = req.body;

    if (
        typeof titulo !== "string" ||
        !titulo.trim() ||
        titulo.trim().length > 300 ||
        typeof descripcion !== "string" ||
        !descripcion.trim() ||
        id_cliente === undefined ||
        id_categoria === undefined
    ) {
        return res.status(400).json({
            mensaje:
                "titulo, descripcion, id_cliente e id_categoria son obligatorios. El título admite hasta 300 caracteres."
        });
    }

    const clienteId = Number(id_cliente);
    const categoriaId = Number(id_categoria);

    const tecnicoId =
        id_tecnico === undefined ||
        id_tecnico === null ||
        id_tecnico === ""
            ? null
            : Number(id_tecnico);

    if (
        !Number.isInteger(clienteId) ||
        clienteId <= 0 ||
        !Number.isInteger(categoriaId) ||
        categoriaId <= 0 ||
        (
            tecnicoId !== null &&
            (!Number.isInteger(tecnicoId) || tecnicoId <= 0)
        )
    ) {
        return res.status(400).json({
            mensaje: "Los IDs deben ser enteros positivos"
        });
    }

    const estadoFinal = estado ?? "abierto";
    const prioridadFinal = (prioridad ?? "media").trim().toLowerCase();

    if (
        !PRIORIDADES_PERMITIDAS.includes(prioridadFinal)) {
        return res.status(400).json({
            mensaje: "Prioridad inválida",
            prioridadesPermitidas: PRIORIDADES_PERMITIDAS
        });
    }

    if (
        typeof prioridadFinal !== "string" ||
        !prioridadFinal.trim() ||
        prioridadFinal.trim().length > 20
    ) {
        return res.status(400).json({
            mensaje: "La prioridad debe tener entre 1 y 20 caracteres"
        });
    }

    try {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input("titulo", sql.NVarChar(300), titulo.trim())
            .input(
                "descripcion",
                sql.NVarChar(sql.MAX),
                descripcion.trim()
            )
            .input("id_cliente", sql.Int, clienteId)
            .input("id_tecnico", sql.Int, tecnicoId)
            .input("id_categoria", sql.Int, categoriaId)
            .input("estado", sql.NVarChar(40), estadoFinal.trim())
            .input(
                "prioridad",
                sql.NVarChar(20),
                prioridadFinal.trim()
            )
            .query(`
                INSERT INTO tickets (
                    titulo,
                    descripcion,
                    id_cliente,
                    id_tecnico,
                    id_categoria,
                    estado,
                    prioridad
                )
                OUTPUT INSERTED.*
                VALUES (
                    @titulo,
                    @descripcion,
                    @id_cliente,
                    @id_tecnico,
                    @id_categoria,
                    @estado,
                    @prioridad
                )
            `);

        return res.status(201).json({
            mensaje: "Ticket creado correctamente",
            ticket: resultado.recordset[0]
        });
    } catch (error) {
        console.error("Error al crear ticket:", error.message);
        console.error("Código SQL:", error.number);
        console.error(
            "Detalles SQL:",
            error.originalError?.message
        );

        if (error.number === 547) {
            return res.status(400).json({
                mensaje:
                    "Algún ID relacionado o valor enviado incumple una restricción de la base de datos"
            });
        }

        return res.status(500).json({
            mensaje: "Error interno al crear el ticket"
        });
    }
});

// PUT /api/tickets/:id
// Actualizar un ticket existente
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: "El ID debe ser un entero positivo"
        });
    }

    const datos = req.body;

    if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(datos)
    ) {
        return res.status(400).json({
            mensaje: "Debes enviar un objeto JSON"
        });
    }

    const camposPermitidos = [
        "titulo",
        "descripcion",
        "estado",
        "prioridad",
        "id_cliente",
        "id_tecnico",
        "id_categoria"
    ];

    const camposRecibidos = Object.keys(datos);

    if (camposRecibidos.length === 0) {
        return res.status(400).json({
            mensaje: "Debes enviar al menos un campo para actualizar"
        });
    }

    const camposInvalidos = camposRecibidos.filter(
        campo => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            mensaje: "Hay campos que no se pueden actualizar",
            camposInvalidos
        });
    }

    const { titulo, descripcion, estado, prioridad } = datos;

    if (
        titulo !== undefined &&
        (
            typeof titulo !== "string" ||
            !titulo.trim() ||
            titulo.trim().length > 300
        )
    ) {
        return res.status(400).json({
            mensaje: "El título debe tener entre 1 y 300 caracteres"
        });
    }

    if (
        descripcion !== undefined &&
        (
            typeof descripcion !== "string" ||
            !descripcion.trim()
        )
    ) {
        return res.status(400).json({
            mensaje: "La descripción no puede estar vacía"
        });
    }

    if (
        estado !== undefined &&
        (
            typeof estado !== "string" ||
            !ESTADOS_PERMITIDOS.includes(estado.trim())
        )
    ) {
        return res.status(400).json({
            mensaje: "Estado inválido",
            estadosPermitidos: ESTADOS_PERMITIDOS
        });
    }

    if (
        prioridad !== undefined &&
        (
            typeof prioridad !== "string" ||
            !prioridad.trim() ||
            prioridad.trim().length > 20
        )
    ) {
        return res.status(400).json({
            mensaje: "La prioridad debe tener entre 1 y 20 caracteres"
        });
    }

    const datosNormalizados = { ...datos };

    for (const campo of ["id_cliente", "id_categoria"]) {
        if (datosNormalizados[campo] !== undefined) {
            const valor = Number(datosNormalizados[campo]);

            if (!Number.isInteger(valor) || valor <= 0) {
                return res.status(400).json({
                    mensaje: `${campo} debe ser un entero positivo`
                });
            }

            datosNormalizados[campo] = valor;
        }
    }

    if (datosNormalizados.id_tecnico !== undefined) {
        if (
            datosNormalizados.id_tecnico !== null &&
            datosNormalizados.id_tecnico !== ""
        ) {
            const tecnicoId = Number(datosNormalizados.id_tecnico);

            if (!Number.isInteger(tecnicoId) || tecnicoId <= 0) {
                return res.status(400).json({
                    mensaje: "id_tecnico debe ser un entero positivo o null"
                });
            }

            datosNormalizados.id_tecnico = tecnicoId;
        } else {
            datosNormalizados.id_tecnico = null;
        }
    }

    try {
        const pool = await conectarDB();
        const request = pool.request();

        const asignaciones = [];

        const tipos = {
            titulo: sql.NVarChar(300),
            descripcion: sql.NVarChar(sql.MAX),
            estado: sql.NVarChar(40),
            prioridad: sql.NVarChar(20),
            id_cliente: sql.Int,
            id_tecnico: sql.Int,
            id_categoria: sql.Int
        };

        for (const campo of camposRecibidos) {
            let valor = datosNormalizados[campo];

            if (typeof valor === "string") {
                valor = valor.trim();
            }

            request.input(campo, tipos[campo], valor);
            asignaciones.push(`${campo} = @${campo}`);
        }

        request.input("id_ticket", sql.Int, id);

        const resultado = await request.query(`
            UPDATE tickets
            SET ${asignaciones.join(", ")},
                fecha_actualizacion = GETDATE()
            WHERE id_ticket = @id_ticket;

            SELECT *
            FROM tickets
            WHERE id_ticket = @id_ticket;
        `);

        const ticketActualizado = resultado.recordset?.[0];

        if (!ticketActualizado) {
            return res.status(404).json({
                mensaje: "No se encontró el ticket con ese ID"
            });
        }

        return res.status(200).json({
            mensaje: "Ticket actualizado correctamente",
            ticket: ticketActualizado
        });
    } catch (error) {
        console.error("Error al actualizar ticket:", error.message);
        console.error("Código SQL:", error.number);
        console.error(
            "Detalles SQL:",
            error.originalError?.message
        );

        if (error.number === 547) {
            return res.status(400).json({
                mensaje:
                    "El estado, la prioridad o uno de los IDs incumple una restricción de la base de datos"
            });
        }

        return res.status(500).json({
            mensaje: "Error interno al actualizar el ticket"
        });
    }
});


 // DELETE /api/tickets/:id
 // Eliminar un ticket existente
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: "El ID debe ser un entero positivo"
        });
    }

    try {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input("id_ticket", sql.Int, id)
            .query(`
                DELETE FROM tickets
                OUTPUT DELETED.id_ticket
                WHERE id_ticket = @id_ticket
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró un ticket con ese ID"
            });
        }

        return res.status(200).json({
            mensaje: "Ticket eliminado correctamente",
            id_ticket: resultado.recordset[0].id_ticket
        });
    } catch (error) {
        console.error("Error al eliminar ticket:", error.message);
        console.error("Código SQL:", error.number);

        if (error.number === 547) {
            return res.status(409).json({
                mensaje:
                    "No se puede eliminar el ticket porque tiene registros relacionados"
            });
        }

        return res.status(500).json({
            mensaje: "Error interno al eliminar el ticket"
        });
    }
});


module.exports = router;
