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
- Envía `job_id` y el código `VIDSPRI_VIP`.

---
Configurado para **Hugging Face Spaces**.
