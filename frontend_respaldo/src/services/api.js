const API_URL = "/api/tickets";

async function solicitar(ruta = "", opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error en la solicitud");
  }

  return datos;
}

export async function obtenerTickets() {
  const datos = await solicitar();
  return datos.tickets;
}

export async function crearTicket(ticket) {
  return solicitar("", {
    method: "POST",
    body: JSON.stringify(ticket),
  });
}

export async function actualizarTicket(id, cambios) {
  return solicitar(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

export async function eliminarTicket(id) {
  return solicitar(`/${id}`, {
    method: "DELETE",
  });
}