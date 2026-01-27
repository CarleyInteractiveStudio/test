const express = require('express');
const cors = require('cors');
const multer = require('multer');
const queueManager = require('./queueManager');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 7860;

// Increase limit for multiple images
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const ESPECIALISTA_URL = 'https://carley1234-vidspri.hf.space/remove-background/';

app.get('/', (req, res) => {
    res.json({ status: 'Secretario Service is running' });
});

// Join queue (compatible with current script.js or new optimized flow)
app.post('/remove-background/', upload.none(), async (req, res) => {
    // If files are sent here, we should ideally handle them or tell client to wait
    // For optimization, we prefer the client to join first.
    // If the client sends 'images', we will just join them for now.
    const frameCount = req.body.frameCount || 1; // Default to 1 if not provided
    const job = await queueManager.join(frameCount);
    const status = await queueManager.getQueueStatus(job.id);
    res.json({ job_id: job.id, ...status, queue_position: status.position });
});

// Get status
app.get('/status/:id', async (req, res) => {
    const status = await queueManager.getQueueStatus(req.params.id);
    if (status.status === 'not_found') {
        return res.status(404).json(status);
    }
    // Match client expected field name 'queue_position'
    res.json({ ...status, queue_position: status.position });
});

// Apply priority code
app.post('/apply-code', upload.none(), async (req, res) => {
    const { job_id, code } = req.body;
    if (!job_id || !code) {
        return res.status(400).json({ error: 'job_id and code are required' });
    }
    const result = await queueManager.applyPriority(job_id, code);
    if (!result.success) {
        return res.status(400).json(result);
    }
    const status = await queueManager.getQueueStatus(job_id);
    res.json({ ...result, new_queue_position: status.position });
});

// Upload and process images
app.post('/upload/:id', upload.array('images'), async (req, res) => {
    const jobId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
    }

    const isTurn = await queueManager.startProcessing(jobId);
    if (!isTurn) {
        return res.status(403).json({ error: 'Not your turn or job not found' });
    }

    res.json({ status: 'processing', message: 'Upload received, processing started' });

    // Background processing
    processImages(jobId, files);
});

async function processImages(jobId, files) {
    const results = [];
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });

            const response = await axios.post(ESPECIALISTA_URL, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                responseType: 'arraybuffer'
            });

            const base64Image = Buffer.from(response.data).toString('base64');
            results.push(base64Image);

            // Update progress in currentJob
            if (queueManager.currentJob && queueManager.currentJob.id === jobId) {
                queueManager.currentJob.completedFrames = i + 1;
                // Optional: save state frequently? Maybe every 5 frames
                if (i % 5 === 0) await queueManager.save();
            }
        }
        await queueManager.completeJob(jobId, results);
    } catch (err) {
        console.error(`Error processing job ${jobId}:`, err.message);
        await queueManager.failJob(jobId);
    }
}

// Periodic cleanup every 5 minutes
setInterval(() => {
    queueManager.cleanup();
}, 5 * 60 * 1000);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
