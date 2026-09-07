const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let heartScale, roseScale, centerX, centerY, rightX, rightY;

// Interactive particles
const userParticles = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // Adjust centers based on screen size
    if (width > 800) {
        centerX = width * 0.35;
        centerY = height * 0.5;
        rightX = width * 0.75;
        rightY = height * 0.5;
        heartScale = Math.min(width, height) / 45;
        roseScale = Math.min(width, height) / 50;
    } else {
        // Mobile layout
        centerX = width * 0.5;
        centerY = height * 0.38;
        rightX = width * 0.5;
        rightY = height * 0.78;
        heartScale = Math.min(width, height) / 50;
        roseScale = Math.min(width, height) / 55;
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
    initTextTargets();
});

// --- Parametric Heart Data ---
function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return {
        x: centerX + x * heartScale,
        y: centerY + y * heartScale - 30
    };
}

// --- Parametric Rose Data ---
function getRosePoints() {
    const points = [];

    // Rose center base position
    const roseCenterX = centerX;
    const roseCenterY = centerY + 10;

    // Stem
    for (let t = 0; t <= 1; t += 0.02) {
        const sy = roseCenterY + 10 + t * 90;
        const sx = roseCenterX + Math.sin(t * Math.PI * 2) * 5;
        points.push({ x: sx, y: sy, type: 'stem' });
    }

    // Leaves
    for (let t = 0; t <= Math.PI * 2; t += 0.15) {
        // Left leaf
        let lx = roseCenterX - 10 - Math.sin(t) * 18;
        let ly = roseCenterY + 55 - Math.cos(t) * 8;
        points.push({ x: lx, y: ly, type: 'leaf' });

        // Right leaf
        let rx = roseCenterX + 10 + Math.sin(t) * 18;
        let ry = roseCenterY + 40 - Math.cos(t) * 8;
        points.push({ x: rx, y: ry, type: 'leaf' });
    }

    // Rose Petals - Elegant concentric layered petals
    const numPetals = 280;
    for (let i = 0; i < numPetals; i++) {
        const theta = (i / numPetals) * Math.PI * 8;
        const r = (Math.sin(2.5 * theta) * 0.4 + 0.6) * (theta * 1.8) * (roseScale * 0.25);
        const x = roseCenterX + r * Math.cos(theta);
        const y = roseCenterY + r * Math.sin(theta);
        points.push({ x, y, type: 'petal' });
    }

    return points;
}

// --- Offscreen text rendering to sample "For you" particle targets ---
let textTargets = [];

function initTextTargets() {
    textTargets = [];
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 600;
    offCanvas.height = 300;
    const offCtx = offCanvas.getContext('2d');

    const fontSize = width < 800 ? 70 : 100;
    offCtx.font = `bold ${fontSize}px 'Great Vibes', cursive, sans-serif`;
    offCtx.fillStyle = '#ffffff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText('For you', offCanvas.width / 2, offCanvas.height / 2);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    const step = width < 800 ? 3 : 4;
    for (let y = 0; y < offCanvas.height; y += step) {
        for (let x = 0; x < offCanvas.width; x += step) {
            const index = (y * offCanvas.width + x) * 4;
            const alpha = data[index + 3];
            if (alpha > 128) {
                const targetX = rightX + (x - offCanvas.width / 2);
                const targetY = rightY + (y - offCanvas.height / 2);
                textTargets.push({ x: targetX, y: targetY });
            }
        }
    }
}

// --- Orbiting Lights / Particles forming "For you" ---
class LightParticle {
    constructor(target, index, total) {
        this.target = target;
        this.angle = (index / total) * Math.PI * 2 + Math.random() * 0.5;
        this.radius = 80 + Math.random() * 100;
        this.speed = 0.02 + Math.random() * 0.02;
        this.x = rightX + Math.cos(this.angle) * this.radius;
        this.y = rightY + Math.sin(this.angle) * this.radius;
        this.size = 1.5 + Math.random() * 2;
        this.color = `hsl(${Math.random() * 60 + 330}, 100%, 75%)`;
    }

    update(progress) {
        this.angle += this.speed;
        const orbitX = rightX + Math.cos(this.angle) * (this.radius * (1 - progress * 0.5));
        const orbitY = rightY + Math.sin(this.angle) * (this.radius * (1 - progress * 0.5));

        this.x = orbitX * (1 - progress) + this.target.x * progress;
        this.y = orbitY * (1 - progress) + this.target.y * progress;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#ff66b2';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}

let lightParticles = [];

function setupLightParticles() {
    lightParticles = [];
    for (let i = 0; i < textTargets.length; i++) {
        lightParticles.push(new LightParticle(textTargets[i], i, textTargets.length));
    }
}

// --- Animation Control State ---
let heartProgress = 0;
let roseProgress = 0;
let textMorphProgress = 0;
let startTime = null;

// Sparkle mouse trail
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

    draw() {
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
            userParticles.push(new Sparkle(x, y));
        }
    }
}

window.addEventListener('mousemove', handlePointer);
window.addEventListener('touchmove', handlePointer);
window.addEventListener('click', handlePointer);

// Main render loop
function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // 1. Progress Heart (0.5 to 3 seconds)
    if (elapsed > 0.5) {
        heartProgress = Math.min(1, (elapsed - 0.5) / 2.5);
    }

    // 2. Progress Rose (2.5 to 6 seconds)
    if (elapsed > 2.5) {
        roseProgress = Math.min(1, (elapsed - 2.5) / 3.5);
    }

    // 3. Morph Lights into "For you" (4.5 to 8 seconds)
    if (elapsed > 4.5) {
        textMorphProgress = Math.min(1, (elapsed - 4.5) / 3.5);
    }

    // Draw Neon Heart
    if (heartProgress > 0) {
        ctx.save();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 20;
        ctx.beginPath();

        const steps = 300;
        const currentSteps = Math.floor(steps * heartProgress);
        for (let i = 0; i <= currentSteps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const pt = getHeartPoint(t);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        if (heartProgress < 1) {
            const tipT = (currentSteps / steps) * Math.PI * 2;
            const tip = getHeartPoint(tipT);
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ff6699';
            ctx.shadowBlur = 25;
            ctx.fill();
        }
        ctx.restore();
    }

    // Draw Neon Rose
    if (roseProgress > 0) {
        const rosePoints = getRosePoints();
        const drawCount = Math.floor(rosePoints.length * roseProgress);

        ctx.save();
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;

        for (let i = 0; i < drawCount; i++) {
            const pt = rosePoints[i];
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.type === 'petal' ? 1.8 : 1.4, 0, Math.PI * 2);
            if (pt.type === 'stem' || pt.type === 'leaf') {
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = '#00ff88';
            } else {
                ctx.fillStyle = '#ff1a53';
                ctx.shadowColor = '#ff0055';
            }
            ctx.fill();
        }
        ctx.restore();
    }

    // Draw Orbiting Lights & "For you" morphing
    for (let i = 0; i < lightParticles.length; i++) {
        lightParticles[i].update(textMorphProgress);
        lightParticles[i].draw();
    }

    // Draw user interactive sparkle trail
    for (let i = userParticles.length - 1; i >= 0; i--) {
        userParticles[i].update();
        userParticles[i].draw();
        if (userParticles[i].life <= 0) {
            userParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

// Initialize and start
resizeCanvas();
document.fonts.ready.then(() => {
    initTextTargets();
    setupLightParticles();
    requestAnimationFrame(animate);
});
