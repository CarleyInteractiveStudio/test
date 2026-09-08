// --- Preloader, Audio & Setup ---
const canvas2d = document.getElementById('canvas2d');
const ctx2d = canvas2d.getContext('2d');

const captionContainer = document.getElementById('caption-container');
const captionText = document.getElementById('caption-text');

const letterOverlay = document.getElementById('letter-overlay');
const letterText = document.getElementById('letter-text');
let currentLetterText = '';

function setLetter(text) {
    if (!text) {
        if (letterOverlay) letterOverlay.classList.add('hidden');
    } else {
        if (letterOverlay) letterOverlay.classList.remove('hidden');
        if (currentLetterText !== text) {
            currentLetterText = text;
            if (letterText) letterText.textContent = text;
        }
    }
}

const loaderOverlay = document.getElementById('loader-overlay');
const loaderBar = document.getElementById('loader-bar');
const loaderStatus = document.getElementById('loader-status');
const startBtn = document.getElementById('start-btn');

// Web Audio Synth for Romantic Ambient & Space Music
let audioCtx = null;
let currentAudioStage = -1;
let synthGainNode = null;
let isAudioActive = false;

function initWebAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        audioCtx = new AudioContext();
        synthGainNode = audioCtx.createGain();
        synthGainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        synthGainNode.connect(audioCtx.destination);
        isAudioActive = true;
    }
}

function playRomanticChord(notes, duration = 4.0) {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;

    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();

        // Warm sine + soft triangle blend
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.08 / notes.length, now + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(noteGain);
        noteGain.connect(synthGainNode);

        osc.start(now);
        osc.stop(now + duration);
    });
}

function playCosmicDrone(freq, duration = 6.0) {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const droneGain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration * 0.5);

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.05, now + 1.5);
    droneGain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(synthGainNode);

    osc.start(now);
    osc.stop(now + duration);
}

function updateAudioStage(elapsed) {
    if (!audioCtx || !isAudioActive) return;

    // Stage 1: Intro (Heart & Rose) - Soft Romantic F# Major / D#m7 (261Hz, 329Hz, 392Hz, 523Hz)
    if (elapsed < 16.0) {
        if (currentAudioStage !== 0) {
            currentAudioStage = 0;
            playRomanticChord([261.63, 329.63, 392.00, 523.25], 6.0); // C major7 romantic
        }
    }
    // Stage 2: Solar System Overview - Gentle Space Harmony (G3, B3, D4, F#4)
    else if (elapsed >= 16.0 && elapsed < 36.0) {
        if (currentAudioStage !== 1) {
            currentAudioStage = 1;
            playRomanticChord([196.00, 246.94, 293.66, 369.99], 8.0);
        }
    }
    // Stage 3: Speed Warp & Black Hole - Deep Cosmic Bass Drone + Gravity Resonator
    else if (elapsed >= 36.0 && elapsed < 52.0) {
        if (currentAudioStage !== 2) {
            currentAudioStage = 2;
            playCosmicDrone(65.41, 10.0); // Deep C2 drone
            playRomanticChord([130.81, 164.81, 196.00, 246.94], 10.0);
        }
    }
    // Stage 4: Vast Galaxy Zoom & Infinity - Cosmic Uplifting Symphony
    else if (elapsed >= 52.0) {
        if (currentAudioStage !== 3) {
            currentAudioStage = 3;
            playRomanticChord([220.00, 277.18, 329.63, 440.00, 554.37], 12.0); // A Major celestial chord
            playCosmicDrone(110.00, 12.0);
        }
    }
}

let width, height;
let centerX, centerY, rightX, rightY;
let heartScale, roseScale;

function resizeAll() {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas2d.width = width;
    canvas2d.height = height;

    centerX = width * 0.5;
    centerY = height * 0.5;
    rightX = width * 0.75;
    rightY = height * 0.5;

    heartScale = Math.min(width, height) / 45;
    roseScale = Math.min(width, height) / 50;

    if (renderer) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
}

window.addEventListener('resize', resizeAll);

// --- Subtitle Caption Helper ---
let currentCaption = '';

function setCaption(text) {
    if (!text) {
        captionContainer.classList.add('hidden');
    } else {
        if (currentCaption !== text) {
            currentCaption = text;
            captionContainer.classList.add('hidden');
            setTimeout(() => {
                captionText.textContent = text;
                captionContainer.classList.remove('hidden');
            }, 500);
        }
    }
}

// ==========================================
// 2D CANVAS ANIMATIONS (Heart -> Rose -> For you -> ANA)
// ==========================================

class HeartInfinityParticle {
    constructor(offset) {
        this.t = offset;
        this.speed = 0.02 + Math.random() * 0.025;
        this.size = Math.random() * 2.2 + 1.2;
        this.hue = Math.random() * 50 + 330; // Glowing magenta / rose / gold
        this.scaleMult = 10 + Math.random() * 4;
        this.x = 0;
        this.y = 0;
        this.trail = [];
    }

    update() {
        this.t += this.speed;
        const scale = heartScale * this.scaleMult;
        const denom = 1 + Math.sin(this.t) * Math.sin(this.t);
        const x = centerX + (scale * Math.cos(this.t)) / denom;
        const y = centerY - 18 + (scale * Math.sin(this.t) * Math.cos(this.t)) / denom;

        this.x = x;
        this.y = y;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 75%, 0.55)`;
            ctx.lineWidth = this.size * 0.9;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 85%, 0.95)`;
        ctx.fill();

        ctx.restore();
    }
}

let heartInfinityParticles = [];

function initHeartInfinityParticles() {
    heartInfinityParticles = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
        heartInfinityParticles.push(new HeartInfinityParticle((i / count) * Math.PI * 2));
    }
}

function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return {
        x: centerX + x * heartScale,
        y: centerY + y * heartScale - 20
    };
}

function getRosePoints() {
    const points = [];
    const roseCenterX = centerX;
    const roseCenterY = centerY - 15;

    // Stem: smooth elegant curve
    for (let t = 0; t <= 1; t += 0.008) {
        const sy = roseCenterY + 30 + t * 150;
        const sx = roseCenterX + Math.sin(t * Math.PI * 1.5) * 14;
        points.push({ x: sx, y: sy, type: 'stem', color: '#00ff88', glow: '#00ff88', size: 2.2 });
        points.push({ x: sx - 1.8, y: sy, type: 'stem', color: '#00cc66', glow: '#00ff88', size: 1.8 });
        points.push({ x: sx + 1.8, y: sy, type: 'stem', color: '#00cc66', glow: '#00ff88', size: 1.8 });
    }

    // Stem Thorns
    [0.35, 0.65].forEach((t, idx) => {
        const sy = roseCenterY + 30 + t * 150;
        const sx = roseCenterX + Math.sin(t * Math.PI * 1.5) * 14;
        const dir = idx === 0 ? -1 : 1;
        for (let i = 0; i < 14; i++) {
            points.push({
                x: sx + dir * (i * 0.85),
                y: sy - i * 0.35,
                type: 'stem', color: '#02a856', glow: '#00ff88', size: 1.5
            });
        }
    });

    // Detailed Leaves with veins
    const createLeaf = (baseX, baseY, angle, scale) => {
        for (let u = 0; u <= 1; u += 0.035) {
            for (let v = -1; v <= 1; v += 0.1) {
                const leafLen = u * 50 * scale;
                const width = Math.sin(u * Math.PI) * 20 * scale;
                const lx = baseX + Math.cos(angle) * leafLen - Math.sin(angle) * (v * width);
                const ly = baseY + Math.sin(angle) * leafLen + Math.cos(angle) * (v * width);
                const isVein = Math.abs(v) < 0.15 || Math.abs((u * 12) % 2 - 1) < 0.25;
                points.push({
                    x: lx, y: ly,
                    type: 'leaf',
                    color: isVein ? '#88ffaa' : '#00b853',
                    glow: '#00ff88',
                    size: isVein ? 1.8 : 1.3
                });
            }
        }
    };

    const stemPt1 = { x: roseCenterX + Math.sin(0.35 * Math.PI * 1.5) * 14, y: roseCenterY + 30 + 0.35 * 150 };
    const stemPt2 = { x: roseCenterX + Math.sin(0.65 * Math.PI * 1.5) * 14, y: roseCenterY + 30 + 0.65 * 150 };
    createLeaf(stemPt1.x, stemPt1.y, -Math.PI * 0.72, 1.0);
    createLeaf(stemPt2.x, stemPt2.y, -Math.PI * 0.22, 0.95);

    // Sepal (green base under flower head)
    for (let a = -Math.PI * 0.85; a <= Math.PI * 0.85; a += 0.08) {
        for (let r = 5; r <= 28; r += 2.2) {
            const sx = roseCenterX + Math.sin(a) * r * 0.65;
            const sy = roseCenterY + 28 + Math.cos(a) * r * 0.85;
            points.push({ x: sx, y: sy, type: 'sepal', color: '#00cc66', glow: '#00ff88', size: 1.6 });
        }
    }

    // Layered Blooming Rose Petals
    const petalLayers = [
        { count: 14, rMin: 40, rMax: 60, hueMin: 340, hueMax: 355, lum: '65%' },
        { count: 18, rMin: 26, rMax: 42, hueMin: 345, hueMax: 360, lum: '60%' },
        { count: 22, rMin: 14, rMax: 28, hueMin: 350, hueMax: 10,  lum: '55%' },
        { count: 26, rMin: 3,  rMax: 15, hueMin: 355, hueMax: 15,  lum: '50%' }
    ];

    petalLayers.forEach((layer) => {
        for (let p = 0; p < layer.count; p++) {
            const baseAngle = (p / layer.count) * Math.PI * 2;
            for (let t = 0; t <= Math.PI; t += 0.08) {
                const petalRadius = layer.rMin + Math.sin(t) * (layer.rMax - layer.rMin);
                const angle = baseAngle + Math.sin(t * 2) * 0.22;
                const px = roseCenterX + Math.cos(angle) * petalRadius;
                const py = roseCenterY + Math.sin(angle) * (petalRadius * 0.88) - (1 - Math.sin(t)) * 6;

                const hue = layer.hueMin + Math.random() * (layer.hueMax - layer.hueMin);
                points.push({
                    x: px, y: py,
                    type: 'petal',
                    color: `hsl(${hue}, 100%, ${layer.lum})`,
                    glow: '#ff0055',
                    size: 1.9
                });
            }
        }
    });

    // Spiral swirl core accent
    for (let theta = 0; theta < Math.PI * 10; theta += 0.05) {
        const r = (theta / (Math.PI * 10)) * 24;
        const px = roseCenterX + Math.cos(theta) * r;
        const py = roseCenterY + Math.sin(theta) * (r * 0.82);
        points.push({
            x: px, y: py,
            type: 'petal',
            color: '#ff3366',
            glow: '#ff0066',
            size: 2.1
        });
    }

    return points;
}

let cachedRosePoints = null;
function getRosePointsCached() {
    if (!cachedRosePoints) {
        cachedRosePoints = getRosePoints();
    }
    return cachedRosePoints;
}

let forYouTargets = [];
let anaTargets = [];

function sampleTextTargets(text, fontSize) {
    const targets = [];
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 900;
    offCanvas.height = 350;
    const offCtx = offCanvas.getContext('2d');

    offCtx.font = `bold ${fontSize}px 'Great Vibes', cursive, sans-serif`;
    offCtx.fillStyle = '#ffffff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    const step = width < 800 ? 4 : 5;
    for (let y = 0; y < offCanvas.height; y += step) {
        for (let x = 0; x < offCanvas.width; x += step) {
            const index = (y * offCanvas.width + x) * 4;
            if (data[index + 3] > 120) {
                targets.push({
                    x: centerX + (x - offCanvas.width / 2),
                    y: centerY + (y - offCanvas.height / 2)
                });
            }
        }
    }
    return targets;
}

function initTextTargets() {
    forYouTargets = sampleTextTargets('For you', width < 800 ? 90 : 120);
    anaTargets = sampleTextTargets('ANA', width < 800 ? 120 : 160);
}

class MorphParticle {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.size = Math.random() * 1.8 + 1.2;
        this.hue = Math.random() * 40 + 330;
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 250 + 60;
        this.speed = Math.random() * 0.03 + 0.015;
        this.trail = [];
    }

    update(target1, target2, stage, progress) {
        let currentX, currentY;

        if (stage === 0) {
            this.angle += this.speed;
            const orbitX = rightX + Math.cos(this.angle) * this.radius;
            const orbitY = centerY + Math.sin(this.angle) * (this.radius * 0.6);
            currentX = orbitX * (1 - progress) + target1.x * progress;
            currentY = orbitY * (1 - progress) + target1.y * progress;
        } else if (stage === 1) {
            const shimmerX = Math.sin(Date.now() * 0.003 + this.angle) * 1.2;
            const shimmerY = Math.cos(Date.now() * 0.003 + this.angle) * 1.2;
            currentX = target1.x + shimmerX;
            currentY = target1.y + shimmerY;
        } else if (stage === 2) {
            const easeProg = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            currentX = target1.x * (1 - easeProg) + target2.x * easeProg;
            currentY = target1.y * (1 - easeProg) + target2.y * easeProg;
        } else if (stage === 3) {
            const shimmerX = Math.sin(Date.now() * 0.004 + this.angle) * 1.5;
            const shimmerY = Math.cos(Date.now() * 0.004 + this.angle) * 1.5;
            currentX = target2.x + shimmerX;
            currentY = target2.y + shimmerY;
        } else {
            this.angle += this.speed;
            const floatX = (Math.cos(this.angle) * 300) * progress;
            const floatY = (-progress * 250) + Math.sin(this.angle) * 50;
            currentX = target2.x + floatX;
            currentY = target2.y + floatY;
        }

        this.x += (currentX - this.x) * 0.25;
        this.y += (currentY - this.y) * 0.25;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 3) this.trail.shift();
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 75%, 0.45)`;
            ctx.lineWidth = this.size * 0.8;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 80%, 0.95)`;
        ctx.fill();

        ctx.restore();
    }
}

let morphParticles = [];

function setupMorphParticles() {
    morphParticles = [];
    const maxCount = Math.max(forYouTargets.length, anaTargets.length);
    const rosePoints = getRosePointsCached();

    for (let i = 0; i < maxCount; i++) {
        const src = rosePoints[i % rosePoints.length];
        morphParticles.push(new MorphParticle(src.x, src.y));
    }
}

const sparkles = [];
class Sparkle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5 - 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.color = `hsl(${Math.random() * 50 + 330}, 100%, 70%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
}

function handlePointer(e) {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    if (x !== undefined && y !== undefined) {
        for (let i = 0; i < 3; i++) {
            sparkles.push(new Sparkle(x, y));
        }
    }
}

window.addEventListener('mousemove', handlePointer);
window.addEventListener('touchmove', handlePointer);
window.addEventListener('click', handlePointer);

// ==========================================
// PROCEDURAL CANVAS TEXTURES FOR THREE.JS
// ==========================================

function createParticleTexture() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 200, 240, 0.8)');
    grad.addColorStop(0.7, 'rgba(255, 100, 200, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(pCanvas);
}

function createGlowSpriteTexture(colorCenter, colorEdge) {
    const gCanvas = document.createElement('canvas');
    gCanvas.width = 256;
    gCanvas.height = 256;
    const gCtx = gCanvas.getContext('2d');

    const grad = gCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0.0, colorCenter);
    grad.addColorStop(0.25, colorCenter);
    grad.addColorStop(0.65, colorEdge);
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');

    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, 256, 256);

    return new THREE.CanvasTexture(gCanvas);
}

function createAccretionDiskTexture() {
    const adCanvas = document.createElement('canvas');
    adCanvas.width = 512;
    adCanvas.height = 512;
    const adCtx = adCanvas.getContext('2d');

    const grad = adCtx.createRadialGradient(256, 256, 65, 256, 256, 256);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.12, 'rgba(255, 220, 160, 0.95)');
    grad.addColorStop(0.35, 'rgba(255, 70, 160, 0.85)');
    grad.addColorStop(0.7, 'rgba(190, 20, 120, 0.4)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    adCtx.fillStyle = grad;
    adCtx.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(adCanvas);
}

// Procedural Planet Canvas Texture Generators for 100% Reliable Rendering
function createProceduralTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (type === 'sun') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#ffe066');
        grad.addColorStop(0.5, '#ff9900');
        grad.addColorStop(1, '#ff3300');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);

        // Solar flares & granulation noise
        for (let i = 0; i < 1500; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#ffcc00';
            ctx.globalAlpha = Math.random() * 0.35;
            ctx.fillRect(Math.random() * 512, Math.random() * 256, Math.random() * 8 + 2, Math.random() * 8 + 2);
        }
    } else if (type === 'earth') {
        // Deep blue ocean base
        ctx.fillStyle = '#0f3854';
        ctx.fillRect(0, 0, 512, 256);

        // Continents (green/brown noise landmasses)
        ctx.fillStyle = '#2d8659';
        for (let i = 0; i < 40; i++) {
            const cx = Math.random() * 512;
            const cy = 40 + Math.random() * 176;
            const rx = 30 + Math.random() * 60;
            const ry = 20 + Math.random() * 40;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Swirling white clouds
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 60; i++) {
            ctx.globalAlpha = 0.25 + Math.random() * 0.35;
            const cx = Math.random() * 512;
            const cy = Math.random() * 256;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 40 + Math.random() * 80, 8 + Math.random() * 15, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'jupiter') {
        // Atmospheric horizontal bands
        const bandColors = ['#d8ca9f', '#a57c52', '#cbb08b', '#e1d5be', '#8d5b38', '#d0b896'];
        for (let y = 0; y < 256; y += 8) {
            ctx.fillStyle = bandColors[Math.floor((y / 8) % bandColors.length)];
            ctx.fillRect(0, y, 512, 8 + Math.sin(y * 0.1) * 3);
        }

        // Great Red Spot
        ctx.fillStyle = '#cc3322';
        ctx.beginPath();
        ctx.ellipse(320, 160, 35, 20, -0.1, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'saturn') {
        // Soft golden bands
        const bandColors = ['#e6cb96', '#d8b570', '#eedbb0', '#c29a50', '#f3e5c8'];
        for (let y = 0; y < 256; y += 10) {
            ctx.fillStyle = bandColors[Math.floor((y / 10) % bandColors.length)];
            ctx.fillRect(0, y, 512, 10);
        }
    } else if (type === 'saturn_ring') {
        canvas.width = 512;
        canvas.height = 512;
        const ringCtx = canvas.getContext('2d');
        const grad = ringCtx.createRadialGradient(256, 256, 100, 256, 256, 250);
        grad.addColorStop(0.0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.3, 'rgba(212, 178, 125, 0.85)');
        grad.addColorStop(0.5, 'rgba(180, 140, 90, 0.4)');
        grad.addColorStop(0.8, 'rgba(220, 190, 140, 0.9)');
        grad.addColorStop(1.0, 'rgba(0,0,0,0)');
        ringCtx.fillStyle = grad;
        ringCtx.fillRect(0, 0, 512, 512);
    } else if (type === 'mars') {
        ctx.fillStyle = '#c1440e';
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = '#8b2e06';
        for (let i = 0; i < 30; i++) {
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, 15 + Math.random() * 45, 0, Math.PI * 2);
            ctx.fill();
        }
        // Ice caps
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(0, 0, 512, 20);
        ctx.fillRect(0, 236, 512, 20);
    } else if (type === 'venus') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#e3c888');
        grad.addColorStop(0.5, '#d4b36a');
        grad.addColorStop(1, '#b89653');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
    } else if (type === 'mercury') {
        ctx.fillStyle = '#777777';
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = '#555555';
        for (let i = 0; i < 50; i++) {
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, 5 + Math.random() * 15, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'moon') {
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = '#606060';
        for (let i = 0; i < 40; i++) {
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 30, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'uranus') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#65c3ec');
        grad.addColorStop(1, '#4b70dd');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
    } else if (type === 'neptune') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#274687');
        grad.addColorStop(0.5, '#3960be');
        grad.addColorStop(1, '#1d2f66');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
    } else {
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(0, 0, 512, 256);
    }

    return new THREE.CanvasTexture(canvas);
}

// ==========================================
// 3D THREE.JS SPACE ENGINE (Solar System, Warp Flight, Black Hole, Galaxy, Infinity)
// ==========================================

let scene, camera, renderer;
let sunMesh, earthMesh, moonMesh;
let solarSystemGroup;
let planetsList = [];
let moonOnlyMesh;

let blackHoleGroup, accretionDiskMesh, gravitationalLensingMesh, lensingTopMesh, lensingBottomMesh;
let blackHoleParticlesGroup, bhParticlesGeo, bhParticlesPositions, bhParticleData = [];
let warpLinesGroup, warpLines = [];
let galaxyParticles, galaxyGeometry, multiverseGroup = [];
let particleTexture;

// 3D Envelope, Seal, Letter Paper & First-Person Hand
let envelopeGroup, envelopeFlap, waxSealMesh, letterPaperMesh, handGroup;

// THREE Loading Manager for Preloader
let isExperienceReady = false;

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (loaderStatus) loaderStatus.textContent = `Cargando universo... ${progress}%`;
};

loadingManager.onLoad = () => {
    if (loaderBar) loaderBar.style.width = '100%';
    if (loaderStatus) loaderStatus.textContent = '¡Todo listo para Ana! ❤️';
    isExperienceReady = true;
    if (startBtn) startBtn.classList.remove('hidden');
    // Automatically start experience when loading completes
    setTimeout(() => {
        startExperience();
    }, 400);
};

loadingManager.onError = (url) => {
    console.warn('Error loading asset:', url);
};

const texLoader = new THREE.TextureLoader(loadingManager);

function loadTextureSafe(url, type) {
    const fallback = createProceduralTexture(type);
    const texture = texLoader.load(
        url,
        undefined,
        undefined,
        () => {
            console.warn('Texture failed to load, falling back to procedural:', type, url);
            texture.image = fallback.image;
            texture.needsUpdate = true;
        }
    );
    return texture;
}

function init3D() {
    const container = document.getElementById('canvas3d-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0004);

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
    camera.position.set(0, 40, 120);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    particleTexture = createParticleTexture();

    // Ambient & Sunlight
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfffaed, 4.5, 3000);
    scene.add(sunLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    createStarfield();

    // Solar System Group
    solarSystemGroup = new THREE.Group();
    scene.add(solarSystemGroup);

    createSolarSystem();

    // Warp Lines (Speed Effect)
    createWarpSpeedLines();

    // Cinematic Black Hole
    createCinematicBlackHole();

    // Galaxy & Infinity
    createGalaxyAndInfinity();

    // 3D Envelope & First-Person Hands
    create3DEnvelopeAndHands();
}

function createStarfield() {
    const starsGeo = new THREE.BufferGeometry();
    const count = 4500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 2200;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.0,
        map: particleTexture,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
    });
    const starfield = new THREE.Points(starsGeo, starsMat);
    scene.add(starfield);
}

function createSolarSystem() {
    // Textures with procedural fallbacks
    const sunTex = loadTextureSafe('textures/sun.jpg', 'sun');
    const mercuryTex = loadTextureSafe('textures/mercury.jpg', 'mercury');
    const venusTex = loadTextureSafe('textures/venus.jpg', 'venus');
    const earthTex = loadTextureSafe('textures/earth.jpg', 'earth');
    const moonTex = loadTextureSafe('textures/moon.jpg', 'moon');
    const marsTex = loadTextureSafe('textures/mars.jpg', 'mars');
    const jupiterTex = loadTextureSafe('textures/jupiter.jpg', 'jupiter');
    const saturnTex = loadTextureSafe('textures/saturn.jpg', 'saturn');
    const saturnRingTex = createProceduralTexture('saturn_ring');
    const uranusTex = loadTextureSafe('textures/uranus.jpg', 'uranus');
    const neptuneTex = loadTextureSafe('textures/neptune.jpg', 'neptune');

    // Independent Moon Mesh for Moon Stage
    const moonOnlyGeo = new THREE.SphereGeometry(6, 32, 32);
    const moonOnlyMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.8 });
    moonOnlyMesh = new THREE.Mesh(moonOnlyGeo, moonOnlyMat);
    moonOnlyMesh.position.set(-80, 10, 450); // Positioned for initial Moon scene
    solarSystemGroup.add(moonOnlyMesh);

    // Sun
    const sunGeo = new THREE.SphereGeometry(18, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    solarSystemGroup.add(sunMesh);

    // Sun Glow - Soft radial gradient glow sprite
    const sunGlowTex = createGlowSpriteTexture('rgba(255, 210, 120, 0.85)', 'rgba(255, 120, 0, 0.25)');
    const sunGlowMat = new THREE.SpriteMaterial({
        map: sunGlowTex,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const sunGlow = new THREE.Sprite(sunGlowMat);
    sunGlow.scale.set(70, 70, 1);
    sunMesh.add(sunGlow);

    // Planet Definitions with realistic textures and continuous orbit speeds
    const pData = [
        { name: 'Mercury', r: 2.5, dist: 35, tex: mercuryTex, speed: 0.022, angle: Math.random() * Math.PI * 2 },
        { name: 'Venus', r: 4.2, dist: 52, tex: venusTex, speed: 0.016, angle: Math.random() * Math.PI * 2 },
        {
            name: 'Earth', r: 5.2, dist: 78, tex: earthTex,
            speed: 0.011, angle: Math.random() * Math.PI * 2, isEarth: true
        },
        { name: 'Mars', r: 3.6, dist: 105, tex: marsTex, speed: 0.008, angle: Math.random() * Math.PI * 2 },
        { name: 'Jupiter', r: 11.5, dist: 145, tex: jupiterTex, speed: 0.005, angle: Math.random() * Math.PI * 2 },
        { name: 'Saturn', r: 9.0, dist: 190, tex: saturnTex, speed: 0.0035, angle: Math.random() * Math.PI * 2, ring: true },
        { name: 'Uranus', r: 6.5, dist: 235, tex: uranusTex, speed: 0.0025, angle: Math.random() * Math.PI * 2 },
        { name: 'Neptune', r: 6.2, dist: 275, tex: neptuneTex, speed: 0.0018, angle: Math.random() * Math.PI * 2 }
    ];

    pData.forEach(data => {
        const pGeo = new THREE.SphereGeometry(data.r, 32, 32);
        const pMat = new THREE.MeshStandardMaterial({
            map: data.tex,
            roughness: 0.6,
            metalness: 0.1
        });

        const pMesh = new THREE.Mesh(pGeo, pMat);

        // Orbit Line
        const orbitGeo = new THREE.BufferGeometry();
        const orbitPts = [];
        for (let i = 0; i <= 128; i++) {
            const a = (i / 128) * Math.PI * 2;
            orbitPts.push(Math.cos(a) * data.dist, 0, Math.sin(a) * data.dist);
        }
        orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPts, 3));
        const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        solarSystemGroup.add(orbitLine);

        // Position planet initially
        pMesh.position.set(Math.cos(data.angle) * data.dist, 0, Math.sin(data.angle) * data.dist);
        solarSystemGroup.add(pMesh);

        if (data.isEarth) {
            earthMesh = pMesh;

            // Atmosphere Glow - Soft radial gradient glow sprite
            const earthGlowTex = createGlowSpriteTexture('rgba(60, 180, 255, 0.75)', 'rgba(0, 120, 255, 0.2)');
            const atmoMat = new THREE.SpriteMaterial({
                map: earthGlowTex,
                blending: THREE.AdditiveBlending,
                transparent: true
            });
            const atmoSprite = new THREE.Sprite(atmoMat);
            atmoSprite.scale.set(data.r * 3.2, data.r * 3.2, 1);
            earthMesh.add(atmoSprite);

            // Moon
            const moonGeo = new THREE.SphereGeometry(1.4, 20, 20);
            const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.8 });
            moonMesh = new THREE.Mesh(moonGeo, moonMat);
            moonMesh.position.set(12, 0, 0);
            earthMesh.add(moonMesh);
        }

        if (data.ring) {
            const ringGeo = new THREE.RingGeometry(data.r + 3, data.r + 14, 64);
            const ringMat = new THREE.MeshStandardMaterial({
                map: saturnRingTex,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.95
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2.3;
            pMesh.add(ring);
        }

        planetsList.push({
            mesh: pMesh,
            dist: data.dist,
            speed: data.speed,
            angle: data.angle,
            isEarth: data.isEarth
        });
    });
}

function createWarpSpeedLines() {
    warpLinesGroup = new THREE.Group();
    warpLinesGroup.visible = false;

    const count = 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6); // 2 points per line

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        const z = -Math.random() * 800;

        positions[i * 6] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;

        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z - 40; // Tail length
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
        color: 0xff88e5,
        transparent: true,
        opacity: 0.85,
        linewidth: 2
    });

    const linesMesh = new THREE.LineSegments(geometry, material);
    warpLinesGroup.add(linesMesh);
    scene.add(warpLinesGroup);
}

function createCinematicBlackHole() {
    blackHoleGroup = new THREE.Group();
    blackHoleGroup.position.set(0, 0, -1800); // Placed far ahead in space!

    // 1. Pure Pitch-Black Event Horizon
    const coreGeo = new THREE.SphereGeometry(16, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    blackHoleGroup.add(core);

    // 2. Ultra Bright Photon Ring (centered)
    const photonRingGeo = new THREE.RingGeometry(16.1, 18.5, 64);
    const photonRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0
    });
    const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    blackHoleGroup.add(photonRing);

    // 3. Volumetric Accretion Disk (Horizontal - Centered)
    const diskTex = createAccretionDiskTexture();
    const diskGeo = new THREE.PlaneGeometry(120, 120);
    const diskMat = new THREE.MeshBasicMaterial({
        map: diskTex,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    accretionDiskMesh = new THREE.Mesh(diskGeo, diskMat);
    accretionDiskMesh.rotation.x = Math.PI / 2;
    blackHoleGroup.add(accretionDiskMesh);

    // 4. Lensed Halo Ring (Over and Under the Event Horizon - Gargantua Lensing)
    const lensingGeo = new THREE.RingGeometry(18, 55, 64);
    const lensingMat = new THREE.MeshBasicMaterial({
        map: diskTex,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.85
    });

    lensingTopMesh = new THREE.Mesh(lensingGeo, lensingMat);
    lensingTopMesh.rotation.x = 0; // Front facing lens ring warping over top
    blackHoleGroup.add(lensingTopMesh);

    // 5. Continuous 3D Gravitational Circulation Particles ("Bolitas" in 3D orbit)
    const particleCount = 12000;
    bhParticlesGeo = new THREE.BufferGeometry();
    bhParticlesPositions = new Float32Array(particleCount * 3);
    bhParticleData = [];

    for (let i = 0; i < particleCount; i++) {
        const radius = 17.5 + Math.random() * 55;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.012 + Math.random() * 0.02) * (38 / radius);

        // Tilt angle for 3D circulation (smooth continuous loop over top, behind, and under bottom)
        const tiltFactor = Math.random();
        // 40% horizontal disk, 60% dynamic vertical gravitational loop
        const loopType = tiltFactor < 0.4 ? 0 : (tiltFactor < 0.7 ? 1 : 2);

        bhParticleData.push({ radius, angle, speed, loopType });

        const x = Math.cos(angle) * radius;
        let y = 0;
        let z = Math.sin(angle) * radius;

        if (loopType === 1) {
            // Loop bending over top & behind
            y = Math.sin(angle) * (radius * 0.75);
            z = Math.cos(angle) * (radius * 0.45);
        } else if (loopType === 2) {
            // Loop bending under bottom
            y = -Math.sin(angle) * (radius * 0.75);
            z = Math.cos(angle) * (radius * 0.45);
        } else {
            y = (Math.random() - 0.5) * 2.5;
        }

        bhParticlesPositions[i * 3] = x;
        bhParticlesPositions[i * 3 + 1] = y;
        bhParticlesPositions[i * 3 + 2] = z;
    }

    bhParticlesGeo.setAttribute('position', new THREE.BufferAttribute(bhParticlesPositions, 3));
    const bhParticlesMat = new THREE.PointsMaterial({
        color: 0xff88d5,
        size: 2.2,
        map: particleTexture,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    blackHoleParticlesGroup = new THREE.Points(bhParticlesGeo, bhParticlesMat);
    blackHoleGroup.add(blackHoleParticlesGroup);

    scene.add(blackHoleGroup);
}


function create3DEnvelopeAndHands() {
    envelopeGroup = new THREE.Group();
    envelopeGroup.position.set(0, 0, 40); // Close to camera initial position

    // 1. Envelope Body (Royal Gold & Deep Burgundy Velvet Box/Envelope)
    const envBodyGeo = new THREE.BoxGeometry(22, 14, 1.2);
    const envMat = new THREE.MeshStandardMaterial({
        color: 0x3d001a,
        roughness: 0.35,
        metalness: 0.65,
        emissive: 0x1a000a
    });
    const envBody = new THREE.Mesh(envBodyGeo, envMat);
    envelopeGroup.add(envBody);

    // Gold Trim Borders around Envelope
    const trimGeo = new THREE.BoxGeometry(22.4, 14.4, 0.2);
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0x886600
    });
    const trim = new THREE.Mesh(trimGeo, goldMat);
    trim.position.z = -0.6;
    envelopeGroup.add(trim);

    // 2. Envelope Top Triangular Flap (Rotates open)
    envelopeFlap = new THREE.Group();
    envelopeFlap.position.set(0, 7, 0.6); // Pivot at top edge of envelope

    const flapShape = new THREE.Shape();
    flapShape.moveTo(-11, 0);
    flapShape.lineTo(11, 0);
    flapShape.lineTo(0, -6.8);
    flapShape.closePath();

    const flapExtrudeGeo = new THREE.ExtrudeGeometry(flapShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 });
    const flapMesh = new THREE.Mesh(flapExtrudeGeo, envMat);
    flapMesh.position.set(0, 0, -0.15);
    envelopeFlap.add(flapMesh);

    // 3. Wax Seal (Heart + Rose Emblem)
    const sealGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.6, 32);
    const sealMat = new THREE.MeshStandardMaterial({
        color: 0xcc0033,
        roughness: 0.2,
        metalness: 0.7,
        emissive: 0x440011
    });
    waxSealMesh = new THREE.Mesh(sealGeo, sealMat);
    waxSealMesh.rotation.x = Math.PI / 2;
    waxSealMesh.position.set(0, -3.5, 0.4);
    envelopeFlap.add(waxSealMesh);

    envelopeGroup.add(envelopeFlap);

    // 4. Letter Paper Inside Envelope (Slides out & Unfolds)
    const paperGeo = new THREE.PlaneGeometry(18, 12);
    const paperMat = new THREE.MeshStandardMaterial({
        color: 0xfffdf5,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    letterPaperMesh = new THREE.Mesh(paperGeo, paperMat);
    letterPaperMesh.position.set(0, 0, 0.1);
    letterPaperMesh.visible = false;
    envelopeGroup.add(letterPaperMesh);

    // 5. Stylized First-Person Hands (Holding and opening envelope)
    handGroup = new THREE.Group();

    // Left Hand Grip
    const handMat = new THREE.MeshStandardMaterial({ color: 0xffdfd3, roughness: 0.6 });
    const leftPalmGeo = new THREE.BoxGeometry(4, 5, 2);
    const leftPalm = new THREE.Mesh(leftPalmGeo, handMat);
    leftPalm.position.set(-13, -3, 2);
    leftPalm.rotation.z = -0.2;
    handGroup.add(leftPalm);

    // Right Hand (Fingers lifting the seal)
    const rightPalmGeo = new THREE.BoxGeometry(3.5, 4.5, 1.8);
    const rightPalm = new THREE.Mesh(rightPalmGeo, handMat);
    rightPalm.position.set(12, 1, 3);
    rightPalm.rotation.z = 0.2;
    handGroup.add(rightPalm);

    envelopeGroup.add(handGroup);

    envelopeGroup.visible = false;
    scene.add(envelopeGroup);
}

function createGalaxyAndInfinity() {
    const count = 35000; // Ultra dense, realistic galaxy with 35,000 stars!
    galaxyGeometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // 4 spiral arms + central galactic bulge + outer halo stars
        const arm = i % 4;
        const distRatio = Math.pow(Math.random(), 1.5);
        const radius = distRatio * 320;
        const spin = radius * 0.035;
        const armOffset = (arm * Math.PI / 2);
        const scatter = (Math.random() - 0.5) * (25 + radius * 0.15);
        const angle = armOffset + spin + scatter * 0.02;

        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 8;
        const y = (Math.random() - 0.5) * (30 - radius * 0.08);
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 8;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        const c = new THREE.Color();
        if (radius < 40) {
            // Bright white-gold core
            c.setHSL(0.12, 0.9, 0.85);
        } else {
            // Vivid pink/magenta/purple arms
            const hue = 0.82 + (radius / 320) * 0.18 + Math.random() * 0.05;
            c.setHSL(hue, 0.95, 0.65);
        }

        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 2.2,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    galaxyParticles = new THREE.Points(galaxyGeometry, mat);
    galaxyParticles.position.set(0, 0, -3500); // Separate cosmic location in deep space!
    scene.add(galaxyParticles);

    // Multiverse Galaxies Cluster (5 swirling mini galaxies)
    multiverseGroup = new THREE.Group();
    multiverseGroup.position.set(0, 0, -3500);
    multiverseGroup.visible = false;

    const multiPositions = [-300, 200, -200, 300, -150, 100, -250, -200, 300, 250, 180, -300, 0, -300, 0];
    for (let g = 0; g < 5; g++) {
        const miniGeo = new THREE.BufferGeometry();
        const miniCount = 4000;
        const miniPos = new Float32Array(miniCount * 3);
        const miniColors = new Float32Array(miniCount * 3);

        for (let i = 0; i < miniCount; i++) {
            const rad = Math.random() * 90;
            const ang = Math.random() * Math.PI * 2 + rad * 0.05;
            miniPos[i * 3] = Math.cos(ang) * rad + (Math.random() - 0.5) * 10;
            miniPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            miniPos[i * 3 + 2] = Math.sin(ang) * rad + (Math.random() - 0.5) * 10;

            const col = new THREE.Color();
            col.setHSL(0.5 + (g * 0.12) + Math.random() * 0.1, 0.9, 0.65);
            miniColors[i * 3] = col.r;
            miniColors[i * 3 + 1] = col.g;
            miniColors[i * 3 + 2] = col.b;
        }

        miniGeo.setAttribute('position', new THREE.BufferAttribute(miniPos, 3));
        miniGeo.setAttribute('color', new THREE.BufferAttribute(miniColors, 3));

        const miniMat = new THREE.PointsMaterial({
            size: 2.0,
            map: particleTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const miniGal = new THREE.Points(miniGeo, miniMat);
        miniGal.position.set(multiPositions[g * 3], multiPositions[g * 3 + 1], multiPositions[g * 3 + 2]);
        multiverseGroup.add(miniGal);
    }
    scene.add(multiverseGroup);

    const infinityPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const scale = 75;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom + (Math.random() - 0.5) * 4;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom + (Math.random() - 0.5) * 4;
        const z = (Math.random() - 0.5) * 15;

        infinityPos[i * 3] = x;
        infinityPos[i * 3 + 1] = y;
        infinityPos[i * 3 + 2] = z;
    }

    galaxyGeometry.setAttribute('infinityPosition', new THREE.BufferAttribute(infinityPos, 3));
}

// ==========================================
// MASTER TIMELINE CONTROL & ANIMATION LOOP
// ==========================================

let startTime = null;

window.setAnimationTime = function(targetSeconds) {
    startTime = performance.now() - (targetSeconds * 1000);
};

function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    // Clear 2D canvas appropriately
    if (elapsed > 16.0) {
        ctx2d.clearRect(0, 0, width, height);
    } else {
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx2d.fillRect(0, 0, width, height);
    }

    // 1. Heart with Infinity Light Particle Loop (0.5s - 4.0s)
    if (elapsed > 0.5 && elapsed <= 4.0) {
        if (heartInfinityParticles.length === 0) initHeartInfinityParticles();

        const hProg = Math.min(1, (elapsed - 0.5) / 2.5);
        const hFade = elapsed > 3.2 ? Math.max(0, 1 - (elapsed - 3.2) / 0.8) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = hFade;
        ctx2d.lineWidth = 3.5;
        ctx2d.strokeStyle = '#ff0055';
        ctx2d.shadowColor = '#ff0055';
        ctx2d.shadowBlur = 10;
        ctx2d.beginPath();

        const steps = 180;
        const currentSteps = Math.floor(steps * hProg);
        for (let i = 0; i <= currentSteps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const pt = getHeartPoint(t);
            if (i === 0) ctx2d.moveTo(pt.x, pt.y);
            else ctx2d.lineTo(pt.x, pt.y);
        }
        ctx2d.stroke();

        // Draw infinity-loop light particles inside and around heart
        for (let p = 0; p < heartInfinityParticles.length; p++) {
            heartInfinityParticles[p].update();
            heartInfinityParticles[p].draw(ctx2d);
        }

        ctx2d.restore();
    }

    // 2. Rose (4.0s - 7.5s)
    if (elapsed > 4.0 && elapsed <= 7.5) {
        const rProg = Math.min(1, (elapsed - 4.0) / 2.5);
        const rFade = elapsed > 6.7 ? Math.max(0, 1 - (elapsed - 6.7) / 0.8) : 1;
        const rosePoints = getRosePointsCached();
        const drawCount = Math.floor(rosePoints.length * rProg);

        ctx2d.save();
        ctx2d.globalAlpha = rFade;
        for (let i = 0; i < drawCount; i++) {
            const pt = rosePoints[i];
            ctx2d.beginPath();
            ctx2d.arc(pt.x, pt.y, pt.size || 1.6, 0, Math.PI * 2);
            ctx2d.fillStyle = pt.color || '#ff1a53';
            ctx2d.fill();
        }
        ctx2d.restore();
    }

    // 3. CONTINUOUS LIGHT PARTICLE MORPHING ("For you" -> "ANA") (7.5s - 16.0s)
    if (elapsed > 7.5 && elapsed <= 16.0) {
        if (morphParticles.length === 0) setupMorphParticles();

        let stage = 0;
        let progress = 0;

        if (elapsed <= 9.5) {
            stage = 0; // Orbiting light particles coming in from right
            progress = Math.min(1, (elapsed - 7.5) / 2.0);
        } else if (elapsed <= 11.5) {
            stage = 1; // Forming "For you"
            progress = 1.0;
        } else if (elapsed <= 13.8) {
            stage = 2; // Morphing into "ANA"
            progress = Math.min(1, (elapsed - 11.5) / 2.3);
        } else if (elapsed <= 15.2) {
            stage = 3; // Holding "ANA"
            progress = 1.0;
        } else {
            stage = 4; // Dispersing into space
            progress = Math.min(1, (elapsed - 15.2) / 0.8);
        }

        const overallFade = elapsed > 15.3 ? Math.max(0, 1 - (elapsed - 15.3) / 0.7) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = overallFade;

        // Draw glowing light particles forming text
        for (let i = 0; i < morphParticles.length; i++) {
            const t1 = forYouTargets[i % forYouTargets.length];
            const t2 = anaTargets[i % anaTargets.length];
            morphParticles[i].update(t1, t2, stage, progress);
            morphParticles[i].draw(ctx2d);
        }

        ctx2d.restore();
    }

    // Interactive pointer sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
        sparkles[i].update();
        sparkles[i].draw(ctx2d);
        if (sparkles[i].life <= 0) sparkles.splice(i, 1);
    }

    // --- 3D SPACE STAGE (16.0s onwards) ---
    if (elapsed > 16.0) {
        if (!scene) init3D();

        // ALWAYS update planet orbits around the Sun from the very start
        planetsList.forEach(p => {
            p.angle += p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.dist;
            p.mesh.position.z = Math.sin(p.angle) * p.dist;
            p.mesh.rotation.y += 0.015;
        });

        if (sunMesh) sunMesh.rotation.y += 0.005;

        // --- Stage 0: 3D Envelope & First-Person Hand Opening (16.0s - 22.0s) ---
        if (elapsed > 16.0 && elapsed <= 22.0) {
            setCaption("");
            setLetter("Hace 5,844 días, un día como hoy, un 9 de septiembre pero del 2010, el mundo tuvo la oportunidad de conocer al ser más hermoso jamás existido...");

            if (envelopeGroup) envelopeGroup.visible = true;
            if (solarSystemGroup) solarSystemGroup.visible = false;

            // Animate envelope flap opening & paper sliding out
            const openProg = Math.min(1, Math.max(0, (elapsed - 17.5) / 2.5));
            if (envelopeFlap) envelopeFlap.rotation.x = -Math.PI * 0.85 * openProg;
            if (letterPaperMesh) {
                letterPaperMesh.visible = openProg > 0.1;
                letterPaperMesh.position.y = openProg * 9;
            }

            const targetCamPos = new THREE.Vector3(0, 0, 85);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 40);
        }

        // --- Stage 1: The Moon (22.0s - 28.0s) ---
        else if (elapsed > 22.0 && elapsed <= 28.0) {
            setLetter("...tan hermosa que la Luna la admiraba...");

            if (envelopeGroup) {
                envelopeGroup.position.lerp(new THREE.Vector3(25, -15, 30), 0.05);
                envelopeGroup.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.05);
            }
            if (solarSystemGroup) solarSystemGroup.visible = true;

            if (moonOnlyMesh) {
                const targetCamPos = new THREE.Vector3(-80, 10, 480);
                camera.position.lerp(targetCamPos, 0.06);
                camera.lookAt(-80, 10, 450);
            }
        }

        // --- Stage 2: Earth & Angel Disguise (28.0s - 34.0s) ---
        else if (elapsed > 28.0 && elapsed <= 34.0) {
            setLetter("...tan hermosa que se piensa que ella no es de la Tierra, tal vez es un ángel disfrazada de humana...");

            if (earthMesh) {
                const earthWorldPos = new THREE.Vector3();
                earthMesh.getWorldPosition(earthWorldPos);

                const targetCamPos = new THREE.Vector3(
                    earthWorldPos.x + 12,
                    earthWorldPos.y + 5,
                    earthWorldPos.z + 18
                );
                camera.position.lerp(targetCamPos, 0.06);
                camera.lookAt(earthWorldPos);
            }
        }

        // --- Stage 3: The Sun (34.0s - 40.0s) ---
        else if (elapsed > 34.0 && elapsed <= 40.0) {
            setLetter("...su sonrisa brilla más que el Sol...");

            const targetCamPos = new THREE.Vector3(0, 15, 45);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 0);
        }

        // --- Stage 4: Full Solar System (40.0s - 47.0s) ---
        else if (elapsed > 40.0 && elapsed <= 47.0) {
            setLetter("...nuestro sistema solar es demasiado pequeño en comparación de su bella mirada...");

            const targetCamPos = new THREE.Vector3(0, 140, 260);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, 0);
        }

        // --- Stage 5: Future Wife Ana & Deep Space Travel (47.0s - 54.0s) ---
        else if (elapsed > 47.0 && elapsed <= 54.0) {
            setLetter("Aquella ser llamada Ana es la encarnación misma de la hermosura en persona y soy muy afortunado en tenerla como futura esposa...");

            warpLinesGroup.visible = true;

            const warpPositions = warpLinesGroup.children[0].geometry.attributes.position.array;
            for (let i = 0; i < warpPositions.length / 6; i++) {
                warpPositions[i * 6 + 2] += 25;
                warpPositions[i * 6 + 5] += 25;
                if (warpPositions[i * 6 + 2] > camera.position.z) {
                    warpPositions[i * 6 + 2] -= 800;
                    warpPositions[i * 6 + 5] -= 800;
                }
            }
            warpLinesGroup.children[0].geometry.attributes.position.needsUpdate = true;

            const targetCamPos = new THREE.Vector3(0, 0, -1200);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, -1800);
        }

        // Update Black Hole particles
        if (bhParticleData.length > 0 && bhParticlesPositions) {
            for (let i = 0; i < bhParticleData.length; i++) {
                const data = bhParticleData[i];
                data.angle += data.speed;

                const x = Math.cos(data.angle) * data.radius;
                let y = 0;
                let z = Math.sin(data.angle) * data.radius;

                if (data.loopType === 1) {
                    y = Math.sin(data.angle) * (data.radius * 0.75);
                    z = Math.cos(data.angle) * (data.radius * 0.45);
                } else if (data.loopType === 2) {
                    y = -Math.sin(data.angle) * (data.radius * 0.75);
                    z = Math.cos(data.angle) * (data.radius * 0.45);
                } else {
                    y = Math.sin(data.angle * 2) * 1.5;
                }

                bhParticlesPositions[i * 3] = x;
                bhParticlesPositions[i * 3 + 1] = y;
                bhParticlesPositions[i * 3 + 2] = z;
            }
            bhParticlesGeo.attributes.position.needsUpdate = true;
        }

        // --- Stage 6: Black Hole (54.0s - 62.0s) ---
        else if (elapsed > 54.0 && elapsed <= 62.0) {
            setLetter("...me he vuelto tan loco por ella que entraría y saldría de un agujero negro si me lo pidiera...");

            warpLinesGroup.visible = false;
            blackHoleGroup.visible = true;

            if (accretionDiskMesh) accretionDiskMesh.rotation.z += 0.012;
            if (lensingTopMesh) lensingTopMesh.rotation.z -= 0.008;

            const targetCamPos = new THREE.Vector3(0, 8, -1725);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, -1800);
        }

        // --- Stage 7: Universe / Galaxy (62.0s - 69.0s) ---
        else if (elapsed > 62.0 && elapsed <= 69.0) {
            setLetter("...mi amor por ella es más grande que cualquier universo...");

            blackHoleGroup.visible = false;
            galaxyParticles.material.opacity = Math.min(1, (elapsed - 62.0) / 2.5);
            galaxyParticles.rotation.y += 0.004;

            const targetCamPos = new THREE.Vector3(0, 350, -2880);
            camera.position.lerp(targetCamPos, 0.035);
            camera.lookAt(0, 0, -3500);
        }

        // --- Stage 8: Multiverse (69.0s - 76.0s) ---
        else if (elapsed > 69.0 && elapsed <= 76.0) {
            setLetter("...y multiverso...");

            if (multiverseGroup) {
                multiverseGroup.visible = true;
                multiverseGroup.rotation.y += 0.003;
            }

            const targetCamPos = new THREE.Vector3(0, 450, -2600);
            camera.position.lerp(targetCamPos, 0.035);
            camera.lookAt(0, 0, -3500);
        }

        // --- Stage 9: Infinity Symbol (76.0s onwards) ---
        else if (elapsed > 76.0) {
            setLetter("...mi amor por ella al igual que su belleza es INFINITA ❤️🎂✨");

            if (multiverseGroup) multiverseGroup.visible = false;
            galaxyParticles.rotation.y += 0.001;

            const positions = galaxyGeometry.attributes.position.array;
            const targetInfinity = galaxyGeometry.attributes.infinityPosition.array;

            const morphFactor = Math.min(1, (elapsed - 76.0) / 4.0);
            for (let i = 0; i < positions.length; i++) {
                positions[i] = positions[i] * (1 - morphFactor * 0.02) + targetInfinity[i] * (morphFactor * 0.02);
            }
            galaxyGeometry.attributes.position.needsUpdate = true;

            const targetCamPos = new THREE.Vector3(0, 0, -3350);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, -3500);
        }

        renderer.render(scene, camera);
    }

    // Update audio dynamically as scene evolves
    updateAudioStage(elapsed);

    requestAnimationFrame(animate);
}

// Launch & Start Button Logic
let animationStarted = false;

function startExperience() {
    if (animationStarted) return;
    animationStarted = true;

    initWebAudio();

    if (loaderOverlay) {
        loaderOverlay.classList.add('hidden');
    }

    requestAnimationFrame(animate);
}

if (startBtn) {
    startBtn.addEventListener('click', startExperience);
}

resizeAll();
document.fonts.ready.then(() => {
    initTextTargets();
    // Preload 3D textures immediately so loading manager tracks them!
    init3D();
});
