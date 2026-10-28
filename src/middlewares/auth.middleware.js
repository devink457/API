
const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "Acceso denegado. Token requerido.",
    });
  }

  const token = autorizacion.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      mensaje: "Token no proporcionado.",
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        mensaje: "Error de configuración del servidor.",
      });
    }

    const datos = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.usuario = datos;
    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: "Token inválido o expirado.",
    });
  }
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado.",
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: "No tienes permisos para realizar esta acción.",
      });
    }

    next();
  };
}

module.exports = {
  verificarToken,
  permitirRoles,
};
