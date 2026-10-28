import { useEffect, useState } from "react";
import { obtenerTickets } from "../services/api";

function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerTickets()
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  const contar = (estado) =>
    tickets.filter((ticket) => ticket.estado === estado).length;

  return (
    <div className="dashboard">
      <h1>Panel de Soporte Técnico</h1>
      <p>Administración y seguimiento de solicitudes.</p>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p>Cargando tickets...</p>
      ) : (
        <>
          <div className="estadisticas">
            <div className="tarjeta">
              <h3>Total de Tickets</h3>
              <h2>{tickets.length}</h2>
            </div>

            <div className="tarjeta">
              <h3>Abiertos</h3>
              <h2>{contar("abierto")}</h2>
            </div>

            <div className="tarjeta">
              <h3>En Proceso</h3>
              <h2>{contar("en_proceso")}</h2>
            </div>

            <div className="tarjeta">
              <h3>Resueltos</h3>
              <h2>{contar("resuelto")}</h2>
            </div>
          </div>

          <h2>Tickets recientes</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
              </tr>
            </thead>

            <tbody>
              {tickets.slice(0, 10).map((ticket) => (
                <tr key={ticket.id_ticket}>
                  <td>{ticket.id_ticket}</td>
                  <td>{ticket.titulo}</td>
                  <td>{ticket.estado}</td>
                  <td>{ticket.prioridad}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {tickets.length === 0 && (
            <p>No hay tickets registrados todavía.</p>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;