const ROOT = '/api';
async function request(path, options={}) {
  let response;
  try { response = await fetch(`${ROOT}${path}`, { ...options, headers: {'Content-Type':'application/json', ...options.headers} }); }
  catch { throw new Error('No se pudo contactar al backend. Verifica que Express esté activo en el puerto 3000.'); }
  const raw = await response.text();
  let data = {};
  if(raw) { try { data=JSON.parse(raw); } catch { throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}).`); } }
  if(!response.ok) throw new Error(data.mensaje || data.error || `Error HTTP ${response.status}`);
  return data;
}
export const api = {
  tickets: () => request('/tickets').then(x=>x.tickets || []),
  crear: data => request('/tickets',{method:'POST',body:JSON.stringify(data)}),
  editar: (id,data) => request(`/tickets/${id}`,{method:'PUT',body:JSON.stringify(data)}),
  eliminar: id => request(`/tickets/${id}`,{method:'DELETE'}),
  usuarios: () => request('/usuarios').then(x=>x.usuarios || []),
  crearUsuario: data => request('/usuarios',{method:'POST',body:JSON.stringify(data)}),
  categorias: () => request('/categorias').then(x=>x.categorias || []),
};
