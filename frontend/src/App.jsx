
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Plus,
  Search,
  RefreshCcw,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  LifeBuoy,
} from "lucide-react";
import { api } from "./api";
import "./App.css";

const ESTADOS = [
  "abierto",
  "pendiente",
  "en_proceso",
  "resuelto",
  "cerrado",
];

const PRIORIDADES = ["baja", "media", "alta", "critica"];

const bonito = (s) =>
  ({
    en_proceso: "En proceso",
    critica: "Crítica",
  }[s] ||
    (s ? s.charAt(0).toUpperCase() + s.slice(1) : ""));

const vacio = {
  titulo: "",
  descripcion: "",
  id_cliente: "",
  id_tecnico: "",
  id_categoria: "",
  estado: "abierto",
  prioridad: "media",
};

function Mensaje({ error, ok }) {
  return (
    <>
      {error && (
        <div className="alert error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {ok && (
        <div className="alert ok">
          <CheckCircle size={18} />
          {ok}
        </div>
      )}
    </>
  );
}

function Layout() {
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <LifeBuoy />
          <span>
            Soporte <b>TI</b>
          </span>
        </div>

        <div className="side-label">MENÚ PRINCIPAL</div>

        <nav>
          <NavLink to="/" end>
            <LayoutDashboard size={19} /> Dashboard
          </NavLink>

          <NavLink to="/tickets">
            <Ticket size={19} /> Tickets
          </NavLink>

          <NavLink to="/nuevo">
            <Plus size={19} /> Nuevo ticket
          </NavLink>

          <NavLink to="/usuarios">
            <Users size={19} /> Usuarios
          </NavLink>
        </nav>

        <div className="side-footer">
          Sistema de Gestión de Soporte
          <br />
          Versión académica
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Centro de soporte</span>
          <span className="status-dot">Sistema de tickets</span>
        </header>

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/nuevo" element={<FormularioTicket />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="*" element={<div>Página no encontrada</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setTickets(await api.tickets());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tickets, loading, error, refresh };
}

function Dashboard() {
  const { tickets, loading, error, refresh } = useTickets();

  const cards = [
    ["Total de tickets", tickets.length, "total"],
    [
      "Abiertos",
      tickets.filter((x) => x.estado === "abierto").length,
      "abierto",
    ],
    [
      "En proceso",
      tickets.filter((x) => x.estado === "en_proceso").length,
      "en_proceso",
    ],
    [
      "Resueltos",
      tickets.filter((x) => x.estado === "resuelto").length,
      "resuelto",
    ],
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">VISTA GENERAL</p>
          <h1>Panel de soporte técnico</h1>
          <p>Seguimiento de incidencias y solicitudes de la organización.</p>
        </div>

        <NavLink className="btn primary" to="/nuevo">
          <Plus size={17} /> Nuevo ticket
        </NavLink>
      </div>

      <Mensaje error={error} />

      <div className="stats">
        {cards.map(([label, num, key]) => (
          <div className="stat" key={key}>
            <span>{label}</span>
            <strong>{loading ? "—" : num}</strong>
            <small>Solicitudes registradas</small>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-title">
          <h2>Tickets recientes</h2>

          <button className="btn subtle" onClick={refresh}>
            <RefreshCcw size={16} /> Actualizar
          </button>
        </div>

        <Tabla tickets={tickets.slice(0, 8)} loading={loading} simple />
      </div>
    </>
  );
}

function Tabla({
  tickets,
  loading,
  simple = false,
  onEdit,
  onDelete,
  onClose,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Asunto</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Prioridad</th>
            {!simple && <th>Acciones</th>}
          </tr>
        </thead>

        <tbody>
          {!loading &&
            tickets.map((t) => (
              <tr key={t.id_ticket}>
                <td>#{t.id_ticket}</td>
                <td className="subject">{t.titulo}</td>
                <td>{t.id_cliente}</td>

                <td>
                  <span className={`pill estado-${t.estado}`}>
                    {bonito(t.estado)}
                  </span>
                </td>

                <td>
                  <span className={`pill prioridad-${t.prioridad}`}>
                    {bonito(t.prioridad)}
                  </span>
                </td>

                {!simple && (
                  <td>
                    <div className="actions">
                      <button title="Editar" onClick={() => onEdit(t)}>
                        <Edit3 size={17} />
                      </button>

                      {t.estado !== "cerrado" && (
                        <button
                          title="Cerrar ticket"
                          onClick={() => onClose(t)}
                        >
                          <CheckCircle size={17} />
                        </button>
                      )}

                      <button
                        className="danger"
                        title="Eliminar"
                        onClick={() => onDelete(t)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

          {!loading && tickets.length === 0 && (
            <tr>
              <td colSpan={simple ? 5 : 6} className="empty">
                No hay tickets para mostrar.
              </td>
            </tr>
          )}

          {loading && (
            <tr>
              <td colSpan={simple ? 5 : 6} className="empty">
                Cargando tickets...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Tickets() {
  const { tickets, loading, error, refresh } = useTickets();

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [editando, setEditando] = useState(null);
  const [accionError, setAccionError] = useState("");
  const [ok, setOk] = useState("");

  const filtrados = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (!estado || t.estado === estado) &&
          (!prioridad || t.prioridad === prioridad) &&
          (!q ||
            [
              t.titulo,
              t.descripcion,
              String(t.id_cliente),
              String(t.id_ticket),
            ].some((s) =>
              String(s || "")
                .toLowerCase()
                .includes(q.toLowerCase())
            ))
      ),
    [tickets, q, estado, prioridad]
  );

  async function eliminar(t) {
    if (!window.confirm(`¿Eliminar definitivamente el ticket #${t.id_ticket}?`))
      return;

    setAccionError("");
    setOk("");

    try {
      await api.eliminar(t.id_ticket);
      setOk("Ticket eliminado correctamente.");
      await refresh();
    } catch (e) {
      setAccionError(e.message);
    }
  }

  async function cerrar(t) {
    if (!window.confirm(`¿Cerrar el ticket #${t.id_ticket}?`)) return;

    setAccionError("");
    setOk("");

    try {
      await api.editar(t.id_ticket, { estado: "cerrado" });
      setOk("Ticket cerrado correctamente.");
      await refresh();
    } catch (e) {
      setAccionError(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN</p>
          <h1>Gestión de tickets</h1>
          <p>Consulta, actualiza y administra solicitudes de soporte.</p>
        </div>

        <NavLink className="btn primary" to="/nuevo">
          <Plus size={17} /> Crear ticket
        </NavLink>
      </div>

      <Mensaje error={error || accionError} ok={ok} />

      <div className="panel">
        <div className="filters">
          <div className="search">
            <Search size={18} />

            <input
              aria-label="Buscar tickets"
              placeholder="Buscar por asunto, usuario o ID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {bonito(s)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por prioridad"
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
          >
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map((s) => (
              <option key={s} value={s}>
                {bonito(s)}
              </option>
            ))}
          </select>

          <button className="btn subtle" onClick={refresh} title="Actualizar">
            <RefreshCcw size={17} />
          </button>
        </div>

        <div className="count">{filtrados.length} ticket(s)</div>

        <Tabla
          tickets={filtrados}
          loading={loading}
          onEdit={setEditando}
          onDelete={eliminar}
          onClose={cerrar}
        />
      </div>

      {editando && (
        <ModalTicket
          ticket={editando}
          onClose={() => setEditando(null)}
          onSaved={async () => {
            setEditando(null);
            setOk("Ticket actualizado correctamente.");
            await refresh();
          }}
        />
      )}
    </>
  );
}

function CamposTicket({ form, setForm, usuarios, categorias }) {
  const cambiar = (e) =>
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  const tecnicos = usuarios.filter(
    (u) =>
      u.activo !== false &&
      (u.rol === "tecnico" || u.rol === "administrador")
  );

  return (
    <div className="form-grid">
      <label className="full">
        Título *
        <input
          required
          maxLength="150"
          name="titulo"
          value={form.titulo}
          onChange={cambiar}
          placeholder="Ej. Equipo sin conexión a internet"
        />
      </label>

      <label className="full">
        Descripción *
        <textarea
          required
          rows="4"
          name="descripcion"
          value={form.descripcion}
          onChange={cambiar}
          placeholder="Describe el problema..."
        />
      </label>

      <label>
        Usuario solicitante *
        <select
          required
          name="id_cliente"
          value={form.id_cliente}
          onChange={cambiar}
        >
          <option value="">Seleccione un usuario</option>

          {usuarios.map((u) => (
            <option key={u.id_usuario} value={u.id_usuario}>
              {u.nombre} — {u.correo}
            </option>
          ))}
        </select>
      </label>

      <label>
        Categoría *
        <select
          required
          name="id_categoria"
          value={form.id_categoria}
          onChange={cambiar}
        >
          <option value="">Seleccione una categoría</option>

          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Técnico asignado (opcional)
        <select
          name="id_tecnico"
          value={form.id_tecnico ?? ""}
          onChange={cambiar}
        >
          <option value="">Sin asignar</option>

          {tecnicos.map((u) => (
            <option key={u.id_usuario} value={u.id_usuario}>
              {u.nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Prioridad
        <select
          name="prioridad"
          value={form.prioridad}
          onChange={cambiar}
        >
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {bonito(p)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Estado
        <select name="estado" value={form.estado} onChange={cambiar}>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {bonito(s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function normalizar(form) {
  return {
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    estado: form.estado,
    prioridad: form.prioridad,
    id_cliente: Number(form.id_cliente),
    id_categoria: Number(form.id_categoria),
    id_tecnico: form.id_tecnico ? Number(form.id_tecnico) : null,
  };
}

function FormularioTicket() {
  const [form, setForm] = useState({ ...vacio });
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [listaUsuarios, listaCategorias] = await Promise.all([
          api.usuarios(),
          api.categorias(),
        ]);

        if (activo) {
          setUsuarios(listaUsuarios);
          setCategorias(listaCategorias);
        }
      } catch (e) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargandoCatalogos(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    try {
      await api.crear(normalizar(form));
      navigate("/tickets");
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">SOLICITUD NUEVA</p>
          <h1>Crear ticket</h1>
          <p>Registra una incidencia para su seguimiento.</p>
        </div>
      </div>

      <div className="panel form-panel">
        <Mensaje error={error} />

        {cargandoCatalogos ? (
          <p>Cargando usuarios y categorías...</p>
        ) : (
          <form onSubmit={guardar}>
            <CamposTicket
              form={form}
              setForm={setForm}
              usuarios={usuarios}
              categorias={categorias}
            />

            <div className="form-actions">
              <button
                className="btn primary"
                disabled={guardando || !usuarios.length || !categorias.length}
              >
                {guardando ? "Guardando..." : "Registrar ticket"}
              </button>

              <button
                type="button"
                className="btn subtle"
                onClick={() => navigate("/tickets")}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function ModalTicket({ ticket, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...ticket,
    id_cliente: String(ticket.id_cliente ?? ""),
    id_categoria: String(ticket.id_categoria ?? ""),
    id_tecnico:
      ticket.id_tecnico == null ? "" : String(ticket.id_tecnico),
  });

  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [listaUsuarios, listaCategorias] = await Promise.all([
          api.usuarios(),
          api.categorias(),
        ]);

        if (activo) {
          setUsuarios(listaUsuarios);
          setCategorias(listaCategorias);
        }
      } catch (e) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  async function guardar(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await api.editar(ticket.id_ticket, normalizar(form));
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Editar ticket"
      >
        <div className="modal-head">
          <h2>Editar ticket #{ticket.id_ticket}</h2>

          <button onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <Mensaje error={error} />

        {cargando ? (
          <p>Cargando usuarios y categorías...</p>
        ) : (
          <form onSubmit={guardar}>
            <CamposTicket
              form={form}
              setForm={setForm}
              usuarios={usuarios}
              categorias={categorias}
            />

            <div className="form-actions">
              <button
                className="btn primary"
                disabled={busy || !usuarios.length || !categorias.length}
              >
                {busy ? "Guardando..." : "Guardar cambios"}
              </button>

              <button type="button" className="btn subtle" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    contra: "",
    rol: "cliente",
  });

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      setUsuarios(await api.usuarios());
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function guardar(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");

    try {
      await api.crearUsuario(form);

      setForm({
        nombre: "",
        correo: "",
        contra: "",
        rol: "cliente",
      });

      setOk("Usuario registrado correctamente.");
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">PERSONAS</p>
          <h1>Gestión de usuarios</h1>
          <p>Consulta y registra usuarios del sistema.</p>
        </div>
      </div>

      <Mensaje error={error} ok={ok} />

      <div className="users-grid">
        <section className="panel">
          <h2>Usuarios registrados</h2>

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id_usuario}>
                      <td>{u.id_usuario}</td>
                      <td>{u.nombre}</td>
                      <td>{u.correo}</td>
                      <td>{bonito(u.rol)}</td>
                    </tr>
                  ))}

                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Registrar usuario</h2>

          <form onSubmit={guardar} className="user-form">
            <label>
              Nombre
              <input
                required
                maxLength="100"
                value={form.nombre}
                onChange={(e) =>
                  setForm({ ...form, nombre: e.target.value })
                }
              />
            </label>

            <label>
              Correo
              <input
                required
                type="email"
                maxLength="150"
                value={form.correo}
                onChange={(e) =>
                  setForm({ ...form, correo: e.target.value })
                }
              />
            </label>

            <label>
              Contraseña
              <input
                required
                type="password"
                minLength="8"
                maxLength="72"
                value={form.contra}
                onChange={(e) =>
                  setForm({ ...form, contra: e.target.value })
                }
              />
            </label>

            <label>
              Rol
              <select
                value={form.rol}
                onChange={(e) =>
                  setForm({ ...form, rol: e.target.value })
                }
              >
                <option value="cliente">Cliente</option>
                <option value="tecnico">Técnico</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>

            <button className="btn primary" disabled={busy}>
              {busy ? "Guardando..." : "Registrar usuario"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
