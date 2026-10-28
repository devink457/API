import { BrowserRouter, NavLink, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <h2>Soporte TI</h2>

          <nav>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/tickets">Tickets</NavLink>
          </nav>
        </aside>

        <main className="contenido">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;