
const BASE_URL = "/api";

async function peticion(ruta, opciones = {}) {
  const sesion = JSON.parse(
    sessionStorage.getItem("soporte_ti_sesion") || "null"
  );

  const token = sesion?.token;

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (respuesta.status === 401 && token) {
    sessionStorage.removeItem("soporte_ti_sesion");
    window.location.reload();
    throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  }

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al comunicarse con el servidor");
  }

  return datos;
}

export const api = {
  // TICKETS
  tickets: async () => {
    const datos = await peticion("/tickets");
    return datos.tickets || [];
  },

  crear: (ticket) =>
    peticion("/tickets", {
      method: "POST",
      body: JSON.stringify(ticket),
    }),

  editar: (id, ticket) =>
    peticion(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(ticket),
    }),

  eliminar: (id) =>
    peticion(`/tickets/${id}`, {
      method: "DELETE",
    }),

  // USUARIOS
  usuarios: async () => {
    const datos = await peticion("/usuarios");
    return datos.usuarios || [];
  },

  crearUsuario: (usuario) =>
    peticion("/usuarios", {
      method: "POST",
      body: JSON.stringify(usuario),
    }),

  // CATEGORÍAS
  categorias: async () => {
    const datos = await peticion("/categorias");
    return datos.categorias || [];
  },
};
