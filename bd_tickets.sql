
-- PROYECTO: SISTEMA DE SOPORTE / TICKETS

IF DB_ID(N'soporte_tickets') IS NULL
BEGIN
    CREATE DATABASE soporte_tickets;
END;
GO

USE soporte_tickets;
GO

-- 1. TABLA: USUARIOS
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    correo NVARCHAR(150) NOT NULL UNIQUE,
    contra NVARCHAR(255) NOT NULL,
    rol NVARCHAR(20) NOT NULL CONSTRAINT DF_usuarios_rol DEFAULT N'cliente',
    activo BIT NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT 1,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_usuarios_fecha DEFAULT SYSDATETIME(),
    CONSTRAINT CK_usuarios_rol CHECK (rol IN (
	N'cliente', N'tecnico', N'administrador'))
);

-- 2. TABLA: CATEGORIAS
CREATE TABLE categorias (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(255) NULL,
    activa BIT NOT NULL CONSTRAINT DF_categorias_activa DEFAULT 1
);

-- 3. TABLA: TICKETS
CREATE TABLE tickets (
    id_ticket INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    estado NVARCHAR(20) NOT NULL CONSTRAINT DF_tickets_estado DEFAULT N'abierto',
    prioridad NVARCHAR(10) NOT NULL CONSTRAINT DF_tickets_prioridad DEFAULT N'media',
    id_cliente INT NOT NULL,
    id_tecnico INT NULL,
    id_categoria INT NOT NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_tickets_fecha_creacion DEFAULT SYSDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL CONSTRAINT DF_tickets_fecha_actualizacion DEFAULT SYSDATETIME(),
    fecha_cierre DATETIME2 NULL,
    CONSTRAINT CK_tickets_estado
        CHECK (estado IN (
            N'abierto',
            N'en_proceso',
            N'pendiente',
            N'resuelto',
            N'cerrado'
        )),
    CONSTRAINT CK_tickets_prioridad
        CHECK (prioridad IN (
            N'baja', N'media', N'alta', N'critica'
        )),
    CONSTRAINT FK_tickets_cliente
        FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario)
            ON DELETE NO ACTION,
    CONSTRAINT FK_tickets_tecnico
        FOREIGN KEY (id_tecnico) REFERENCES usuarios(id_usuario)
            ON DELETE SET NULL,
    CONSTRAINT FK_tickets_categoria
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
            ON DELETE NO ACTION
);

-- 4. TABLA: RESPUESTAS
CREATE TABLE respuestas (
    id_respuesta INT IDENTITY(1,1) PRIMARY KEY,
    id_ticket INT NOT NULL,
    id_usuario INT NOT NULL,
    mensaje NVARCHAR(MAX) NOT NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_respuestas_fecha DEFAULT SYSDATETIME(),
    CONSTRAINT FK_respuestas_ticket
        FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE CASCADE,
    CONSTRAINT FK_respuestas_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE NO ACTION
);

-- 5. TABLA: HISTORIAL DE ESTADOS
CREATE TABLE historial_estados (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_ticket INT NOT NULL,
    id_usuario INT NULL,
    estado_anterior NVARCHAR(20) NULL,
    estado_nuevo NVARCHAR(20) NOT NULL,
    comentario NVARCHAR(255) NULL,
    fecha_cambio DATETIME2 NOT NULL CONSTRAINT DF_historial_fecha DEFAULT SYSDATETIME(),
    CONSTRAINT CK_historial_estado_anterior
        CHECK (
            estado_anterior IS NULL OR
            estado_anterior IN (
                N'abierto', N'en_proceso', N'pendiente',
                N'resuelto', N'cerrado'
            )
        ),
    CONSTRAINT CK_historial_estado_nuevo
        CHECK (estado_nuevo IN (
            N'abierto', N'en_proceso', N'pendiente',
            N'resuelto', N'cerrado'
        )),
    CONSTRAINT FK_historial_ticket
        FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE CASCADE,
        CONSTRAINT FK_historial_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL
);

-- DATOS DE DEMOSTRACIÓN (USUARIOS)
IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE correo = N'ana@demo.com'
)
BEGIN
    INSERT INTO usuarios
        (nombre, correo, contra, rol)
    VALUES
        (N'Ana Martinez', N'ana@demo.com',
         N'hola123', N'cliente');
END;

IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE correo = N'carlos@demo.com'
)
BEGIN
    INSERT INTO usuarios
        (nombre, correo, contra, rol)
    VALUES
        (N'Carlos Lopez', N'carlos@demo.com',
         N'holi123', N'cliente');
END;

IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE correo = N'luis@demo.com'
)
BEGIN
    INSERT INTO dbo.usuarios
        (nombre, correo, contra, rol)
    VALUES
        (N'Luis Ramirez', N'luis@demo.com',
         N'holus123', N'tecnico');
END;
GO

-- DATOS DE DEMOSTRACIÓN (CATEGORIAS)
IF NOT EXISTS (
    SELECT 1 FROM categorias
    WHERE nombre = N'Hardware'
)
    INSERT INTO categorias (nombre, descripcion)
    VALUES (N'Hardware', N'Problemas con equipos y componentes');

IF NOT EXISTS (
    SELECT 1 FROM categorias
    WHERE nombre = N'Software'
)
    INSERT INTO categorias (nombre, descripcion)
    VALUES (N'Software', N'Errores de programas y aplicaciones');

IF NOT EXISTS (
    SELECT 1 FROM categorias
    WHERE nombre = N'Redes'
)
    INSERT INTO categorias (nombre, descripcion)
    VALUES (N'Redes', N'Problemas de conexion e internet');

IF NOT EXISTS (
    SELECT 1 FROM categorias
    WHERE nombre = N'Cuentas'
)
    INSERT INTO dbo.categorias (nombre, descripcion)
    VALUES (N'Cuentas', N'Accesos, contrasenas y permisos');

IF NOT EXISTS (
    SELECT 1 FROM categorias
    WHERE nombre = N'Otros'
)
    INSERT INTO categorias (nombre, descripcion)
    VALUES (N'Otros', N'Solicitudes generales de soporte');
GO

-- DATOS DE DEMOSTRACIÓN (TICKETS)
IF NOT EXISTS (
    SELECT 1 FROM tickets
    WHERE titulo = N'Computadora no enciende'
)
BEGIN
    INSERT INTO tickets (
        titulo, descripcion, estado, prioridad,
        id_cliente, id_tecnico, id_categoria
    )
    VALUES (
        N'Computadora no enciende',
        N'El equipo no enciende al presionar el boton.',
        N'en_proceso', N'alta',
        (SELECT id_usuario FROM usuarios
         WHERE correo = N'ana@demo.com'),
        (SELECT id_usuario FROM usuarios
         WHERE correo = N'luis@demo.com'),
        (SELECT id_categoria FROM categorias
         WHERE nombre = N'Hardware')
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM tickets
    WHERE titulo = N'Error al abrir la aplicacion'
)
BEGIN
    INSERT INTO tickets (
        titulo, descripcion, estado, prioridad,
        id_cliente, id_tecnico, id_categoria
    )
    VALUES (
        N'Error al abrir la aplicacion',
        N'La aplicacion muestra un error al iniciar.',
        N'abierto', N'media',
        (SELECT id_usuario FROM usuarios
         WHERE correo = N'carlos@demo.com'),
        NULL,
        (SELECT id_categoria FROM categorias
         WHERE nombre = N'Software')
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM tickets
    WHERE titulo = N'Sin acceso a internet'
)
BEGIN
    INSERT INTO tickets (
        titulo, descripcion, estado, prioridad,
        id_cliente, id_tecnico, id_categoria
    )
    VALUES (
        N'Sin acceso a internet',
        N'El equipo esta conectado a la red, pero no navega.',
        N'resuelto', N'critica',
        (SELECT id_usuario FROM usuarios
         WHERE correo = N'ana@demo.com'),
        (SELECT id_usuario FROM usuarios
         WHERE correo = N'luis@demo.com'),
        (SELECT id_categoria FROM categorias
         WHERE nombre = N'Redes')
    );
END;
GO

-- DATOS DE DEMOSTRACIÓN (RESPUESTAS)
IF NOT EXISTS (
    SELECT 1 FROM respuestas
    WHERE id_ticket = (
        SELECT id_ticket FROM tickets
        WHERE titulo = N'Computadora no enciende'
    )
    AND mensaje = N'El equipo dejo de encender esta manana.'
)
BEGIN
    INSERT INTO respuestas (id_ticket, id_usuario, mensaje)
    SELECT t.id_ticket, u.id_usuario,
           N'El equipo dejo de encender esta manana.'
    FROM dbo.tickets t
    CROSS JOIN usuarios u
    WHERE t.titulo = N'Computadora no enciende'
      AND u.correo = N'ana@demo.com';
END;

IF NOT EXISTS (
    SELECT 1 FROM respuestas
    WHERE id_ticket = (
        SELECT id_ticket FROM dbo.tickets
        WHERE titulo = N'Computadora no enciende'
    )
    AND mensaje = N'Estamos revisando la fuente de alimentacion.'
)
BEGIN
    INSERT INTO respuestas (id_ticket, id_usuario, mensaje)
    SELECT t.id_ticket, u.id_usuario,
           N'Estamos revisando la fuente de alimentacion.'
    FROM tickets t
    CROSS JOIN usuarios u
    WHERE t.titulo = N'Computadora no enciende'
      AND u.correo = N'luis@demo.com';
END;

IF NOT EXISTS (
    SELECT 1 FROM respuestas
    WHERE id_ticket = (
        SELECT id_ticket FROM tickets
        WHERE titulo = N'Error al abrir la aplicacion'
    )
    AND mensaje = N'El error aparece al iniciar el programa.'
)
BEGIN
    INSERT INTO respuestas (id_ticket, id_usuario, mensaje)
    SELECT t.id_ticket, u.id_usuario,
           N'El error aparece al iniciar el programa.'
    FROM tickets t
    CROSS JOIN usuarios u
    WHERE t.titulo = N'Error al abrir la aplicacion'
      AND u.correo = N'carlos@demo.com';
END;

IF NOT EXISTS (
    SELECT 1 FROM respuestas
    WHERE id_ticket = (
        SELECT id_ticket FROM tickets
        WHERE titulo = N'Sin acceso a internet'
    )
    AND mensaje = N'La conexion fue restablecida correctamente.'
)
BEGIN
    INSERT INTO respuestas (id_ticket, id_usuario, mensaje)
    SELECT t.id_ticket, u.id_usuario,
           N'La conexion fue restablecida correctamente.'
    FROM tickets t
    CROSS JOIN usuarios u
    WHERE t.titulo = N'Sin acceso a internet'
      AND u.correo = N'luis@demo.com';
END;
GO

-- DATOS DE DEMOSTRACIÓN (HISTORIAL)
IF NOT EXISTS (
    SELECT 1 FROM historial_estados h
    INNER JOIN tickets t ON t.id_ticket = h.id_ticket
    WHERE t.titulo = N'Computadora no enciende'
      AND h.estado_nuevo = N'en_proceso'
)
BEGIN
    INSERT INTO historial_estados (
        id_ticket, id_usuario, estado_anterior,
        estado_nuevo, comentario
    )
    SELECT t.id_ticket, u.id_usuario, N'abierto',
           N'en_proceso', N'El tecnico comenzo el diagnostico.'
    FROM tickets t
    CROSS JOIN usuarios u
    WHERE t.titulo = N'Computadora no enciende'
      AND u.correo = N'luis@demo.com';
END;

IF NOT EXISTS (
    SELECT 1 FROM historial_estados h
    INNER JOIN tickets t ON t.id_ticket = h.id_ticket
    WHERE t.titulo = N'Sin acceso a internet'
      AND h.estado_nuevo = N'resuelto'
)
BEGIN
    INSERT INTO historial_estados (
        id_ticket, id_usuario, estado_anterior,
        estado_nuevo, comentario
    )
    SELECT t.id_ticket, u.id_usuario, N'en_proceso',
           N'resuelto', N'Conexion restablecida correctamente.'
    FROM tickets t
    CROSS JOIN usuarios u
    WHERE t.titulo = N'Sin acceso a internet'
      AND u.correo = N'luis@demo.com';
END;
GO

-- CONSULTAS DE VERIFICACION
-- Ver todos los usuarios.
SELECT * FROM usuarios;

-- Ver todas las categorias.
SELECT * FROM categorias;

-- Ver todos los tickets con cliente, tecnico y categoria.
SELECT
    t.id_ticket,
    t.titulo,
    t.estado,
    t.prioridad,
    c.nombre AS cliente,
    te.nombre AS tecnico,
    ca.nombre AS categoria,
    t.fecha_creacion
FROM tickets AS t
INNER JOIN .usuarios AS c
    ON t.id_cliente = c.id_usuario
LEFT JOIN usuarios AS te
    ON t.id_tecnico = te.id_usuario
INNER JOIN categorias AS ca
    ON t.id_categoria = ca.id_categoria
ORDER BY t.fecha_creacion DESC;

-- Consultar las respuestas del primer ticket.
SELECT
    r.id_respuesta,
    u.nombre AS autor,
    u.rol,
    r.mensaje,
    r.fecha_creacion
FROM respuestas AS r
INNER JOIN usuarios AS u
    ON r.id_usuario = u.id_usuario
WHERE r.id_ticket = (
    SELECT id_ticket FROM tickets
    WHERE titulo = N'Computadora no enciende'
)
ORDER BY r.fecha_creacion ASC;

-- Consultar el historial de un ticket.
SELECT
    h.estado_anterior,
    h.estado_nuevo,
    h.comentario,
    u.nombre AS responsable,
    h.fecha_cambio
FROM historial_estados AS h
LEFT JOIN usuarios AS u
    ON h.id_usuario = u.id_usuario
WHERE h.id_ticket = (
    SELECT id_ticket FROM tickets
    WHERE titulo = N'Computadora no enciende'
)
ORDER BY h.fecha_cambio ASC;

-- Verificar las cinco tablas.
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
GO
