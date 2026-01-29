const fs = require('fs-extra');
const path = require('path');

const CODES_FILE = path.join(__dirname, '..', 'codes.json');

class CodeManager {
    constructor() {
        this.codes = {};
        this.initialized = false;
        this.initPromise = this.load();
    }

    async load() {
        try {
            if (await fs.pathExists(CODES_FILE)) {
                this.codes = await fs.readJson(CODES_FILE);
            } else {
                this.codes = {};
                // Código VIP por defecto
                this.codes['VIDSPRI_VIP'] = {
                    code: 'VIDSPRI_VIP',
                    maxUses: 999999,
                    uses: 0,
                    expiresAt: Date.now() + 3153600000000, // 100 años
                    cooldown: 0,
                    lastUsedAt: 0
                };
                await this.save();
            }
            this.initialized = true;
        } catch (err) {
            console.error('Error loading codes:', err);
            this.initialized = true;
        }
    }

    async save() {
        try {
            await fs.writeJson(CODES_FILE, this.codes, { spaces: 2 });
        } catch (err) {
            console.error('Error saving codes:', err);
        }
    }

    async ensureInitialized() {
        if (!this.initialized) await this.initPromise;
    }

    async createCode({ code, maxUses, expiresAt, cooldown }) {
        await this.ensureInitialized();
        this.codes[code] = {
            code,
            maxUses: parseInt(maxUses) || 1,
            uses: 0,
            expiresAt: parseInt(expiresAt) || (Date.now() + 86400000), // 1 día defecto
            cooldown: parseInt(cooldown) || 0, // Segundos
            lastUsedAt: 0
        };
        await this.save();
        return this.codes[code];
    }

    async validateAndUse(code) {
        await this.ensureInitialized();
        const codeData = this.codes[code];

        if (!codeData) {
            return { valid: false, message: 'Código no existe' };
        }

        const now = Date.now();

        // Verificar expiración por fecha
        if (now > codeData.expiresAt) {
            return { valid: false, message: 'El código ha expirado por fecha' };
        }

        // Verificar límite de usos
        if (codeData.uses >= codeData.maxUses) {
            return { valid: false, message: 'El código ha agotado sus usos' };
        }

        // Verificar cooldown
        if (codeData.cooldown > 0 && codeData.lastUsedAt > 0) {
            const secondsSinceLastUse = (now - codeData.lastUsedAt) / 1000;
            if (secondsSinceLastUse < codeData.cooldown) {
                const waitTime = Math.ceil(codeData.cooldown - secondsSinceLastUse);
                return {
                    valid: false,
                    message: `Debes esperar ${waitTime} segundos para volver a usar este código`
                };
            }
        }

        // Si todo es válido, lo usamos
        codeData.uses += 1;
        codeData.lastUsedAt = now;
        await this.save();

        return { valid: true, codeData };
    }

    async getAllCodes() {
        await this.ensureInitialized();
        return Object.values(this.codes);
    }
}

module.exports = new CodeManager();
