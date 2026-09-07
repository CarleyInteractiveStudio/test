// --- Setup 2D Canvas & 3D Three.js Engine ---
const canvas2d = document.getElementById('canvas2d');
const ctx2d = canvas2d.getContext('2d');

const captionContainer = document.getElementById('caption-container');
const captionText = document.getElementById('caption-text');

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
            }, 600);
        }
    }
}

// ==========================================
// 2D CANVAS ANIMATIONS (Heart -> Rose -> For you -> ANA)
// ==========================================

// Parametric Heart
function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return {
        x: centerX + x * heartScale,
        y: centerY + y * heartScale - 20
    };
}

// Parametric Rose
function getRosePoints() {
    const points = [];
    const roseCenterX = centerX;
    const roseCenterY = centerY;

    // Stem
    for (let t = 0; t <= 1; t += 0.02) {
        const sy = roseCenterY + 10 + t * 100;
        const sx = roseCenterX + Math.sin(t * Math.PI * 2) * 6;
        points.push({ x: sx, y: sy, type: 'stem' });
    }

    // Leaves
    for (let t = 0; t <= Math.PI * 2; t += 0.15) {
        let lx = roseCenterX - 12 - Math.sin(t) * 20;
        let ly = roseCenterY + 55 - Math.cos(t) * 8;
        points.push({ x: lx, y: ly, type: 'leaf' });

        let rx = roseCenterX + 12 + Math.sin(t) * 20;
        let ry = roseCenterY + 40 - Math.cos(t) * 8;
        points.push({ x: rx, y: ry, type: 'leaf' });
    }

    // Rose Petals
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

// Text Particle Sampling ("For you" & "ANA")
let forYouTargets = [];
let anaTargets = [];

function sampleTextTargets(text, fontSize) {
    const targets = [];
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 800;
    offCanvas.height = 300;
    const offCtx = offCanvas.getContext('2d');

    offCtx.font = `bold ${fontSize}px 'Great Vibes', cursive, sans-serif`;
    offCtx.fillStyle = '#ffffff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    const step = width < 800 ? 5 : 6;
    for (let y = 0; y < offCanvas.height; y += step) {
        for (let x = 0; x < offCanvas.width; x += step) {
            const index = (y * offCanvas.width + x) * 4;
            if (data[index + 3] > 140) {
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
    forYouTargets = sampleTextTargets('For you', width < 800 ? 80 : 110);
    anaTargets = sampleTextTargets('ANA', width < 800 ? 110 : 150);
}

// Light Particle forming light beams & glowing text
class MorphParticle {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.size = Math.random() * 1.5 + 1.0;
        this.hue = Math.random() * 50 + 325; // Pink, gold, cyan light streaks
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 200 + 50;
        this.speed = Math.random() * 0.04 + 0.02;
        this.trail = [];
    }

    update(target, morphProgress) {
        this.angle += this.speed;
        const orbitX = rightX + Math.cos(this.angle) * this.radius;
        const orbitY = centerY + Math.sin(this.angle) * (this.radius * 0.6);

        if (target) {
            this.x = orbitX * (1 - morphProgress) + target.x * morphProgress;
            this.y = orbitY * (1 - morphProgress) + target.y * morphProgress;
        } else {
            this.x = orbitX;
            this.y = orbitY;
        }

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 3) this.trail.shift();
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Light beam streak
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 70%, 0.5)`;
            ctx.lineWidth = this.size;
            ctx.stroke();
        }

        // Glowing light point
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 75%, 0.9)`;
        ctx.fill();

        ctx.restore();
    }
}

let morphParticles = [];

function setupMorphParticles(targetCount) {
    morphParticles = [];
    const rosePoints = getRosePoints();
    for (let i = 0; i < targetCount; i++) {
        const src = rosePoints[i % rosePoints.length];
        morphParticles.push(new MorphParticle(src.x, src.y));
    }
}

// Sparkle mouse trail
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
// 3D THREE.JS SPACE ENGINE (Solar System, Black Hole, Galaxy, Infinity)
// ==========================================

let scene, camera, renderer;
let sunMesh, earthMesh, moonMesh, planets = [];
let blackHoleGroup, accretionDisk, blackHoleCore;
let galaxyParticles, galaxyGeometry;
let infinityParticles, infinityGeometry;

let spacePhase = 0; // 0: Solar System Earth, 1: Sun, 2: Solar System Overview, 3: Black Hole, 4: Galaxy, 5: Infinity

function init3D() {
    const container = document.getElementById('canvas3d-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 30, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Bright Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 3.5, 1500);
    scene.add(sunLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(50, 100, 80);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff88aa, 1.0);
    dirLight2.position.set(-50, -50, -50);
    scene.add(dirLight2);

    // Starfield background
    createStarfield();

    // Solar System
    createSolarSystem(sunLight);

    // Black Hole
    createBlackHole();

    // Galaxy & Infinity
    createGalaxyAndInfinity();
}

function createStarfield() {
    const starsGeo = new THREE.BufferGeometry();
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 1500;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.8 });
    const starfield = new THREE.Points(starsGeo, starsMat);
    scene.add(starfield);
}

function createSolarSystem(sunLight) {
    // Sun
    const sunGeo = new THREE.SphereGeometry(12, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        emissive: 0xff6600
    });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Sun Glow atmosphere
    const glowGeo = new THREE.SphereGeometry(14, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.35,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(glowGeo, glowMat);
    sunMesh.add(sunGlow);

    // Earth
    const earthGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
        color: 0x1d70b8,
        emissive: 0x0a2540,
        roughness: 0.3,
        metalness: 0.1
    });
    earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(55, 0, 0);
    scene.add(earthMesh);

    // Earth Atmosphere
    const earthAtmoGeo = new THREE.SphereGeometry(3.9, 32, 32);
    const earthAtmoMat = new THREE.MeshBasicMaterial({
        color: 0x33bbff,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide
    });
    earthMesh.add(new THREE.Mesh(earthAtmoGeo, earthAtmoMat));

    // Moon
    const moonGeo = new THREE.SphereGeometry(1, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(8, 0, 0);
    earthMesh.add(moonMesh);

    // Other Planets (Mercury, Venus, Mars, Jupiter, Saturn)
    const planetData = [
        { r: 2, dist: 25, color: 0xaaaaaa, speed: 0.03 },
        { r: 3, dist: 38, color: 0xe3bb76, speed: 0.02 },
        { r: 2.5, dist: 75, color: 0xc1440e, speed: 0.015 },
        { r: 7, dist: 110, color: 0xb07f35, speed: 0.008 },
        { r: 5.5, dist: 150, color: 0xe2bf7d, speed: 0.005, ring: true }
    ];

    planetData.forEach(data => {
        const pGeo = new THREE.SphereGeometry(data.r, 24, 24);
        const pMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.4 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        const pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(pMesh);
        pMesh.position.set(data.dist, 0, 0);

        if (data.ring) {
            const ringGeo = new THREE.RingGeometry(data.r + 2, data.r + 6, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xaaffbb, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            pMesh.add(ring);
        }

        planets.push({ mesh: pMesh, pivot, speed: data.speed });
    });
}

function createBlackHole() {
    blackHoleGroup = new THREE.Group();
    blackHoleGroup.position.set(0, -500, 0); // Hide initially

    // Dark Event Horizon Core
    const coreGeo = new THREE.SphereGeometry(12, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    blackHoleCore = new THREE.Mesh(coreGeo, coreMat);
    blackHoleGroup.add(blackHoleCore);

    // Ultra Bright Gravitational Photon Ring
    const ringGeo = new THREE.RingGeometry(12.1, 15, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfff0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0
    });
    const photonRing = new THREE.Mesh(ringGeo, ringMat);
    photonRing.rotation.x = Math.PI / 3;
    blackHoleGroup.add(photonRing);

    // Outer Photon Glow Aura
    const auraGeo = new THREE.RingGeometry(15, 22, 64);
    const auraMat = new THREE.MeshBasicMaterial({
        color: 0xff3399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const auraRing = new THREE.Mesh(auraGeo, auraMat);
    auraRing.rotation.x = Math.PI / 3;
    blackHoleGroup.add(auraRing);

    // Swirling Gravitational Accretion Disk Particles
    const particleCount = 5000;
    const diskGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const radius = 14 + Math.random() * 40;
        const angle = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
        pos[i * 3 + 2] = Math.sin(angle) * radius;

        // Bright gold, fiery orange to luminous pink gradient
        const c = new THREE.Color();
        c.setHSL(0.85 + Math.random() * 0.25, 1.0, 0.6 + Math.random() * 0.3);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    diskGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    diskGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const diskMat = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });

    accretionDisk = new THREE.Points(diskGeo, diskMat);
    accretionDisk.rotation.x = Math.PI / 3;
    blackHoleGroup.add(accretionDisk);

    scene.add(blackHoleGroup);
}

function createGalaxyAndInfinity() {
    const count = 6000;
    galaxyGeometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // 3D Spiral Galaxy points
    for (let i = 0; i < count; i++) {
        const arm = i % 3;
        const radius = Math.random() * 120;
        const spin = radius * 0.05;
        const angle = (arm * 2 * Math.PI / 3) + spin + (Math.random() - 0.5) * 0.4;

        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * (15 - radius * 0.08);
        pos[i * 3 + 2] = Math.sin(angle) * radius;

        const c = new THREE.Color();
        c.setHSL(0.85 + Math.random() * 0.2, 0.9, 0.6);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 3.2,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });

    galaxyParticles = new THREE.Points(galaxyGeometry, mat);
    galaxyParticles.position.set(0, -1000, 0); // Hide initially
    scene.add(galaxyParticles);

    // Precalculate 3D Infinity curve positions for transition
    const infinityPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const scale = 50;
        // Lemniscate of Bernoulli / Infinity symbol in 3D
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
        const z = (Math.random() - 0.5) * 8;

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

function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000; // time in seconds

    // Clear 2D canvas appropriately
    if (elapsed > 15.5) {
        ctx2d.clearRect(0, 0, width, height);
    } else {
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx2d.fillRect(0, 0, width, height);
    }

    // 1. Heart (0.5s - 3.5s)
    if (elapsed > 0.5 && elapsed <= 3.5) {
        const hProg = Math.min(1, (elapsed - 0.5) / 2.0);
        const hFade = elapsed > 2.8 ? Math.max(0, 1 - (elapsed - 2.8) / 0.7) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = hFade;
        ctx2d.lineWidth = 3.5;
        ctx2d.strokeStyle = '#ff0055';
        ctx2d.shadowColor = '#ff0055';
        ctx2d.shadowBlur = 20;
        ctx2d.beginPath();

        const steps = 300;
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

    // 2. Rose (3.5s - 6.5s)
    if (elapsed > 3.5 && elapsed <= 6.5) {
        const rProg = Math.min(1, (elapsed - 3.5) / 2.2);
        const rFade = elapsed > 5.8 ? Math.max(0, 1 - (elapsed - 5.8) / 0.7) : 1;
        const rosePoints = getRosePoints();
        const drawCount = Math.floor(rosePoints.length * rProg);

        ctx2d.save();
        ctx2d.globalAlpha = rFade;
        ctx2d.shadowBlur = 15;
        for (let i = 0; i < drawCount; i++) {
            const pt = rosePoints[i];
            ctx2d.beginPath();
            ctx2d.arc(pt.x, pt.y, pt.type === 'petal' ? 1.8 : 1.4, 0, Math.PI * 2);
            if (pt.type === 'stem' || pt.type === 'leaf') {
                ctx2d.fillStyle = '#00ff88';
                ctx2d.shadowColor = '#00ff88';
            } else {
                ctx2d.fillStyle = '#ff1a53';
                ctx2d.shadowColor = '#ff0055';
            }
            ctx2d.fill();
        }
        ctx2d.restore();
    }

    // 3. Orbiting lights morphing to "For you" (6.5s - 11.0s)
    if (elapsed > 6.5 && elapsed <= 11.0) {
        if (morphParticles.length === 0) setupMorphParticles(forYouTargets.length);

        const mProg = Math.min(1, Math.max(0, (elapsed - 7.0) / 2.5));
        const mFade = elapsed > 10.0 ? Math.max(0, 1 - (elapsed - 10.0) / 1.0) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = mFade;
        for (let i = 0; i < morphParticles.length; i++) {
            const target = forYouTargets[i % forYouTargets.length];
            morphParticles[i].update(target, mProg);
            morphParticles[i].draw(ctx2d);
        }
        ctx2d.restore();
    }

    // 4. "ANA" Morphing (11.0s - 15.5s)
    if (elapsed > 11.0 && elapsed <= 15.5) {
        const mProg = Math.min(1, Math.max(0, (elapsed - 11.5) / 2.5));
        const mFade = elapsed > 14.5 ? Math.max(0, 1 - (elapsed - 14.5) / 1.0) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = mFade;
        for (let i = 0; i < morphParticles.length; i++) {
            const target = anaTargets[i % anaTargets.length];
            morphParticles[i].update(target, mProg);
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

    // --- 3D SPACE STAGE (15.5s onwards) ---
    if (elapsed > 15.5) {
        if (!scene) init3D();

        // 3D Scene Timings:
        // 15.5s - 20.5s: Earth ("Mi amor por ti es más grande que esto")
        if (elapsed > 15.5 && elapsed <= 20.5) {
            setCaption("Mi amor por ti es más grande que esto");

            // Orbit Earth & Moon
            earthMesh.rotation.y += 0.01;
            earthMesh.position.x = Math.cos(elapsed * 0.2) * 55;
            earthMesh.position.z = Math.sin(elapsed * 0.2) * 55;

            // Camera focuses on Earth
            const targetCamPos = new THREE.Vector3(
                earthMesh.position.x + 12,
                earthMesh.position.y + 5,
                earthMesh.position.z + 18
            );
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(earthMesh.position);
        }

        // 20.5s - 25.5s: Sun ("Mi amor por ti es más grande que esta estrella")
        else if (elapsed > 20.5 && elapsed <= 25.5) {
            setCaption("Mi amor por ti es más grande que esta estrella");

            sunMesh.rotation.y += 0.005;
            const targetCamPos = new THREE.Vector3(0, 10, 32);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(sunMesh.position);
        }

        // 25.5s - 31.0s: Full Solar System ("Esto no es ni siquiera el 1% de mi amor para ti mi querida")
        else if (elapsed > 25.5 && elapsed <= 31.0) {
            setCaption("Esto no es ni siquiera el 1% de mi amor para ti mi querida");

            // Orbit all planets
            planets.forEach(p => { p.pivot.rotation.y += p.speed; });

            const targetCamPos = new THREE.Vector3(0, 120, 220);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, 0);
        }

        // 31.0s - 37.0s: Superrealistic Black Hole ("Mi amor por ti supera a un agujero negro y es capaz de entrar y volver de él por ti")
        else if (elapsed > 31.0 && elapsed <= 37.0) {
            setCaption("Mi amor por ti supera a un agujero negro y es capaz de entrar y volver de él por ti");

            blackHoleGroup.position.set(0, 0, 0);
            accretionDisk.rotation.z += 0.02;

            const targetCamPos = new THREE.Vector3(0, 15, 60);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(blackHoleGroup.position);
        }

        // 37.0s - 43.0s: Galaxy ("Mi amor por ti no tiene límite, por más que tratara de mostrarte el universo no podría ni siquiera mostrarte el 1% de mi amor por vos...")
        else if (elapsed > 37.0 && elapsed <= 43.0) {
            setCaption("Mi amor por ti no tiene límite, por más que tratara de mostrarte el universo no podría ni siquiera mostrarte el 1% de mi amor por vos por que es...");

            blackHoleGroup.position.set(0, -1000, 0);
            galaxyParticles.position.set(0, 0, 0);
            galaxyParticles.material.opacity = Math.min(1, (elapsed - 37.0) / 2.0);
            galaxyParticles.rotation.y += 0.003;

            const targetCamPos = new THREE.Vector3(0, 140, 180);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, 0);
        }

        // 43.0s onwards: Infinity Symbol ("Porque nuestro amor es infinito ❤️")
        else if (elapsed > 43.0) {
            setCaption("Porque nuestro amor es infinito ❤️");

            galaxyParticles.rotation.y += 0.001;

            // Morph galaxy particles into Infinity 3D curve
            const positions = galaxyGeometry.attributes.position.array;
            const targetInfinity = galaxyGeometry.attributes.infinityPosition.array;

            const morphFactor = Math.min(1, (elapsed - 43.0) / 3.5);
            for (let i = 0; i < positions.length; i++) {
                positions[i] = positions[i] * (1 - morphFactor * 0.02) + targetInfinity[i] * (morphFactor * 0.02);
            }
            galaxyGeometry.attributes.position.needsUpdate = true;

            const targetCamPos = new THREE.Vector3(0, 0, 110);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 0);
        }

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
}

// Launch
resizeAll();
document.fonts.ready.then(() => {
    initTextTargets();
    requestAnimationFrame(animate);
});
