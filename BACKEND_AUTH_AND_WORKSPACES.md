# Contrato del backend: autenticación, predios, lotes y proyectos

Este documento describe los endpoints que el frontend consume actualmente y los
contratos adicionales necesarios para completar el registro con Google y la
configuración de espacios de trabajo. Los endpoints nuevos de predios, lotes,
proyectos y OAuth deben implementarse en el backend antes de habilitar esos flujos
en producción.

## 1. Convenciones comunes

- Base URL configurable en el frontend con `VITE_API_BASE_URL`.
- JSON UTF-8 para solicitudes y respuestas. En errores, devolver `detail`, `message`
  o `error_description` para que el frontend pueda mostrar el motivo.
- Respuestas de validación: `400` o `422`; no autenticado: `401`; sin permisos:
  `403`; recurso inexistente o no visible para el usuario: `404`; conflicto de
  correo/nombre: `409`.
- Todos los endpoints de recursos personales deben validar un bearer access token
  y filtrar por el usuario autenticado en el servidor. Nunca confiar en un `user_id`
  enviado por el navegador para autorizar el acceso.
- CORS debe permitir el origen exacto del frontend en desarrollo y producción,
  admitir `Authorization` y `Content-Type`, y los métodos HTTP usados por el API.
- Los IDs de ruta deben aceptar los identificadores emitidos por el backend. Las
  rutas con IDs deben codificarse/validarse y no deben revelar recursos de otro
  usuario.

## 2. Autenticación existente

Estos son los contratos que el frontend ya usa. El registro conserva su endpoint y
payload actuales: `POST /auth/register` con `email`, `password` y `full_name`.

| Método y ruta | Autenticación | Solicitud | Respuesta esperada |
|---|---|---|---|
| `POST /auth/register` | Pública | `{ "email": "...", "password": "...", "full_name": "..." }` | Crear la cuenta. Puede devolver una sesión (`access_token` y usuario) o indicar que falta confirmar correo; nunca incluir contraseña. |
| `POST /auth/login` | Pública | `{ "email": "...", "password": "..." }` | Sesión con access token y usuario. Credenciales incorrectas deben responder `401`. |
| `GET /auth/me` | Bearer | Sin body | Usuario autenticado, al menos `{ "id": "...", "email": "...", "name": "..." }` o campos equivalentes. El frontend también entiende `user_metadata.full_name` y `full_name`. |
| `GET /` | Según configuración | Sin body | Verificación de disponibilidad del servicio. |

El frontend tolera la sesión en la raíz o bajo `data`, y el usuario en `user` o
`session.user`. El token puede llamarse `access_token` o `accessToken`. Conviene
normalizar el API a `{ "access_token": "...", "user": { "id", "email", "full_name" } }`.
Si el registro no devuelve token (por confirmación de correo), la pantalla muestra
una confirmación y un botón directo para ir al login.

El cliente actual conserva el access token en almacenamiento del navegador y lo
envía como bearer. No existe aún integración frontend de refresh ni endpoint de
logout remoto: documentar/configurar expiración, revocación y renovación de tokens
antes de depender de sesiones largas.

## 3. Registro e inicio con Google

El frontend habilita el botón solo con API mode y
`VITE_GOOGLE_AUTH_ENABLED="true"`. Esa variable es una bandera de interfaz, no una
credencial. Los secretos de Google deben existir únicamente en el backend.

### Endpoints requeridos

| Método y ruta | Auth | Contrato |
|---|---|---|
| `GET /auth/google` | Pública | Inicia OAuth/OIDC y devuelve `{ "authorization_url": "https://..." }`. La URL debe incluir `state`, scopes `openid email profile` y el callback registrado del backend. |
| `GET /auth/google/callback/google` | Pública, callback del proveedor | Ruta backend que recibe el `code` y `state` de Google, valida state/PKCE, intercambia el código con Google, verifica email e identidad, y crea o vincula el usuario local. Esta ruta no la llama directamente el frontend. |
| `POST /auth/google/callback` | Pública, canje de código de un solo uso | Body `{ "code": "<código-opaco-de-un-solo-uso>" }`. Devuelve la sesión en el mismo formato compatible con `POST /auth/login`. El código debe expirar rápidamente, ser de un solo uso y estar asociado a la transacción iniciada. |

Secuencia:

1. El frontend solicita `GET /auth/google` y navega a `authorization_url`.
2. Google vuelve al callback backend registrado. El backend verifica `state`, valida
   los datos OIDC y vincula la cuenta usando el `sub` estable de Google (no solo el
   correo como identificador).
3. El backend redirige al frontend a `/auth/callback?code=<código-opaco>`. No poner
   access tokens, refresh tokens, client secrets ni tokens de Google en la URL.
4. El frontend elimina el código de la barra de direcciones y lo canjea en
   `POST /auth/google/callback`. El backend invalida el código después del canje.
5. El frontend valida la sesión con `GET /auth/me` y abre el espacio de trabajo.

### Configuración del proveedor

Configurar en el backend/gestor de secretos (nombres de ejemplo):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` (secreto; nunca prefijar con `VITE_`)
- `GOOGLE_REDIRECT_URI` con la URL exacta del callback del backend
- `FRONTEND_ORIGIN` y `FRONTEND_AUTH_CALLBACK_URL`
- Scopes mínimos: `openid email profile`
- Dominios/orígenes y redirect URIs autorizados en Google Cloud Console, con HTTPS
  en producción.

Registrar el proveedor Google en el servicio de identidad utilizado (por ejemplo,
Supabase Auth) y configurar la URL de retorno allí también. Si se usa Supabase
directamente en el servidor, el backend debe seguir siendo quien valida la sesión y
emite el formato esperado por el frontend.

## 4. Predios y lotes: onboarding y selector

El primer acceso autenticado consulta `GET /lotes`. Si el usuario no tiene lotes,
el frontend muestra el formulario inicial. Al crear un predio se crea su primer
lote en la misma operación; luego se crea un proyecto inicial. Los lotes y
proyectos existentes se pueden alternar desde el selector de la barra superior.

### Endpoints requeridos por los cambios

| Método y ruta | Auth | Solicitud / respuesta |
|---|---|---|
| `GET /lotes` | Bearer | Devuelve todos y solo los lotes visibles para el usuario: `{ "lotes": [{ "id", "nombre", "predio_id", "predio_nombre", "area_ha", "municipio", "departamento" }] }`. Se acepta también una lista directamente. |
| `POST /predios` | Bearer | Crea predio y primer lote atómicamente. Body: `{ "nombre", "municipio", "departamento", "area_ha", "primer_lote": { "nombre", "area_ha" } }`. Devuelve `{ "predio": { "id", "nombre", ... }, "lote": { "id", "predio_id", "nombre", "predio_nombre", "area_ha", ... } }`. |
| `POST /predios/{predio_id}/lotes` | Bearer | Agrega un lote a un predio propiedad/compartido con el usuario. Body: `{ "nombre", "area_ha" }`. Devuelve el lote creado con `id` y `predio_id`. |
| `GET /lotes/{lote_id}/proyectos` | Bearer | Lista proyectos del lote y del usuario: `{ "proyectos": [{ "id", "lote_id", "nombre", "fase" }] }`. |

Validaciones: nombres no vacíos; áreas positivas; área del lote no mayor al área del
predio cuando ambas se conozcan; municipio/departamento obligatorios al crear
predio; transacción atómica para crear predio + primer lote; índices por usuario y
relación predio/lote; borrado lógico o reglas de retención definidas. La geometría
GeoJSON (`geom`) debe poder agregarse posteriormente; no se exige en el formulario
inicial.

Modelo mínimo recomendado:

- `predios`: `id`, `owner_user_id` o membresías, `nombre`, `municipio`,
  `departamento`, `area_ha`, `geom`, `created_at`.
- `lotes`: `id`, `predio_id`, `owner_user_id`/permisos heredados, `nombre`,
  `area_ha`, `geom`, `created_at`.
- `proyectos`: `id`, `lote_id`, `owner_user_id`/permisos heredados, `nombre`,
  `fase`, parámetros de siembra y timestamps.
- La relación entre identidad OAuth y cuenta de aplicación debe usar el identificador
  de proveedor estable y permitir vinculación segura de identidades existentes.

## 5. Endpoints de proyectos ya usados por el frontend

Además de listar proyectos, el cliente existente ya usa estas rutas:

| Método y ruta | Función |
|---|---|
| `POST /lotes/{lote_id}/proyectos` | Crea proyecto. Body actual: `nombre`, opcionalmente `diagnostico_id`, `vivero_id`, `responsable_id`, `fecha_inicio`, `patron`, `espaciado_m`, `area_restaurada_m2`, `hoyo_lado_cm` y `hoyo_profundidad_cm`. Debe responder con `id` o `proyecto_id`. |
| `GET /proyectos/{proyecto_id}/especies` | Lee especies y cantidades del proyecto. |
| `PUT /proyectos/{proyecto_id}/especies` | Reemplaza la selección de especies. |
| `POST /proyectos/{proyecto_id}/especies` | Agrega/actualiza una especie. Body: `especie_id`, `zona_plantacion`, `cantidad`. |
| `DELETE /proyectos/{proyecto_id}/especies/{especie_id}?zona=...` | Retira una especie. |
| `GET /proyectos/{proyecto_id}/mezcla-botanica?detalle=true` | Devuelve mezcla por zona y, opcionalmente, detalle. |
| `GET /proyectos/{proyecto_id}/insumos` | Devuelve materiales/insumos calculados. |
| `GET /proyectos/{proyecto_id}/seleccion/calculo` | Devuelve cantidades, área estimada, totales y advertencias de stock. |

Cada ruta debe validar que el usuario tenga permiso sobre el proyecto y su lote.

## 6. Otros endpoints que el frontend ya consume

Estos endpoints existentes soportan diagnóstico, mapa, catálogo y detalle; deben
mantener compatibilidad al reemplazar el lote de prueba por lotes del usuario:

| Método y ruta | Uso / parámetros |
|---|---|
| `GET /cuencas` | Lista cuencas para el panel de diagnóstico. |
| `POST /cuencas` | Crea cuenca a partir del objeto enviado por el cliente. |
| `GET /lotes/{lote_id}/diagnostico` | Diagnóstico vigente del lote. |
| `GET /lotes/{lote_id}/diagnosticos` | Historial de diagnósticos. |
| `POST /lotes/{lote_id}/diagnosticos` | Crea diagnóstico; incluye variables de cobertura, precipitación mensual y parámetros ambientales. |
| `GET /diagnosticos/{diagnostico_id}/especies-sugeridas?min=50&limit=...` | Especies compatibles con el diagnóstico. |
| `POST /diagnosticos/{diagnostico_id}/recalcular` | Recalcula especies sugeridas. |
| `GET /mapa/capas` | Capas base de mapa; los tiles deben tener URL y atribución válidas. |
| `GET /lotes/{lote_id}/ndvi?fecha=...` | Resumen NDVI para el lote. |
| `GET /lotes/{lote_id}/zonas-mapa?tipo=...` | GeoJSON de zonas registradas. |
| `POST /lotes/{lote_id}/zonas-mapa` | Crea zona con `tipo`, `etiqueta` opcional y geometría GeoJSON `geom`. |
| `POST /lotes/{lote_id}/zonas-mapa/generar-franja` | Genera franja riparia. |
| `PATCH /zonas-mapa/{zona_id}` | Actualiza atributos y/o geometría de una zona. |
| `DELETE /zonas-mapa/{zona_id}` | Elimina zona. |
| `GET /especies/{especie_id}?lote_id=...` | Ficha detallada y adecuación al lote. |
| `GET /especies/{especie_id}/protocolo` | Protocolo de siembra. |
| `GET /especies/{especie_id}/stock?lote_id=...` | Stock de viveros disponible. |
| `GET /viveros` | Catálogo de viveros. |
| `POST /especies/{especie_id}/ficha-tecnica` | Genera/exporta ficha técnica; body opcional `url`, `generado_por`. |

## 7. Configuración de frontend y despliegue

| Variable | Dónde | Propósito |
|---|---|---|
| `VITE_DATA_SOURCE=api` | Frontend | Usa el backend real en lugar del transporte mock. |
| `VITE_API_BASE_URL` | Frontend | Origen/base path del API. |
| `VITE_GOOGLE_AUTH_ENABLED=true` | Frontend | Muestra el botón Google después de que OAuth esté operativo. No es secreto. |
| `VITE_LOTE_ID` | Frontend, temporal | Fallback/test data solamente; no usar como identidad del usuario. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Backend/secret manager | Credenciales del proveedor; nunca enviar al bundle Vite. |
| `GOOGLE_REDIRECT_URI`, `FRONTEND_AUTH_CALLBACK_URL` | Backend | URLs exactas de retorno OAuth y frontend. |

Antes de habilitar en producción: configurar CORS, HTTPS, cookies/state seguros para
OAuth, protección CSRF donde corresponda, rate limiting para login/registro,
confirmación de correo y recuperación de cuenta según política, auditoría de
vinculación OAuth, aislamiento por usuario, y pruebas de autorización para que un
usuario no pueda enumerar ni modificar predios, lotes o proyectos de otro.
