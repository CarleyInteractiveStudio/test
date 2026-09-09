// --- Preloader, Audio & Setup ---
const canvas2d = document.getElementById('canvas2d');
const ctx2d = canvas2d.getContext('2d');

const captionContainer = document.getElementById('caption-container');
const captionText = document.getElementById('caption-text');

const letterSheetContainer = document.getElementById('letter-sheet-container');
const creditsContent = document.getElementById('credits-content');

let currentActiveScene = 0;

function setLetterVisible(visible) {
    if (!letterSheetContainer) return;
    if (visible) {
        letterSheetContainer.classList.remove('hidden');
    } else {
        letterSheetContainer.classList.add('hidden');
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

    const bgAudio = document.getElementById('bg-romantic-audio');
    if (bgAudio) {
        bgAudio.volume = 0.5;
        bgAudio.play().catch(e => console.warn('Audio play blocked until click:', e));
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

function playSparkleSoundEffect() {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];

    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(synthGainNode);

    osc.start(now);
    osc.stop(now + 0.4);
}

function playBoxUnpackSoundEffect() {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];

    notes.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(synthGainNode);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.8);
    });
}

function playChampagnePopSound() {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;

    // Pop sound (short noise burst)
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(synthGainNode);

    noise.start(now);

    // Fizz chime notes
    [1200, 1500, 1800, 2200].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const fGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.05 + idx * 0.05);
        fGain.gain.setValueAtTime(0.03, now + 0.05 + idx * 0.05);
        fGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(fGain);
        fGain.connect(synthGainNode);
        osc.start(now + 0.05 + idx * 0.05);
        osc.stop(now + 0.4);
    });
}

function playBirthdayFanfareSound() {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;
    // Celebration melody: C4, E4, G4, C5 arpeggio with warm harmonics
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.15);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.15 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

        osc.connect(gain);
        gain.connect(synthGainNode);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 1.2);
    });
}

function playPaperSlideSound() {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(synthGainNode);

    osc.start(now);
    osc.stop(now + 0.35);
}

function playCosmicWhooshSound() {
    if (!audioCtx || !isAudioActive) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.8);
    osc.frequency.exponentialRampToValueAtTime(80, now + 1.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.6);
    gain.gain.linearRampToValueAtTime(0, now + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(synthGainNode);

    osc.start(now);
    osc.stop(now + 1.6);
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

    // Stage 0: Intro (Heart & Rose)
    if (elapsed < 16.0) {
        if (currentAudioStage !== 0) {
            currentAudioStage = 0;
            playRomanticChord([261.63, 329.63, 392.00, 523.25], 6.0); // C major7 romantic
        }
    }
    // Stage 1: Gift Box Unpacking
    else if (elapsed >= 16.0 && elapsed < 32.0) {
        if (currentAudioStage !== 1) {
            currentAudioStage = 1;
            playBoxUnpackSoundEffect();
            playRomanticChord([329.63, 392.00, 493.88, 587.33], 8.0); // E minor7 warm
        }
    }
    // Stage 2: Cosmic Voyage (Earth, Moon, Sun, Solar System)
    else if (elapsed >= 32.0 && elapsed < 112.0) {
        if (currentAudioStage !== 2) {
            currentAudioStage = 2;
            playRomanticChord([196.00, 246.94, 293.66, 369.99], 10.0);
            playCosmicDrone(130.81, 8.0);
        }
    }
    // Stage 3: Universe, Multiverse & Black Hole
    else if (elapsed >= 112.0 && elapsed < 172.0) {
        if (currentAudioStage !== 3) {
            currentAudioStage = 3;
            playCosmicDrone(65.41, 12.0);
            playRomanticChord([130.81, 164.81, 196.00, 246.94], 12.0);
        }
    }
    // Stage 4: 3D Infinity Particles Light Finale
    else if (elapsed >= 172.0) {
        if (currentAudioStage !== 4) {
            currentAudioStage = 4;
            playRomanticChord([220.00, 277.18, 329.63, 440.00, 554.37], 14.0); // Celestial A Major chord
            playCosmicDrone(110.00, 14.0);
            playSparkleSoundEffect();
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
// 2D CANVAS ANIMATIONS (Heart -> Rose -> For you -> ANA) & METEOR SHOWER
// ==========================================

const meteors = [];

function updateAndDrawMeteors(ctx, width, height) {
    if (Math.random() < 0.35) {
        meteors.push({
            x: Math.random() * width * 1.3 - width * 0.15,
            y: -30,
            length: Math.random() * 90 + 60,
            speed: Math.random() * 14 + 9,
            size: Math.random() * 2.2 + 1.0,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.15,
            alpha: 1.0,
            color: Math.random() > 0.35 ? '255, 255, 255' : '255, 120, 200'
        });
    }

    ctx.save();
    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.alpha -= 0.010;

        if (m.alpha <= 0 || m.y > height + 100 || m.x > width + 100) {
            meteors.splice(i, 1);
            continue;
        }

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, `rgba(${m.color}, 0)`);
        grad.addColorStop(0.7, `rgba(${m.color}, ${m.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = m.size;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 1.3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
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

    // Sepal
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

// Drag Interactivity for 3D Letter Sheet UI & 3D Flower Bouquet Rotation
let isDraggingLetter = false;
let isDraggingBouquet = false;
let dragStartX = 0, dragStartY = 0;
let sheetLeft = 0, sheetTop = 0;
let bouquetRotX = Math.PI * 0.42, bouquetRotY = -0.2;

const startPointer = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // Check if dragging letter container
    if (letterSheetContainer && letterSheetContainer.contains(e.target)) {
        isDraggingLetter = true;
        dragStartX = clientX;
        dragStartY = clientY;
        const rect = letterSheetContainer.getBoundingClientRect();
        sheetLeft = rect.left;
        sheetTop = rect.top;
        letterSheetContainer.style.bottom = 'auto';
        letterSheetContainer.style.right = 'auto';
        letterSheetContainer.style.left = `${sheetLeft}px`;
        letterSheetContainer.style.top = `${sheetTop}px`;
        return;
    }

    // Otherwise drag to rotate 3D Flower Bouquet in 3D Space!
    if (cameraFlowerBouquet && cameraFlowerBouquet.visible) {
        isDraggingBouquet = true;
        dragStartX = clientX;
        dragStartY = clientY;
    }
};

const movePointer = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (isDraggingLetter && letterSheetContainer) {
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;
        letterSheetContainer.style.left = `${sheetLeft + deltaX}px`;
        letterSheetContainer.style.top = `${sheetTop + deltaY}px`;
    } else if (isDraggingBouquet && cameraFlowerBouquet) {
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;
        dragStartX = clientX;
        dragStartY = clientY;

        bouquetRotY += deltaX * 0.01;
        bouquetRotX += deltaY * 0.01;

        cameraFlowerBouquet.rotation.y = bouquetRotY;
        cameraFlowerBouquet.rotation.x = bouquetRotX;
    }
};

const stopPointer = () => {
    isDraggingLetter = false;
    isDraggingBouquet = false;
};

window.addEventListener('mousedown', startPointer);
window.addEventListener('mousemove', movePointer);
window.addEventListener('mouseup', stopPointer);

window.addEventListener('touchstart', startPointer, { passive: true });
window.addEventListener('touchmove', movePointer, { passive: true });
window.addEventListener('touchend', stopPointer);

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

// 3D Intro Heart & Flower Morph Meshes
let intro3DGroup, heart3DMesh, flower3DGroup;

// 3D Gift Box, Lid, Ribbon, Champagne, Cake, Bouquet, Envelope, Letter, Infinity & Floating Finale Assets
let giftBoxGroup, giftLidGroup, giftPaperMesh, poppingHearts = [];
let champagneGroup, cakeGroup, bouquetGroup, envelopeGroup, letter3DMesh, infinityGroup;
let candleFlames = [];
let cameraFlowerBouquet; // 3D Bouquet attached to camera during space travel
let finaleFloatingGroup, finaleRoses = [], finaleHearts = [];

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
    }, 100);
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

    // Add camera to scene so camera-attached children render in 1st-person view!
    scene.add(camera);

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

    // 3D Intro Heart and Flower Morph
    create3DIntroHeartAndFlower();

    // 3D Gift Box & Popping Hearts
    create3DGiftBoxAndHearts();

    // Rich Finale Floating Assets (Particles form the sole 3D Infinity loop)
    createRichFinaleAssets();

    // Camera-attached 3D Flower Bouquet (for 1st-person view during space travel)
    createCameraFlowerBouquet();
}

function create3DIntroHeartAndFlower() {
    intro3DGroup = new THREE.Group();
    intro3DGroup.position.set(0, 0, 0);

    // 3D Heart Mesh
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0, -1.5, 2.4, -3.6, 2.4);
    heartShape.bezierCurveTo(-6.0, 2.4, -6.0, -1.2, -6.0, -1.2);
    heartShape.bezierCurveTo(-6.0, -3.6, -3.6, -5.4, 0, -7.8);
    heartShape.bezierCurveTo(3.6, -5.4, 6.0, -3.6, 6.0, -1.2);
    heartShape.bezierCurveTo(6.0, -1.2, 6.0, 2.4, 3.6, 2.4);
    heartShape.bezierCurveTo(1.5, 2.4, 0, 0, 0, 0);

    const extrudeSettings = { depth: 2.0, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.6, bevelThickness: 0.6 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const heartMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0x660022
    });

    heart3DMesh = new THREE.Mesh(heartGeo, heartMat);
    heart3DMesh.scale.set(2.5, 2.5, 2.5);
    heart3DMesh.position.set(0, 5, 0);
    intro3DGroup.add(heart3DMesh);

    // 3D Flower Group
    flower3DGroup = new THREE.Group();
    flower3DGroup.position.set(0, -5, 0);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.5, 0.5, 18, 16);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x00cc66, roughness: 0.4 });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.set(0, -9, 0);
    flower3DGroup.add(stemMesh);

    // Flower Petals
    const petalGeo = new THREE.SphereGeometry(2.5, 16, 16);
    petalGeo.scale(1, 0.3, 2);
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xff3388, roughness: 0.3, emissive: 0x440022 });

    for (let i = 0; i < 12; i++) {
        const pMesh = new THREE.Mesh(petalGeo, petalMat);
        const angle = (i / 12) * Math.PI * 2;
        pMesh.position.set(Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5);
        pMesh.rotation.y = angle;
        pMesh.rotation.x = 0.3;
        flower3DGroup.add(pMesh);
    }

    // Flower Center Core
    const centerGeo = new THREE.SphereGeometry(2.2, 16, 16);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.5, emissive: 0x554400 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    flower3DGroup.add(centerMesh);

    intro3DGroup.add(flower3DGroup);

    intro3DGroup.visible = false;
    scene.add(intro3DGroup);
}

// Helper to construct a realistic, breathtaking 3D Flower Bouquet
function createDetailedRose() {
    const roseGroup = new THREE.Group();

    // Color palette for romantic velvet roses
    const roseColors = [0xd4003d, 0xff1a62, 0xe6004c, 0xc40033, 0xff3377];
    const baseColor = roseColors[Math.floor(Math.random() * roseColors.length)];

    const petalMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.35,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    // Outer, middle, and inner petal rings for realistic spiral blooming rose
    const petalRingConfigs = [
        { count: 7, radius: 1.6, scaleX: 1.2, scaleY: 1.5, rotX: 0.6, yOffset: 0.2 },
        { count: 6, radius: 1.0, scaleX: 1.0, scaleY: 1.3, rotX: 0.45, yOffset: 0.5 },
        { count: 5, radius: 0.5, scaleX: 0.7, scaleY: 1.0, rotX: 0.3, yOffset: 0.8 },
        { count: 4, radius: 0.2, scaleX: 0.4, scaleY: 0.8, rotX: 0.15, yOffset: 1.0 }
    ];

    const petalShape = new THREE.SphereGeometry(1, 14, 14);
    petalShape.scale(1, 0.3, 1.4);

    petalRingConfigs.forEach(config => {
        for (let p = 0; p < config.count; p++) {
            const angle = (p / config.count) * Math.PI * 2 + Math.random() * 0.2;
            const petal = new THREE.Mesh(petalShape, petalMat);

            petal.scale.set(config.scaleX, config.scaleX * 0.4, config.scaleY);
            petal.position.set(
                Math.cos(angle) * config.radius,
                config.yOffset,
                Math.sin(angle) * config.radius
            );

            petal.rotation.y = angle + Math.PI / 2;
            petal.rotation.x = config.rotX;
            petal.rotation.z = (Math.random() - 0.5) * 0.2;

            roseGroup.add(petal);
        }
    });

    // Rose core center bud
    const centerGeo = new THREE.SphereGeometry(0.45, 12, 12);
    centerGeo.scale(0.8, 1.4, 0.8);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0x800020, roughness: 0.2 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.position.y = 1.1;
    roseGroup.add(centerMesh);

    // Green Sepal base underneath
    const sepalMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.5 });
    const sepalGeo = new THREE.ConeGeometry(0.3, 1.2, 5);
    for (let s = 0; s < 5; s++) {
        const sAngle = (s / 5) * Math.PI * 2;
        const sepal = new THREE.Mesh(sepalGeo, sepalMat);
        sepal.position.set(Math.cos(sAngle) * 0.8, -0.2, Math.sin(sAngle) * 0.8);
        sepal.rotation.z = -0.8;
        sepal.rotation.y = sAngle;
        roseGroup.add(sepal);
    }

    return roseGroup;
}

function buildBeautifulBouquetGroup() {
    const bouquet = new THREE.Group();

    // 1. Elegant Multi-Layered Wrapping Paper (Outer & Inner Tissue)
    // Outer Luxury Matte Pink Wrapper
    const wrapOuterGeo = new THREE.ConeGeometry(9.5, 20, 32, 1, true);
    const wrapOuterMat = new THREE.MeshStandardMaterial({
        color: 0xfce4ec,
        roughness: 0.5,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    const wrapOuter = new THREE.Mesh(wrapOuterGeo, wrapOuterMat);
    wrapOuter.rotation.x = Math.PI;
    wrapOuter.position.y = -3;
    bouquet.add(wrapOuter);

    // Inner Cream Wrapping Tissue
    const wrapInnerGeo = new THREE.ConeGeometry(8.8, 18, 32, 1, true);
    const wrapInnerMat = new THREE.MeshStandardMaterial({
        color: 0xfff8e7,
        roughness: 0.6,
        side: THREE.DoubleSide
    });
    const wrapInner = new THREE.Mesh(wrapInnerGeo, wrapInnerMat);
    wrapInner.rotation.x = Math.PI;
    wrapInner.position.y = -1.5;
    bouquet.add(wrapInner);

    // Satin Ribbon Bow at base
    const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0xd40055,
        roughness: 0.2,
        metalness: 0.3
    });
    const bowRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.4, 16, 32), ribbonMat);
    bowRing.rotation.x = Math.PI / 2;
    bowRing.position.set(0, -7, 0);
    bouquet.add(bowRing);

    const bowKnotGeo = new THREE.TorusGeometry(1.6, 0.35, 12, 24);
    const bowLeft = new THREE.Mesh(bowKnotGeo, ribbonMat);
    bowLeft.position.set(-1.8, -7, 2.0);
    bowLeft.rotation.y = 0.5;
    const bowRight = new THREE.Mesh(bowKnotGeo, ribbonMat);
    bowRight.position.set(1.8, -7, 2.0);
    bowRight.rotation.y = -0.5;
    bouquet.add(bowLeft);
    bouquet.add(bowRight);

    // 2. Leaves & Stems
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.4, side: THREE.DoubleSide });
    const leafGeo = new THREE.SphereGeometry(1.8, 10, 10);
    leafGeo.scale(1.0, 0.15, 2.2);

    for (let l = 0; l < 16; l++) {
        const lAngle = (l / 16) * Math.PI * 2;
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const lDist = 5.2 + (l % 2) * 1.5;
        leaf.position.set(Math.cos(lAngle) * lDist, 4.5 + (l % 3) * 0.8, Math.sin(lAngle) * lDist);
        leaf.rotation.y = lAngle;
        leaf.rotation.x = 0.4;
        leaf.rotation.z = (Math.random() - 0.5) * 0.3;
        bouquet.add(leaf);
    }

    // 3. Dense Array of Detailed Roses
    const rosePositions = [
        // Center crown roses
        { x: 0, y: 8.5, z: 0, s: 1.3, rx: 0, ry: 0 },
        { x: -2.2, y: 7.8, z: 1.5, s: 1.2, rx: 0.2, ry: -0.3 },
        { x: 2.2, y: 7.8, z: -1.5, s: 1.2, rx: -0.2, ry: 0.3 },
        { x: 1.8, y: 7.8, z: 2.0, s: 1.15, rx: 0.3, ry: 0.2 },
        { x: -1.8, y: 7.8, z: -2.0, s: 1.15, rx: -0.3, ry: -0.2 },
        // Outer ring roses
        { x: -4.2, y: 6.2, z: 0.5, s: 1.1, rx: 0.5, ry: -0.8 },
        { x: 4.2, y: 6.2, z: -0.5, s: 1.1, rx: -0.5, ry: 0.8 },
        { x: 0.5, y: 6.2, z: 4.2, s: 1.1, rx: 0.8, ry: 0.1 },
        { x: -0.5, y: 6.2, z: -4.2, s: 1.1, rx: -0.8, ry: -0.1 },
        { x: -3.2, y: 6.5, z: 3.2, s: 1.05, rx: 0.6, ry: -0.5 },
        { x: 3.2, y: 6.5, z: -3.2, s: 1.05, rx: -0.6, ry: 0.5 },
        { x: 3.2, y: 6.5, z: 3.2, s: 1.05, rx: 0.6, ry: 0.5 },
        { x: -3.2, y: 6.5, z: -3.2, s: 1.05, rx: -0.6, ry: -0.5 }
    ];

    rosePositions.forEach(pos => {
        const rose = createDetailedRose();
        rose.scale.set(pos.s, pos.s, pos.s);
        rose.position.set(pos.x, pos.y, pos.z);
        rose.rotation.x = pos.rx;
        rose.rotation.y = pos.ry;
        bouquet.add(rose);
    });

    // 4. White Gypsophila (Baby's Breath Filler Flowers)
    const gypMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const gypGeo = new THREE.SphereGeometry(0.35, 8, 8);

    for (let g = 0; g < 45; g++) {
        const gAngle = Math.random() * Math.PI * 2;
        const gDist = Math.random() * 6.5;
        const gypCluster = new THREE.Group();

        for (let b = 0; b < 4; b++) {
            const bud = new THREE.Mesh(gypGeo, gypMat);
            bud.position.set((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9);
            gypCluster.add(bud);
        }

        gypCluster.position.set(
            Math.cos(gAngle) * gDist,
            7.0 + Math.random() * 2.2,
            Math.sin(gAngle) * gDist
        );
        bouquet.add(gypCluster);
    }

    return bouquet;
}

function createCameraFlowerBouquet() {
    cameraFlowerBouquet = buildBeautifulBouquetGroup();

    // Position at lower-left of 1st-person camera view, rotated so roses face directly towards camera
    cameraFlowerBouquet.position.set(-7.0, -4.8, -10);
    cameraFlowerBouquet.rotation.x = Math.PI * 0.42; // Tilt crown of roses directly toward viewer
    cameraFlowerBouquet.rotation.y = -0.2;
    cameraFlowerBouquet.rotation.z = -0.1;
    cameraFlowerBouquet.scale.set(0.45, 0.45, 0.45);

    cameraFlowerBouquet.visible = false;
    camera.add(cameraFlowerBouquet);
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

        // Tilt angle for 3D circulation
        const tiltFactor = Math.random();
        const loopType = tiltFactor < 0.4 ? 0 : (tiltFactor < 0.7 ? 1 : 2);

        // Parameter for Infinity lemniscate curve
        const infT = Math.random() * Math.PI * 2;
        const infSpeed = 0.01 + Math.random() * 0.015;

        bhParticleData.push({ radius, angle, speed, loopType, infT, infSpeed });

        const x = Math.cos(angle) * radius;
        let y = 0;
        let z = Math.sin(angle) * radius;

        if (loopType === 1) {
            y = Math.sin(angle) * (radius * 0.75);
            z = Math.cos(angle) * (radius * 0.45);
        } else if (loopType === 2) {
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

    blackHoleGroup.visible = false;
    scene.add(blackHoleGroup);
}


function build3DBirthdayCake() {
    const cake = new THREE.Group();

    // Cake Stand Base
    const standGeo = new THREE.CylinderGeometry(8, 6, 1.2, 32);
    const standMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = -0.6;
    cake.add(stand);

    // Bottom Cake Tier (Vanilla Vanilla Pink Frosting)
    const tier1Geo = new THREE.CylinderGeometry(6.5, 6.5, 4.5, 32);
    const tier1Mat = new THREE.MeshStandardMaterial({ color: 0xffc0cb, roughness: 0.4 }); // Soft pink
    const tier1 = new THREE.Mesh(tier1Geo, tier1Mat);
    tier1.position.y = 2.25;
    cake.add(tier1);

    // White Cream Drips Tier 1
    const drip1Geo = new THREE.TorusGeometry(6.55, 0.4, 16, 32);
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.3 });
    const drip1 = new THREE.Mesh(drip1Geo, creamMat);
    drip1.rotation.x = Math.PI / 2;
    drip1.position.y = 4.3;
    cake.add(drip1);

    // Top Cake Tier (Strawberry Cream)
    const tier2Geo = new THREE.CylinderGeometry(4.2, 4.2, 3.8, 32);
    const tier2Mat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.35 }); // Hot pink
    const tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
    tier2.position.y = 6.4;
    cake.add(tier2);

    // White Cream Top Ring
    const drip2 = new THREE.Mesh(new THREE.TorusGeometry(4.25, 0.35, 16, 32), creamMat);
    drip2.rotation.x = Math.PI / 2;
    drip2.position.y = 8.3;
    cake.add(drip2);

    // Strawberries / Cherries on top
    const berryGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.2, metalness: 0.1 });
    for (let c = 0; c < 8; c++) {
        const cAngle = (c / 8) * Math.PI * 2;
        const berry = new THREE.Mesh(berryGeo, berryMat);
        berry.position.set(Math.cos(cAngle) * 3.2, 8.6, Math.sin(cAngle) * 3.2);
        cake.add(berry);
    }

    // Glowing Candles
    candleFlames = [];
    const candlePositions = [
        { x: -1.2, z: 0 },
        { x: 1.2, z: 0 },
        { x: 0, z: -1.2 },
        { x: 0, z: 1.2 }
    ];

    const candleMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.3 });
    const flameGeo = new THREE.ConeGeometry(0.35, 0.9, 12);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    candlePositions.forEach(pos => {
        const candleGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.2, 16);
        const candle = new THREE.Mesh(candleGeo, candleMat);
        candle.position.set(pos.x, 9.4, pos.z);
        cake.add(candle);

        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(pos.x, 10.9, pos.z);
        cake.add(flame);

        const flameLight = new THREE.PointLight(0xffaa00, 1.5, 10);
        flameLight.position.set(pos.x, 11.0, pos.z);
        cake.add(flameLight);

        candleFlames.push({ mesh: flame, light: flameLight, baseScale: 1.0 });
    });

    return cake;
}


function createRichFinaleAssets() {
    finaleFloatingGroup = new THREE.Group();
    finaleFloatingGroup.position.set(0, 0, -1800);

    // 1. Floating 3D Rose Models around Infinity
    for (let i = 0; i < 18; i++) {
        const rose = createDetailedRose();
        const scale = 1.2 + Math.random() * 1.5;
        rose.scale.set(scale, scale, scale);

        const angle = (i / 18) * Math.PI * 2;
        const rad = 60 + Math.random() * 50;

        rose.position.set(
            Math.cos(angle) * rad,
            (Math.random() - 0.5) * 60,
            Math.sin(angle) * rad - 20
        );

        finaleFloatingGroup.add(rose);
        finaleRoses.push({
            mesh: rose,
            rotSpeedX: (Math.random() - 0.5) * 0.02,
            rotSpeedY: (Math.random() - 0.5) * 0.02,
            floatOffsetY: Math.random() * Math.PI * 2
        });
    }

    // 2. Floating 3D Heart Meshes
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0, -0.8, 1.2, -1.8, 1.2);
    heartShape.bezierCurveTo(-3.0, 1.2, -3.0, -0.6, -3.0, -0.6);
    heartShape.bezierCurveTo(-3.0, -1.8, -1.8, -2.7, 0, -3.9);
    heartShape.bezierCurveTo(1.8, -2.7, 3.0, -1.8, 3.0, -0.6);
    heartShape.bezierCurveTo(3.0, -0.6, 3.0, 1.2, 1.8, 1.2);
    heartShape.bezierCurveTo(0.8, 1.2, 0, 0, 0, 0);

    const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.3, bevelThickness: 0.3 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

    const heartColors = [0xff0055, 0xff3388, 0xff66aa, 0xffd700, 0xff1a53];

    for (let i = 0; i < 30; i++) {
        const hMat = new THREE.MeshStandardMaterial({
            color: heartColors[i % heartColors.length],
            metalness: 0.5,
            roughness: 0.2,
            emissive: 0x550011
        });

        const heartMesh = new THREE.Mesh(heartGeo, hMat);
        const scale = 0.8 + Math.random() * 1.2;
        heartMesh.scale.set(scale, scale, scale);

        const angle = Math.random() * Math.PI * 2;
        const rad = 40 + Math.random() * 80;

        heartMesh.position.set(
            Math.cos(angle) * rad,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 60
        );

        finaleFloatingGroup.add(heartMesh);
        finaleHearts.push({
            mesh: heartMesh,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            floatOffset: Math.random() * Math.PI * 2
        });
    }

    finaleFloatingGroup.visible = false;
    scene.add(finaleFloatingGroup);
}

function create3DGiftBoxAndHearts() {
    // Isolated location far away from the Solar System (Z = -6000)
    giftBoxGroup = new THREE.Group();
    giftBoxGroup.position.set(0, 0, -6000);

    // 1. Velvet Red Gift Box Base
    const boxGeo = new THREE.BoxGeometry(20, 15, 20);
    const velvetMat = new THREE.MeshStandardMaterial({
        color: 0x800020,
        roughness: 0.3,
        metalness: 0.5,
        emissive: 0x2b000b
    });
    const boxBase = new THREE.Mesh(boxGeo, velvetMat);
    giftBoxGroup.add(boxBase);

    // Gold Ribbon Bands around box base
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0x664400
    });
    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(20.3, 15.1, 3.5), goldMat);
    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(3.5, 15.1, 20.3), goldMat);
    giftBoxGroup.add(ribbonV);
    giftBoxGroup.add(ribbonH);

    // 2. Gift Box Lid (Removable / Rotates open)
    giftLidGroup = new THREE.Group();
    giftLidGroup.position.set(0, 7.5, 0);

    const lidGeo = new THREE.BoxGeometry(21, 3.5, 21);
    const lidMesh = new THREE.Mesh(lidGeo, velvetMat);
    lidMesh.position.set(0, 1.75, 0);
    giftLidGroup.add(lidMesh);

    // Ribbon cross on lid
    const lidRibV = new THREE.Mesh(new THREE.BoxGeometry(21.3, 3.6, 3.7), goldMat);
    lidRibV.position.set(0, 1.75, 0);
    const lidRibH = new THREE.Mesh(new THREE.BoxGeometry(3.7, 3.6, 21.3), goldMat);
    lidRibH.position.set(0, 1.75, 0);
    giftLidGroup.add(lidRibV);
    giftLidGroup.add(lidRibH);

    // Ribbon Bow on top
    const bowGeo = new THREE.TorusGeometry(3.0, 0.7, 16, 32);
    const bowLeft = new THREE.Mesh(bowGeo, goldMat);
    bowLeft.rotation.y = Math.PI / 4;
    bowLeft.position.set(-2.0, 4.5, 0);
    const bowRight = new THREE.Mesh(bowGeo, goldMat);
    bowRight.rotation.y = -Math.PI / 4;
    bowRight.position.set(2.0, 4.5, 0);
    giftLidGroup.add(bowLeft);
    giftLidGroup.add(bowRight);

    giftBoxGroup.add(giftLidGroup);

    // 3. Champagne Bottles ("Botellas de Champaña")
    champagneGroup = new THREE.Group();
    champagneGroup.position.set(0, 0, 0);

    const bottleMat = new THREE.MeshStandardMaterial({
        color: 0x0f3811,
        roughness: 0.1,
        metalness: 0.8
    });
    const foilMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.2
    });

    for (let b = 0; b < 2; b++) {
        const bottle = new THREE.Group();
        bottle.position.set((b - 0.5) * 5, 0, 0);

        const bodyGeo = new THREE.CylinderGeometry(2.0, 2.0, 9, 32);
        const bodyMesh = new THREE.Mesh(bodyGeo, bottleMat);
        bodyMesh.position.y = 4.5;
        bottle.add(bodyMesh);

        const neckGeo = new THREE.CylinderGeometry(0.7, 2.0, 5, 32);
        const neckMesh = new THREE.Mesh(neckGeo, bottleMat);
        neckMesh.position.y = 11.5;
        bottle.add(neckMesh);

        const foilGeo = new THREE.CylinderGeometry(0.75, 1.0, 3.0, 32);
        const foilMesh = new THREE.Mesh(foilGeo, foilMat);
        foilMesh.position.y = 14.0;
        bottle.add(foilMesh);

        champagneGroup.add(bottle);
    }
    champagneGroup.visible = false;
    giftBoxGroup.add(champagneGroup);

    // 4. 3D Birthday Cake ("Pastel de Cumpleaños 3D")
    cakeGroup = build3DBirthdayCake();
    cakeGroup.position.set(0, 0, 0);
    cakeGroup.visible = false;
    giftBoxGroup.add(cakeGroup);

    // 5. Detailed Flower Bouquet ("Ramo de Flores 3D")
    bouquetGroup = buildBeautifulBouquetGroup();
    bouquetGroup.position.set(0, 0, 0);
    bouquetGroup.scale.set(0.75, 0.75, 0.75);
    bouquetGroup.visible = false;
    giftBoxGroup.add(bouquetGroup);

    // 6. 3D Red Envelope with opening flap ("Sobre Rojo 3D")
    envelopeGroup = new THREE.Group();
    envelopeGroup.position.set(0, 0, 0);

    const redEnvelopeMat = new THREE.MeshStandardMaterial({
        color: 0xd32f2f,
        roughness: 0.3,
        metalness: 0.2
    });

    const envGeo = new THREE.BoxGeometry(12, 8, 0.6);
    const envBody = new THREE.Mesh(envGeo, redEnvelopeMat);
    envelopeGroup.add(envBody);

    // Opening Triangular Flap
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-6, 0);
    flapShape.lineTo(6, 0);
    flapShape.lineTo(0, -4);
    flapShape.lineTo(-6, 0);

    const flapGeo = new THREE.ShapeGeometry(flapShape);
    const envFlap = new THREE.Mesh(flapGeo, redEnvelopeMat);
    envFlap.position.set(0, 4, 0.31);
    envFlap.name = "envelopeFlap";
    envelopeGroup.add(envFlap);

    // Gold Heart Wax Seal
    const sealGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 24);
    const sealMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.8
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.set(0, 2, 0.55);
    envelopeGroup.add(sealMesh);

    envelopeGroup.visible = false;
    giftBoxGroup.add(envelopeGroup);

    // 7. 3D Paper Letter Sheet ("Carta 3D Desplegada")
    const letterGeo = new THREE.PlaneGeometry(12, 16);
    const letterMat = new THREE.MeshStandardMaterial({
        color: 0xfffcf0,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    letter3DMesh = new THREE.Mesh(letterGeo, letterMat);
    letter3DMesh.position.set(-14, 4, 0);
    letter3DMesh.visible = false;
    giftBoxGroup.add(letter3DMesh);

    // 8. Popping 3D Hearts
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0, -0.5, 0.8, -1.2, 0.8);
    heartShape.bezierCurveTo(-2.0, 0.8, -2.0, -0.4, -2.0, -0.4);
    heartShape.bezierCurveTo(-2.0, -1.2, -1.2, -1.8, 0, -2.6);
    heartShape.bezierCurveTo(1.2, -1.8, 2.0, -1.2, 2.0, -0.4);
    heartShape.bezierCurveTo(2.0, -0.4, 2.0, 0.8, 1.2, 0.8);
    heartShape.bezierCurveTo(0.5, 0.8, 0, 0, 0, 0);

    const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

    const heartColors = [0xff0055, 0xff3388, 0xff66aa, 0xffd700, 0xff1a53];

    for (let i = 0; i < 25; i++) {
        const hMat = new THREE.MeshStandardMaterial({
            color: heartColors[i % heartColors.length],
            metalness: 0.4,
            roughness: 0.2,
            emissive: 0x440011
        });
        const heartMesh = new THREE.Mesh(heartGeo, hMat);
        const scale = 0.6 + Math.random() * 0.8;
        heartMesh.scale.set(scale, scale, scale);

        heartMesh.position.set(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 12
        );
        heartMesh.visible = false;

        giftBoxGroup.add(heartMesh);
        poppingHearts.push({
            mesh: heartMesh,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.8 + Math.random() * 1.2,
            vz: (Math.random() - 0.5) * 0.8,
            rotX: (Math.random() - 0.5) * 0.08,
            rotY: (Math.random() - 0.5) * 0.08
        });
    }

    giftBoxGroup.visible = false;
    scene.add(giftBoxGroup);
}

function createGalaxyAndInfinity() {
    const count = 35000;
    galaxyGeometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
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
            c.setHSL(0.12, 0.9, 0.85);
        } else {
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
    galaxyParticles.position.set(0, 0, -3500);
    scene.add(galaxyParticles);

    // Multiverse Galaxies Cluster
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

    // Clear 2D canvas appropriately; meteor shower plays ONLY during initial 2D sequence (elapsed <= 16.0)
    if (elapsed > 16.0) {
        ctx2d.clearRect(0, 0, width, height);
    } else {
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx2d.fillRect(0, 0, width, height);
        // Draw meteor shower in background ONLY during initial sequence
        updateAndDrawMeteors(ctx2d, width, height);
    }

    // 1. Glowing Neon Heart Drawing (0.5s - 4.0s)
    if (elapsed > 0.5 && elapsed <= 4.0) {
        const hProg = Math.min(1, (elapsed - 0.5) / 2.5);
        const hFade = elapsed > 3.2 ? Math.max(0, 1 - (elapsed - 3.2) / 0.8) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = hFade;
        ctx2d.lineWidth = 3.5;
        ctx2d.strokeStyle = '#ff0055';
        ctx2d.shadowColor = '#ff0055';
        ctx2d.shadowBlur = 8;
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
            stage = 0;
            progress = Math.min(1, (elapsed - 7.5) / 2.0);
        } else if (elapsed <= 11.5) {
            stage = 1;
            progress = 1.0;
        } else if (elapsed <= 13.8) {
            stage = 2;
            progress = Math.min(1, (elapsed - 11.5) / 2.3);
        } else if (elapsed <= 15.2) {
            stage = 3;
            progress = 1.0;
        } else {
            stage = 4;
            progress = Math.min(1, (elapsed - 15.2) / 0.8);
        }

        const overallFade = elapsed > 15.3 ? Math.max(0, 1 - (elapsed - 15.3) / 0.7) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = overallFade;

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

        // Reveal 3D Intro Heart & Flower Morph transitioning into 3D space (16s - 20s)
        if (intro3DGroup) {
            intro3DGroup.visible = elapsed >= 16.0 && elapsed <= 21.0;
            if (intro3DGroup.visible) {
                intro3DGroup.rotation.y += 0.02;
                if (heart3DMesh) heart3DMesh.rotation.z = Math.sin(elapsed * 2) * 0.15;
            }
        }

        // ALWAYS update planet orbits around the Sun from the very start
        planetsList.forEach(p => {
            p.angle += p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.dist;
            p.mesh.position.z = Math.sin(p.angle) * p.dist;
            p.mesh.rotation.y += 0.015;
        });

        if (sunMesh) sunMesh.rotation.y += 0.005;

        const time3D = elapsed - 16.0;

        // Reveal Letter Parchment Overlay EXACTLY when the envelope opens and letter unfolds (time3D >= 15.5s)!
        setLetterVisible(time3D >= 15.5);

        // Keep 3D Flower bouquet attached to camera (1st person view) after it rises out!
        if (cameraFlowerBouquet) {
            cameraFlowerBouquet.visible = time3D >= 10.0;
        }

        // Letter text starts scrolling ONLY after 16.5 seconds using viewport scrollTop so native scrolling remains fully functional!
        const textViewport = document.querySelector('.scroll-text-viewport');
        if (textViewport && creditsContent) {
            if (time3D >= 16.5) {
                const maxScroll = Math.max(0, creditsContent.scrollHeight - textViewport.clientHeight);
                const targetScroll = (time3D - 16.5) * 14;
                // Clamp scroll so final paragraph stays resting at the bottom and user can manually scroll back up anytime!
                if (!isDraggingLetter) {
                    textViewport.scrollTop = Math.min(targetScroll, maxScroll);
                }
            } else {
                textViewport.scrollTop = 0;
            }
        }

        // Animate candle flames flicker
        candleFlames.forEach(c => {
            const flicker = 1.0 + Math.sin(timestamp * 0.01 + c.mesh.position.x) * 0.2;
            c.mesh.scale.set(flicker, flicker * 1.1, flicker);
            c.light.intensity = 1.5 * flicker;
        });

        // Determine current active scene based on time3D timeline, giving plenty of time so text reaches 60%+ down viewport before scene changes
        if (time3D <= 16.5) currentActiveScene = 0;       // Gift box: Sequential Unpacking Cinematics
        else if (time3D <= 36.0) currentActiveScene = 1;  // Earth (Stats & Birth)
        else if (time3D <= 56.0) currentActiveScene = 2;  // Moon ISOLATED ("su hermosa sonrisa brilla más que la luna")
        else if (time3D <= 76.0) currentActiveScene = 3;  // Sun ("su mirada atractiva alimenta de energía nuestra estrella")
        else if (time3D <= 96.0) currentActiveScene = 4;  // Solar System ("y si comparamos nuestro sistema solar")
        else if (time3D <= 126.0) currentActiveScene = 5; // Universe & Multiverses ("o si pongamos el universo entero... Dios...")
        else if (time3D <= 156.0) currentActiveScene = 6; // Black Hole ("el loco que entraría y saldría de un agujero negro")
        else if (time3D <= 186.0) currentActiveScene = 7; // Infinity 3D ("porque mi amor para ella es infinito")
        else currentActiveScene = 8;                      // Grand Finale

        // Track audio triggers for sequential milestone sound effects
        if (!window.audioTriggers) window.audioTriggers = {};

        // --- Stage 0: 3D Gift Box Sequential Unpacking Cinematics (0s - 18s) ---
        if (currentActiveScene === 0) {
            if (giftBoxGroup) giftBoxGroup.visible = true;
            if (solarSystemGroup) solarSystemGroup.visible = false;

            const openProg = Math.min(1, Math.max(0, (time3D - 0.5) / 1.5));
            if (giftLidGroup) {
                giftLidGroup.rotation.x = -Math.PI * 0.75 * openProg;
                giftLidGroup.position.z = -openProg * 14;
            }

            // 1. Champagne rises high up and lowers to left position (1.5s - 5.5s)
            if (champagneGroup) {
                if (time3D >= 1.5) {
                    champagneGroup.visible = true;
                    const cPhase = Math.min(1, (time3D - 1.5) / 4.0);
                    const riseHeight = Math.sin(cPhase * Math.PI) * 16;
                    champagneGroup.position.y = 2 + riseHeight;
                    champagneGroup.position.x = -12 * cPhase;
                    champagneGroup.position.z = 4 * cPhase;

                    if (!window.audioTriggers.champagne) {
                        window.audioTriggers.champagne = true;
                        playChampagnePopSound();
                    }
                }
            }

            // 2. Birthday Cake rises high up and lowers to center position (5.5s - 9.5s)
            if (cakeGroup) {
                if (time3D >= 5.5) {
                    cakeGroup.visible = true;
                    const kPhase = Math.min(1, (time3D - 5.5) / 4.0);
                    const riseHeight = Math.sin(kPhase * Math.PI) * 18;
                    cakeGroup.position.y = 1 + riseHeight;
                    cakeGroup.position.x = 0;
                    cakeGroup.position.z = 10 * kPhase;

                    if (!window.audioTriggers.cake) {
                        window.audioTriggers.cake = true;
                        playBirthdayFanfareSound();
                    }
                }
            }

            // 3. Flower Bouquet rises high up and moves towards camera (9.5s - 13.5s)
            if (bouquetGroup) {
                if (time3D >= 9.5) {
                    bouquetGroup.visible = true;
                    const bPhase = Math.min(1, (time3D - 9.5) / 4.0);
                    const riseHeight = Math.sin(bPhase * Math.PI) * 20;
                    bouquetGroup.position.y = 3 + riseHeight;
                    bouquetGroup.position.x = 12 * bPhase;
                    bouquetGroup.position.z = 5 * bPhase;
                }
            }

            // 4. Red Envelope rises out, opens flap, and unfolding sheet comes to camera UI (13.5s - 18.0s)
            if (envelopeGroup) {
                if (time3D >= 13.5 && time3D < 16.5) {
                    envelopeGroup.visible = true;
                    const ePhase = Math.min(1, (time3D - 13.5) / 2.0);
                    envelopeGroup.position.y = 2 + Math.sin(ePhase * Math.PI) * 12;
                    envelopeGroup.position.x = 0;
                    envelopeGroup.position.z = 14 * ePhase;

                    // Open envelope flap
                    const flapMesh = envelopeGroup.getObjectByName("envelopeFlap");
                    if (flapMesh && ePhase > 0.5) {
                        flapMesh.rotation.x = Math.PI * (ePhase - 0.5) * 1.5;

                        if (!window.audioTriggers.envelope) {
                            window.audioTriggers.envelope = true;
                            playPaperSlideSound();
                        }
                    }
                } else {
                    envelopeGroup.visible = false;
                }
            }

            // 5. Letter Sheet comes out of envelope and unfolds (15.5s - 18.0s)
            if (letter3DMesh) {
                if (time3D >= 15.5) {
                    letter3DMesh.visible = true;
                    const lPhase = Math.min(1, (time3D - 15.5) / 2.5);
                    letter3DMesh.scale.set(1.0, lPhase, 1.0);
                    letter3DMesh.position.set(0, 6 + lPhase * 2, 20);
                }
            }

            poppingHearts.forEach(h => {
                h.mesh.visible = openProg > 0.1;
                if (h.mesh.visible) {
                    h.mesh.position.x += h.vx * 0.3;
                    h.mesh.position.y += h.vy * 0.3;
                    h.mesh.position.z += h.vz * 0.3;
                    h.mesh.rotation.x += h.rotX;
                    h.mesh.rotation.y += h.rotY;
                }
            });

            const targetCamPos = new THREE.Vector3(0, 8, -5910);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 2, -6000);
        }

        // --- Stage 1: Earth (Birth Stats & Ana Clara) ---
        else if (currentActiveScene === 1) {
            if (solarSystemGroup) solarSystemGroup.visible = true;
            if (sunMesh) sunMesh.visible = true;
            planetsList.forEach(p => p.mesh.visible = true);
            if (giftBoxGroup) giftBoxGroup.visible = false;

            if (earthMesh) {
                const earthWorldPos = new THREE.Vector3();
                earthMesh.getWorldPosition(earthWorldPos);

                const targetCamPos = new THREE.Vector3(
                    earthWorldPos.x - 12,
                    earthWorldPos.y + 6,
                    earthWorldPos.z + 24
                );
                camera.position.lerp(targetCamPos, 0.06);
                camera.lookAt(earthWorldPos);
            }
        }

        // --- Stage 2: The Moon ISOLATED ("su hermosa sonrisa brilla mas que la luna") ---
        else if (currentActiveScene === 2) {
            if (solarSystemGroup) solarSystemGroup.visible = true;
            // Hide Sun and other planets so Moon is completely isolated in space!
            if (sunMesh) sunMesh.visible = false;
            planetsList.forEach(p => p.mesh.visible = false);

            if (moonOnlyMesh) {
                moonOnlyMesh.visible = true;
                moonOnlyMesh.rotation.y += 0.005;
                const targetCamPos = new THREE.Vector3(-95, 10, 480);
                camera.position.lerp(targetCamPos, 0.06);
                camera.lookAt(-80, 10, 450);
            }
        }

        // --- Stage 3: The Sun ("su mirada atractiva alimenta de energia nuestra estrella") ---
        else if (currentActiveScene === 3) {
            if (solarSystemGroup) solarSystemGroup.visible = true;
            if (sunMesh) sunMesh.visible = true;
            planetsList.forEach(p => p.mesh.visible = true);

            const targetCamPos = new THREE.Vector3(-25, 15, 65);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 0);
        }

        // --- Stage 4: Full Solar System ("y si comparamos nuestro sistema solar") ---
        else if (currentActiveScene === 4) {
            if (solarSystemGroup) solarSystemGroup.visible = true;
            if (sunMesh) sunMesh.visible = true;
            planetsList.forEach(p => p.mesh.visible = true);

            const targetCamPos = new THREE.Vector3(-60, 160, 310);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, 0);
        }

        // --- Stage 5: Universe, Galaxias & Multiverses ---
        else if (currentActiveScene === 5) {
            if (solarSystemGroup) solarSystemGroup.visible = false;

            if (galaxyParticles) {
                galaxyParticles.material.opacity = Math.min(1, (time3D - 58.0) / 2.0);
                galaxyParticles.rotation.y += 0.004;
            }

            if (multiverseGroup) {
                multiverseGroup.visible = true;
                multiverseGroup.rotation.y += 0.003;
            }

            const targetCamPos = new THREE.Vector3(-100, 450, -2600);
            camera.position.lerp(targetCamPos, 0.035);
            camera.lookAt(0, 0, -3500);
        }

        // --- Stage 6: Gargantua Black Hole ("el loco que entraria y saldria de un agujero negro") ---
        else if (currentActiveScene === 6) {
            if (multiverseGroup) multiverseGroup.visible = false;
            if (galaxyParticles) galaxyParticles.material.opacity = 0;

            if (blackHoleGroup) {
                blackHoleGroup.visible = true;
                // Show core black sphere and disk
                blackHoleGroup.children.forEach(c => { if (c !== blackHoleParticlesGroup) c.visible = true; });
                if (accretionDiskMesh) accretionDiskMesh.rotation.z += 0.012;
                if (lensingTopMesh) lensingTopMesh.rotation.z -= 0.008;
            }

            const targetCamPos = new THREE.Vector3(-30, 10, -1725);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, -1800);
        }

        // --- Stage 7 & 8: Persistent Rich 3D Light Particle Infinity Loop, Floating Roses & Hearts ("porque mi amor para ella es infinito") ---
        else if (currentActiveScene >= 7) {
            if (blackHoleGroup) {
                blackHoleGroup.visible = true;
                // Hide black sphere, disk & lens rings so ONLY the morphing particles forming the 3D Infinity light loop remain!
                blackHoleGroup.children.forEach(c => { if (c !== blackHoleParticlesGroup) c.visible = false; });
                blackHoleParticlesGroup.rotation.y += 0.012;
                blackHoleParticlesGroup.rotation.z = Math.sin(time3D * 1.2) * 0.1;
            }

            if (finaleFloatingGroup) {
                finaleFloatingGroup.visible = true;
                finaleFloatingGroup.rotation.y += 0.005;

                // Animate floating roses
                finaleRoses.forEach(r => {
                    r.mesh.rotation.x += r.rotSpeedX;
                    r.mesh.rotation.y += r.rotSpeedY;
                    r.mesh.position.y += Math.sin(time3D * 1.5 + r.floatOffsetY) * 0.05;
                });

                // Animate floating hearts
                finaleHearts.forEach(h => {
                    h.mesh.rotation.y += h.rotSpeed;
                    h.mesh.position.y += Math.sin(time3D * 2.0 + h.floatOffset) * 0.08;
                });
            }

            const targetCamPos = new THREE.Vector3(0, 0, -1700);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, -1800);
        }

        // Always update Black Hole / Infinity particles
        if (blackHoleGroup && blackHoleGroup.visible && bhParticleData.length > 0 && bhParticlesPositions) {
            const isInfinityStage = currentActiveScene >= 7;

            for (let i = 0; i < bhParticleData.length; i++) {
                const data = bhParticleData[i];

                if (!isInfinityStage) {
                    // Standard Black Hole Orbit
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
                } else {
                    // Morph & Animate along 3D Lemniscate Infinity Curve (∞)
                    data.infT += data.infSpeed;
                    const t = data.infT;
                    const scale = 45;
                    const denom = 1 + Math.sin(t) * Math.sin(t);

                    const infX = (scale * Math.cos(t)) / denom + (Math.sin(t * 3 + i) * 1.8);
                    const infY = (scale * Math.sin(t) * Math.cos(t)) / denom + (Math.cos(t * 3 + i) * 1.8);
                    const infZ = Math.sin(t * 2) * 8 + (Math.sin(i) * 2.0);

                    // Smooth interpolation into Infinity shape
                    const currX = bhParticlesPositions[i * 3];
                    const currY = bhParticlesPositions[i * 3 + 1];
                    const currZ = bhParticlesPositions[i * 3 + 2];

                    bhParticlesPositions[i * 3] += (infX - currX) * 0.12;
                    bhParticlesPositions[i * 3 + 1] += (infY - currY) * 0.12;
                    bhParticlesPositions[i * 3 + 2] += (infZ - currZ) * 0.12;
                }
            }
            bhParticlesGeo.attributes.position.needsUpdate = true;
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
