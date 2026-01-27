# VidSpri Secretario

Servidor de gestión de filas optimizado para Hugging Face (Plan Gratuito).

## Características

- **Lógica 2N + 1P**: Atiende a 2 usuarios normales por cada 1 usuario prioritario.
- **Optimización de Memoria**: Las imágenes se procesan una por una y solo cuando es el turno del usuario.
- **Persistencia**: Estado de la fila guardado en `queue.json`.
- **Auto-Limpieza**: Los usuarios inactivos o con más de 15 minutos en el sistema son eliminados automáticamente.
- **Tiempo de Respuesta**: 10 segundos para dar señales de vida cuando es su turno.

## Endpoints

### 1. Iniciar/Unirse a la Fila
`POST /remove-background/`
- **Body**: `frameCount` (opcional, número de fotos).
- **Retorna**: `job_id`, `status`, `queue_position`.

### 2. Verificar Estado
`GET /status/:job_id`
- **Retorna**: `status`, `queue_position`.
- Si `status` es `your_turn`, el cliente debe proceder a subir las imágenes.
- Si `status` es `processing`, retorna `completed_frames` y `total_frames`.
- Si `status` is `completed`, retorna el array `frames` con las imágenes en Base64.

### 3. Aplicar Código de Prioridad
`POST /apply-code`
- **Body**: `job_id`, `code`.
- **Código VIP**: `VIDSPRI_VIP`

### 4. Subir Imágenes
`POST /upload/:job_id`
- **Multipart**: `images` (array de archivos).
- Solo funciona si es el turno del usuario.

## Instalación en Hugging Face Spaces

1. Crea un nuevo Space de tipo **Docker**.
2. Sube los archivos: `Dockerfile`, `index.js`, `queueManager.js`, `package.json`.
3. El Space se iniciará automáticamente.

---
Desarrollado para Carley Interactive Studio.
