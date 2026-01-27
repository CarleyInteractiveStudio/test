const express = require('express');
const cors = require('cors');
const multer = require('multer');
const queueManager = require('./queueManager');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const port = process.env.PORT || 7860;

// Confiar en el proxy de Hugging Face para obtener IPs correctas si es necesario
app.set('trust proxy', 1);

// Configuración de almacenamiento en disco para optimizar RAM
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Servidor Especialista (el que procesa las fotos)
const ESPECIALISTA_URL = 'https://carley1234-vidspri.hf.space/remove-background/';

app.get('/', (req, res) => {
    res.json({
        status: 'Secretario Service is running',
        environment: 'Hugging Face Spaces'
    });
});

// Paso 1: Unirse a la fila
app.post('/remove-background/', multer().none(), async (req, res) => {
    const frameCount = req.body.frameCount || 1;
    const job = await queueManager.join(frameCount);
    const status = await queueManager.getQueueStatus(job.id);
    res.json({ job_id: job.id, ...status, queue_position: status.position });
});

// Paso 2: Consultar estado (Polleo constante)
app.get('/status/:id', async (req, res) => {
    const status = await queueManager.getQueueStatus(req.params.id);
    if (status.status === 'not_found') {
        return res.status(404).json(status);
    }
    res.json({ ...status, queue_position: status.position });
});

// Extra: Aplicar código prioritario
app.post('/apply-code', multer().none(), async (req, res) => {
    const { job_id, code } = req.body;
    if (!job_id || !code) {
        return res.status(400).json({ error: 'job_id y code son requeridos' });
    }
    const result = await queueManager.applyPriority(job_id, code);
    if (!result.success) {
        return res.status(400).json(result);
    }
    const status = await queueManager.getQueueStatus(job_id);
    res.json({ ...result, new_queue_position: status.position });
});

// Paso 3: Subir imágenes (solo cuando status sea 'your_turn')
app.post('/upload/:id', upload.array('images'), async (req, res) => {
    const jobId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No se subieron imágenes' });
    }

    const isTurn = await queueManager.startProcessing(jobId);
    if (!isTurn) {
        // Limpiar archivos si no es su turno
        for (const file of files) await fs.remove(file.path);
        return res.status(403).json({ error: 'No es tu turno o ID no válido' });
    }

    res.json({ status: 'processing', message: 'Imágenes recibidas, procesando...' });

    // Procesar en segundo plano para no bloquear la respuesta HTTP
    processImagesSequentially(jobId, files);
});

async function processImagesSequentially(jobId, files) {
    const results = [];
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();

            // Leemos el archivo del disco para enviarlo
            const fileStream = fs.createReadStream(file.path);
            formData.append('file', fileStream);

            const response = await axios.post(ESPECIALISTA_URL, formData, {
                headers: { ...formData.getHeaders() },
                responseType: 'arraybuffer',
                timeout: 60000 // 1 minuto de timeout por foto
            });

            const base64Image = Buffer.from(response.data).toString('base64');
            results.push(base64Image);

            // Actualizar progreso
            if (queueManager.currentJob && queueManager.currentJob.id === jobId) {
                queueManager.currentJob.completedFrames = i + 1;
                if (i % 2 === 0) await queueManager.save();
            }

            // Borrar archivo temporal después de procesarlo
            await fs.remove(file.path);
        }
        await queueManager.completeJob(jobId, results);
    } catch (err) {
        console.error(`Error procesando job ${jobId}:`, err.message);
        await queueManager.failJob(jobId);
        // Intentar limpiar archivos restantes
        for (const file of files) {
            if (await fs.pathExists(file.path)) await fs.remove(file.path);
        }
    }
}

// Limpieza cada 5 minutos
setInterval(() => {
    queueManager.cleanup();
}, 5 * 60 * 1000);

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor Secretario corriendo en puerto ${port}`);
});
