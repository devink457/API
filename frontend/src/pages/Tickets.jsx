import { useEffect, useState } from "react";
import {
  obtenerTickets,
  actualizarTicket,
  eliminarTicket,
} from "../services/api";

const estados = [
  "abierto",
  "pendiente",
  "en_proceso",
  "resuelto",
  "cerrado",
];

const prioridades = ["baja", "media", "alta", "critica"];

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargarTickets() {
    setCargando(true);
    setError("");

    try {
      setTickets(await obtenerTickets());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTickets();
  }, []);

  const filtrados = tickets.filter((ticket) => {
    const coincideEstado = !filtro || ticket.estado === filtro;
    const coincideBusqueda =
      ticket.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(ticket.id_cliente).includes(busqueda);

    return coincideEstado && coincideBusqueda;
  });

  async function guardarCambios(e) {
    e.preventDefault();

    try {
      await actualizarTicket(editando.id_ticket, {
        titulo: editando.titulo,
        descripcion: editando.descripcion,
        estado: editando.estado,
        prioridad: editando.prioridad,
      });

      setEditando(null);
      await cargarTickets();
    } catch (err) {
      setError(err.message);
    }
  }

  async function borrarTicket(id) {
    if (!window.confirm("¿Deseas eliminar este ticket?")) return;

    try {
      await eliminarTicket(id);
      await cargarTickets();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="tickets-page">
      <h1>Gestión de Tickets</h1>
      <p>Consulta y administra las solicitudes de soporte técnico.</p>

      <div className="filtros">
        <input
          placeholder="Buscar por título o ID de usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {estado.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p>Cargando tickets...</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((ticket) => (
                <tr key={ticket.id_ticket}>
                  <td>{ticket.id_ticket}</td>
                  <td>{ticket.titulo}</td>
                  <td>{ticket.id_cliente}</td>
                  <td>{ticket.estado.replace("_", " ")}</td>
                  <td>{ticket.prioridad}</td>
                  <td>
                    <button
                      className="btn-editar"
                      onClick={() => setEditando({ ...ticket })}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => borrarTicket(ticket.id_ticket)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <p>No se encontraron tickets.</p>
          )}
        </div>
      )}

      {editando && (
        <div className="modal-fondo">
          <form className="modal" onSubmit={guardarCambios}>
            <h2>Editar Ticket #{editando.id_ticket}</h2>

            <label>Título</label>
            <input
              required
              maxLength={150}
              value={editando.titulo}
              onChange={(e) =>
                setEditando({ ...editando, titulo: e.target.value })
              }
            />

            <label>Descripción</label>
            <textarea
              required
              value={editando.descripcion}
              onChange={(e) =>
                setEditando({ ...editando, descripcion: e.target.value })
              }
            />

            <label>Estado</label>
            <select
              value={editando.estado}
              onChange={(e) =>
                setEditando({ ...editando, estado: e.target.value })
              }
            >
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.replace("_", " ")}
                </option>
              ))}
            </select>

            <label>Prioridad</label>
            <select
              value={editando.prioridad}
              onChange={(e) =>
                setEditando({ ...editando, prioridad: e.target.value })
              }
            >
              {prioridades.map((prioridad) => (
                <option key={prioridad} value={prioridad}>
                  {prioridad}
                </option>
              ))}
            </select>

            <div className="modal-acciones">
              <button type="submit" className="btn-editar">
                Guardar cambios
              </button>
              <button type="button" onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Tickets;