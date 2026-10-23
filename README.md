# API de Soporte de Tickets

API REST para administrar tickets de soporte, desarrollada con Node.js, Express y SQL Server.

**Repositorio:** https://github.com/devink457/API

## Tecnologías

- Node.js y npm
- Express
- Microsoft SQL Server
- `mssql` y `msnodesqlv8` para la conexión con SQL Server mediante autenticación de Windows
- Nodemon para desarrollo

## Requisitos previos

Antes de iniciar el proyecto, necesitas:

1. Node.js y npm instalados.
2. SQL Server, por ejemplo SQL Server Express.
3. SQL Server Management Studio (SSMS) para ejecutar el script de la base de datos.
4. ODBC Driver 17 for SQL Server.
5. Un usuario de Windows con permisos para acceder a SQL Server.

## Instalación

Clona el repositorio y entra en la carpeta:

```bash
git clone https://github.com/devink457/API.git
cd API
```

Instala las dependencias:

```bash
npm install
```

## Configuración de la base de datos

La configuración actual de `src/config/db.js` utiliza los siguientes valores:

| Parámetro | Valor |
|---|---|
| Instancia de SQL Server | `localhost\SQLEXPRESS` |
| Base de datos | `soporte_tickets` |
| Controlador ODBC | `ODBC Driver 17 for SQL Server` |
| Autenticación | Windows |

Si tu instancia tiene otro nombre, modifica la cadena de conexión en `src/config/db.js`.

### Crear la base de datos

1. Abre SQL Server Management Studio y conéctate a tu instancia.
2. Abre el archivo `bd_tickets.sql` de la raíz del proyecto.
3. Ejecuta el script para crear la base de datos, las tablas y los datos de demostración.
4. Verifica que tu usuario de Windows tenga permisos para acceder a la base de datos.

**Importante:** el script crea las tablas y está pensado para preparar una base de datos nueva. No lo ejecutes repetidamente sobre una base que ya contiene esas tablas, porque las instrucciones `CREATE TABLE` pueden fallar.

## Ejecutar el servidor

Para iniciar el servidor:

```bash
npm start
```

Para desarrollo con Nodemon:

```bash
npm run dev
```

El servidor escucha en:

`http://localhost:3000`

## Rutas disponibles

### Servidor y conexión a la base de datos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Comprueba que el servidor está activo. |
| GET | `/api/health/db` | Comprueba la conexión a SQL Server. |

### CRUD de tickets

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tickets` | Obtiene todos los tickets. |
| GET | `/api/tickets/:id` | Obtiene un ticket por su ID. |
| POST | `/api/tickets` | Crea un ticket. |
| PUT | `/api/tickets/:id` | Actualiza un ticket existente. |
| DELETE | `/api/tickets/:id` | Elimina un ticket. |

Las respuestas se envían en formato JSON. Para las solicitudes `POST` y `PUT`, utiliza el encabezado:

```text
Content-Type: application/json
```

### Ejemplo: crear un ticket

Envía una solicitud `POST` a `http://localhost:3000/api/tickets` con este cuerpo JSON:

```json
{
  "titulo": "La computadora no enciende",
  "descripcion": "El equipo no responde al presionar el botón de encendido.",
  "id_cliente": 1,
  "id_categoria": 1,
  "id_tecnico": null,
  "estado": "abierto",
  "prioridad": "media"
}
```

Los campos obligatorios son `titulo`, `descripcion`, `id_cliente` e `id_categoria`.

- `id_tecnico` puede ser un ID válido o `null`.
- Si se omite `estado`, se utiliza `abierto`.
- Si se omite `prioridad`, se utiliza `media`.
- Los estados permitidos son `abierto`, `pendiente`, `en_proceso`, `resuelto` y `cerrado`.
- Las prioridades permitidas son `baja`, `media`, `alta` y `critica`.
- Los IDs relacionados deben existir en la base de datos.

### Ejemplo: actualizar un ticket

Envía una solicitud `PUT` a `http://localhost:3000/api/tickets/1`:

```json
{
  "estado": "en_proceso",
  "prioridad": "alta"
}
```

Solo se actualizan los campos permitidos que se envían en la solicitud.

## Códigos HTTP

La API utiliza códigos HTTP para indicar el resultado de las operaciones:

- `200 OK`: consulta o actualización exitosa.
- `201 Created`: ticket creado correctamente.
- `400 Bad Request`: datos inválidos.
- `404 Not Found`: ruta o ticket no encontrado.
- `409 Conflict`: conflicto al eliminar un ticket por restricciones relacionadas.
- `500 Internal Server Error`: error interno del servidor o de la base de datos.

## Solución de problemas

### No se puede conectar con SQL Server

1. Comprueba que el servicio de SQL Server esté iniciado.
2. Verifica el nombre de la instancia en `src/config/db.js`.
3. Confirma que esté instalado ODBC Driver 17 for SQL Server.
4. Comprueba que exista la base de datos `soporte_tickets`.
5. Verifica los permisos de tu usuario de Windows.
6. Abre `http://localhost:3000/api/health/db` para probar la conexión.

### El servidor no inicia

- Ejecuta `npm install`.
- Comprueba que el puerto `3000` no esté ocupado.
- Revisa los mensajes de error de la terminal.

## Integración con el frontend

La URL base local de la API es `http://localhost:3000`.

Las rutas de tickets se encuentran bajo `/api/tickets`.

Si el frontend se ejecuta desde otro origen o puerto, puede ser necesario configurar CORS en el backend para permitir las solicitudes del navegador.

Cada integrante debe configurar su propia instancia de SQL Server y preparar la base de datos localmente.

## Estructura principal

```text
API/
├── bd_tickets.sql
├── package.json
└── src/
    ├── server.js
    ├── config/
    │   └── db.js
    └── routes/
        └── tickets.routes.js
```
