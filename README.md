---
title: VidSpri Secretario
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# VidSpri Secretario

Servidor de gestión de filas optimizado para Hugging Face (Plan Gratuito).

## Características

- **Lógica 2N + 1P**: Atiende a 2 usuarios normales por cada 1 usuario prioritario.
- **Optimización de Memoria**: Las imágenes se procesan una por una y se guardan temporalmente en disco.
- **Persistencia**: Estado de la fila guardado en `queue.json`.
- **Auto-Limpieza**: Los archivos y usuarios inactivos se eliminan automáticamente después de 15 minutos.
- **Seguridad**: Solo el usuario en turno puede subir datos.

## Endpoints para la App

### 1. Unirse a la Fila
`POST /remove-background/`
- Envía un `frameCount` opcional.
- Recibes un `job_id` y tu `queue_position`.

### 2. Consultar Estado
`GET /status/:job_id`
- Revisa si es tu turno (`your_turn`) o si está procesando (`processing`).

### 3. Subir Imágenes
`POST /upload/:job_id`
- Sube las imágenes solo cuando sea tu turno.

### 4. Volverse Prioritario
`POST /apply-code`
- Envía `job_id` y el código (ej. `TEST1`).
- Los códigos pueden tener límites de uso, fecha de expiración y tiempo de espera entre usos (cooldown).

### 5. Administración de Códigos (App Local)
Para gestionar los códigos de prioridad sin entrar al servidor, utiliza el archivo que se encuentra en la carpeta `admin/`:
1. Descarga el archivo `admin/admin_app.html` a tu computadora.
2. Ábrelo con cualquier navegador (Chrome, Edge, etc.).
3. Ingresa la URL de tu Space de Hugging Face y la contraseña de administrador.
4. Podrás crear nuevos códigos con límites de uso, expiración y cooldown.

**Seguridad**:
- Los endpoints de administración están protegidos por el header `x-admin-password`.
- La contraseña por defecto es `VIDSPRI_ADMIN_2026`. Puedes cambiarla en `index.js` (variable `ADMIN_PASSWORD`).

---
Configurado para **Hugging Face Spaces**.
