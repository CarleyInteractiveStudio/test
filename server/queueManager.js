const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// En Hugging Face, /app suele ser el directorio de trabajo
const QUEUE_FILE = path.join(__dirname, '..', 'queue.json');
const RESULTS_DIR = path.join(__dirname, '..', 'results');

class QueueManager {
    constructor() {
        this.normalQueue = [];
        this.priorityQueue = [];
        this.currentJob = null;
        this.normalsServedSinceLastPriority = 0;
        this.initialized = false;
        this.initPromise = this.init();
    }

    async init() {
        await fs.ensureDir(RESULTS_DIR);
        await this.load();
    }

    async load() {
        try {
            if (await fs.pathExists(QUEUE_FILE)) {
                const data = await fs.readJson(QUEUE_FILE);
                this.normalQueue = data.normalQueue || [];
                this.priorityQueue = data.priorityQueue || [];
                this.currentJob = data.currentJob || null;
                this.normalsServedSinceLastPriority = data.normalsServedSinceLastPriority || 0;
            }
            this.initialized = true;
        } catch (err) {
            console.error('Error loading queue:', err);
            this.initialized = true;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) await this.initPromise;
    }

    async save() {
        try {
            await fs.writeJson(QUEUE_FILE, {
                normalQueue: this.normalQueue,
                priorityQueue: this.priorityQueue,
                currentJob: this.currentJob,
                normalsServedSinceLastPriority: this.normalsServedSinceLastPriority
            }, { spaces: 2 });
        } catch (err) {
            console.error('Error saving queue:', err);
        }
    }

    async join(frameCount) {
        await this.ensureInitialized();
        const job = {
            id: uuidv4(),
            frameCount: parseInt(frameCount) || 1,
            status: 'queued',
            type: 'normal',
            joinedAt: Date.now(),
            lastHeartbeat: Date.now(),
            completedFrames: 0
        };
        this.normalQueue.push(job);
        await this.save();
        return job;
    }

    async applyPriority(id, code) {
        await this.ensureInitialized();
        // Puedes cambiar este código por el que prefieras
        if (code !== 'VIDSPRI_VIP') {
            return { success: false, message: 'Código prioritario inválido' };
        }

        const index = this.normalQueue.findIndex(j => j.id === id);
        if (index !== -1) {
            const job = this.normalQueue.splice(index, 1)[0];
            job.type = 'priority';
            this.priorityQueue.push(job);
            await this.save();
            return { success: true, job };
        }

        if (this.currentJob && this.currentJob.id === id) {
             this.currentJob.type = 'priority';
             await this.save();
             return { success: true, job: this.currentJob };
        }

        if (this.priorityQueue.some(j => j.id === id)) {
            return { success: true, message: 'Ya eres prioritario' };
        }

        return { success: false, message: 'Solicitud no encontrada' };
    }

    async getQueueStatus(id) {
        await this.ensureInitialized();
        await this.checkTimeout();

        if (this.currentJob && this.currentJob.id === id) {
            this.currentJob.lastHeartbeat = Date.now();
            return {
                status: this.currentJob.status,
                position: 0,
                completed_frames: this.currentJob.completedFrames,
                total_frames: this.currentJob.frameCount
            };
        }

        const resultFile = path.join(RESULTS_DIR, `${id}.json`);
        if (await fs.pathExists(resultFile)) {
            const resultData = await fs.readJson(resultFile);
            return {
                status: 'completed',
                position: 0,
                completed_frames: resultData.frameCount,
                total_frames: resultData.frameCount,
                frames: resultData.frames
            };
        }

        const combined = this.getCombinedQueue();
        const index = combined.findIndex(j => j.id === id);

        if (index !== -1) {
            combined[index].lastHeartbeat = Date.now();
            return {
                status: 'queued',
                position: index + 1
            };
        }

        return { status: 'not_found' };
    }

    getCombinedQueue() {
        const combined = [];
        const nQ = [...this.normalQueue];
        const pQ = [...this.priorityQueue];
        let nServed = this.normalsServedSinceLastPriority;

        while (nQ.length > 0 || pQ.length > 0) {
            if (nServed >= 2 && pQ.length > 0) {
                combined.push(pQ.shift());
                nServed = 0;
            } else if (nQ.length > 0) {
                combined.push(nQ.shift());
                nServed++;
            } else if (pQ.length > 0) {
                combined.push(pQ.shift());
                nServed = 0;
            } else {
                break;
            }
        }
        return combined;
    }

    async checkTimeout() {
        let changed = false;
        const now = Date.now();
        const timeout = 10000; // 10 segundos de inactividad permitidos cuando es su turno

        if (this.currentJob && this.currentJob.status === 'your_turn') {
            if (now - this.currentJob.lastHeartbeat > timeout) {
                console.log(`Job ${this.currentJob.id} eliminado por inactividad (10s)`);
                this.currentJob = null;
                changed = true;
            }
        }

        const queueTimeout = 30000; // 30s para gente en la fila general
        const filterFn = j => {
            if (now - j.lastHeartbeat > queueTimeout) {
                changed = true;
                return false;
            }
            return true;
        };

        this.normalQueue = this.normalQueue.filter(filterFn);
        this.priorityQueue = this.priorityQueue.filter(filterFn);

        if (this.currentJob === null) {
            await this.advanceQueue();
            changed = true;
        }

        if (changed) {
            await this.save();
        }
    }

    async advanceQueue() {
        if (this.currentJob) return;

        if (this.normalsServedSinceLastPriority >= 2 && this.priorityQueue.length > 0) {
            this.currentJob = this.priorityQueue.shift();
            this.normalsServedSinceLastPriority = 0;
        } else if (this.normalQueue.length > 0) {
            this.currentJob = this.normalQueue.shift();
            this.normalsServedSinceLastPriority++;
        } else if (this.priorityQueue.length > 0) {
            this.currentJob = this.priorityQueue.shift();
            this.normalsServedSinceLastPriority = 0;
        }

        if (this.currentJob) {
            this.currentJob.status = 'your_turn';
            this.currentJob.lastHeartbeat = Date.now();
        }
    }

    async startProcessing(id) {
        await this.ensureInitialized();
        if (this.currentJob && this.currentJob.id === id) {
            this.currentJob.status = 'processing';
            this.currentJob.lastHeartbeat = Date.now();
            await this.save();
            return true;
        }
        return false;
    }

    async completeJob(id, results) {
        await this.ensureInitialized();
        if (this.currentJob && this.currentJob.id === id) {
            const resultData = {
                id: this.currentJob.id,
                frameCount: this.currentJob.frameCount,
                frames: results,
                completedAt: Date.now()
            };
            await fs.writeJson(path.join(RESULTS_DIR, `${id}.json`), resultData);

            this.currentJob = null;
            await this.advanceQueue();
            await this.save();
            return true;
        }
        return false;
    }

    async failJob(id) {
        await this.ensureInitialized();
        if (this.currentJob && this.currentJob.id === id) {
            this.currentJob = null;
            await this.advanceQueue();
            await this.save();
        }
    }

    async cleanup() {
        await this.ensureInitialized();
        await this.checkTimeout();

        const now = Date.now();
        const maxAge = 15 * 60 * 1000; // 15 minutos de vida máxima para cualquier dato

        const filterOld = j => (now - j.joinedAt < maxAge);
        let changed = false;
        const oldLen = this.normalQueue.length + this.priorityQueue.length;
        this.normalQueue = this.normalQueue.filter(filterOld);
        this.priorityQueue = this.priorityQueue.filter(filterOld);
        if (this.currentJob && (now - this.currentJob.joinedAt > maxAge)) {
            this.currentJob = null;
            changed = true;
        }
        if (changed || (this.normalQueue.length + this.priorityQueue.length !== oldLen)) {
            await this.save();
        }

        try {
            const files = await fs.readdir(RESULTS_DIR);
            for (const file of files) {
                const filePath = path.join(RESULTS_DIR, file);
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    await fs.remove(filePath);
                }
            }
        } catch (err) {
            console.error('Error limpiando resultados:', err);
        }
    }
}

module.exports = new QueueManager();
