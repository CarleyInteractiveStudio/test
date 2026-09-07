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
    const numPetals = 320;
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

// Particle that morphs CONTINUOUSLY from Orbit -> "For you" -> "ANA" -> Disperse
class MorphParticle {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.size = Math.random() * 1.8 + 1.2;
        this.hue = Math.random() * 40 + 330; // Pink, rose-gold light
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 250 + 60;
        this.speed = Math.random() * 0.03 + 0.015;
        this.trail = [];
    }

    update(target1, target2, stage, progress) {
        // stage 0: orbit into target1 ("For you")
        // stage 1: hold target1 ("For you")
        // stage 2: morph directly from target1 ("For you") into target2 ("ANA")
        // stage 3: hold target2 ("ANA")
        // stage 4: disperse into starry space

        let currentX, currentY;

        if (stage === 0) {
            // Orbit -> For You
            this.angle += this.speed;
            const orbitX = rightX + Math.cos(this.angle) * this.radius;
            const orbitY = centerY + Math.sin(this.angle) * (this.radius * 0.6);
            currentX = orbitX * (1 - progress) + target1.x * progress;
            currentY = orbitY * (1 - progress) + target1.y * progress;
        } else if (stage === 1) {
            // Hold For You
            const shimmerX = Math.sin(Date.now() * 0.003 + this.angle) * 1.2;
            const shimmerY = Math.cos(Date.now() * 0.003 + this.angle) * 1.2;
            currentX = target1.x + shimmerX;
            currentY = target1.y + shimmerY;
        } else if (stage === 2) {
            // Morph directly For You -> ANA!
            const easeProg = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            currentX = target1.x * (1 - easeProg) + target2.x * easeProg;
            currentY = target1.y * (1 - easeProg) + target2.y * easeProg;
        } else if (stage === 3) {
            // Hold ANA
            const shimmerX = Math.sin(Date.now() * 0.004 + this.angle) * 1.5;
            const shimmerY = Math.cos(Date.now() * 0.004 + this.angle) * 1.5;
            currentX = target2.x + shimmerX;
            currentY = target2.y + shimmerY;
        } else {
            // Disperse
            this.angle += this.speed;
            const floatX = (Math.cos(this.angle) * 300) * progress;
            const floatY = (-progress * 250) + Math.sin(this.angle) * 50;
            currentX = target2.x + floatX;
            currentY = target2.y + floatY;
        }

        // Smooth velocity smoothing
        this.x += (currentX - this.x) * 0.25;
        this.y += (currentY - this.y) * 0.25;

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
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 75%, 0.45)`;
            ctx.lineWidth = this.size * 0.8;
            ctx.stroke();
        }

        // Glowing light point
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
    const rosePoints = getRosePoints();

    for (let i = 0; i < maxCount; i++) {
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

function createEarthTexture() {
    const eCanvas = document.createElement('canvas');
    eCanvas.width = 512;
    eCanvas.height = 256;
    const eCtx = eCanvas.getContext('2d');

    // Deep blue ocean gradient
    const oceanGrad = eCtx.createLinearGradient(0, 0, 0, 256);
    oceanGrad.addColorStop(0, '#0d2b45');
    oceanGrad.addColorStop(0.5, '#1b4965');
    oceanGrad.addColorStop(1, '#0d2b45');
    eCtx.fillStyle = oceanGrad;
    eCtx.fillRect(0, 0, 512, 256);

    // Green/brown continents
    eCtx.fillStyle = '#2d6a4f';
    for (let i = 0; i < 35; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 200 + 28;
        const rx = Math.random() * 60 + 20;
        const ry = Math.random() * 35 + 15;
        eCtx.beginPath();
        eCtx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        eCtx.fill();
    }

    // White cloud swirls
    eCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 25; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 256;
        eCtx.beginPath();
        eCtx.arc(cx, cy, Math.random() * 40 + 10, 0, Math.PI * 2);
        eCtx.fill();
    }

    return new THREE.CanvasTexture(eCanvas);
}

function createSunTexture() {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 512;
    sCanvas.height = 256;
    const sCtx = sCanvas.getContext('2d');

    const grad = sCtx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#ff4500');
    grad.addColorStop(0.3, '#ffaa00');
    grad.addColorStop(0.7, '#ffcc00');
    grad.addColorStop(1, '#ff3300');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 256);

    // Solar flares / noise spots
    sCtx.fillStyle = 'rgba(255, 255, 200, 0.3)';
    for (let i = 0; i < 80; i++) {
        sCtx.beginPath();
        sCtx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 20 + 5, 0, Math.PI * 2);
        sCtx.fill();
    }
    return new THREE.CanvasTexture(sCanvas);
}

function createJupiterTexture() {
    const jCanvas = document.createElement('canvas');
    jCanvas.width = 512;
    jCanvas.height = 256;
    const jCtx = jCanvas.getContext('2d');

    // Jupiter atmospheric bands
    const bandColors = ['#d4a373', '#e9d8a6', '#bc6c25', '#dda15e', '#a3b18a', '#d4a373'];
    for (let y = 0; y < 256; y += 8) {
        jCtx.fillStyle = bandColors[Math.floor((y / 256) * bandColors.length) % bandColors.length];
        jCtx.fillRect(0, y, 512, 8 + Math.sin(y * 0.1) * 3);
    }

    // Great Red Spot
    jCtx.fillStyle = '#b7094c';
    jCtx.beginPath();
    jCtx.ellipse(320, 160, 45, 25, 0, 0, Math.PI * 2);
    jCtx.fill();

    return new THREE.CanvasTexture(jCanvas);
}

function createAccretionDiskTexture() {
    const adCanvas = document.createElement('canvas');
    adCanvas.width = 512;
    adCanvas.height = 512;
    adCtx = adCanvas.getContext('2d');

    // Smooth volumetric accretion disk gradient (Interstellar style)
    const grad = adCtx.createRadialGradient(256, 256, 70, 256, 256, 256);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');  // Inner photon border (white hot)
    grad.addColorStop(0.1, 'rgba(255, 220, 150, 0.95)'); // Gold inner swirl
    grad.addColorStop(0.35, 'rgba(255, 80, 140, 0.85)'); // Hot pink plasma
    grad.addColorStop(0.7, 'rgba(180, 20, 100, 0.4)');   // Deep violet outer stream
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');          // Smooth fade out

    adCtx.fillStyle = grad;
    adCtx.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(adCanvas);
}

// ==========================================
// 3D THREE.JS SPACE ENGINE (Solar System, Realistic Black Hole, Galaxy, Infinity)
// ==========================================

let scene, camera, renderer;
let sunMesh, earthMesh, moonMesh, planets = [];
let blackHoleGroup, accretionDiskMesh, gravitationalLensingMesh;
let galaxyParticles, galaxyGeometry;
let particleTexture;

function init3D() {
    const container = document.getElementById('canvas3d-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0006);

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 30, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    particleTexture = createParticleTexture();

    // Ambient & Directional Bright Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfffaed, 4.0, 2000);
    scene.add(sunLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(100, 150, 100);
    scene.add(dirLight1);

    // Starfield background
    createStarfield();

    // Solar System
    createSolarSystem(sunLight);

    // Realistic Cinematic Black Hole (Gargantua Style)
    createCinematicBlackHole();

    // Galaxy & Infinity
    createGalaxyAndInfinity();
}

function createStarfield() {
    const starsGeo = new THREE.BufferGeometry();
    const count = 3500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 1600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.8,
        map: particleTexture,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
    });
    const starfield = new THREE.Points(starsGeo, starsMat);
    scene.add(starfield);
}

function createSolarSystem(sunLight) {
    const sunTex = createSunTexture();
    const earthTex = createEarthTexture();
    const jupiterTex = createJupiterTexture();

    // Sun
    const sunGeo = new THREE.SphereGeometry(16, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Sun Glow
    const glowGeo = new THREE.SphereGeometry(19, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.45,
        side: THREE.BackSide
    });
    sunMesh.add(new THREE.Mesh(glowGeo, glowMat));

    // Earth
    const earthGeo = new THREE.SphereGeometry(5.0, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.4,
        metalness: 0.1
    });
    earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(70, 0, 0);
    scene.add(earthMesh);

    // Atmosphere Glow
    const earthAtmoGeo = new THREE.SphereGeometry(5.4, 32, 32);
    const earthAtmoMat = new THREE.MeshBasicMaterial({
        color: 0x44c2ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    earthMesh.add(new THREE.Mesh(earthAtmoGeo, earthAtmoMat));

    // Moon
    const moonGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(12, 0, 0);
    earthMesh.add(moonMesh);

    // Other Planets (Mercury, Venus, Mars, Jupiter, Saturn)
    const planetData = [
        { r: 2.8, dist: 35, color: 0xaaaaaa, speed: 0.025 },
        { r: 4.2, dist: 50, color: 0xe3bb76, speed: 0.018 },
        { r: 3.5, dist: 95, color: 0xc1440e, speed: 0.012 },
        { r: 10.0, dist: 135, tex: jupiterTex, speed: 0.007 },
        { r: 8.0, dist: 180, color: 0xe2bf7d, speed: 0.005, ring: true }
    ];

    planetData.forEach(data => {
        const pGeo = new THREE.SphereGeometry(data.r, 24, 24);
        const pMat = data.tex
            ? new THREE.MeshStandardMaterial({ map: data.tex, roughness: 0.5 })
            : new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.5 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        const pivot = new THREE.Group();
        scene.add(pivot);
        pivot.add(pMesh);
        pMesh.position.set(data.dist, 0, 0);

        if (data.ring) {
            const ringGeo = new THREE.RingGeometry(data.r + 3, data.r + 10, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4b27d, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            pMesh.add(ring);
        }

        planets.push({ mesh: pMesh, pivot, speed: data.speed });
    });
}

function createCinematicBlackHole() {
    blackHoleGroup = new THREE.Group();
    blackHoleGroup.position.set(0, -500, 0); // Hide initially

    // 1. Pure Pitch-Black Event Horizon (Core)
    const coreGeo = new THREE.SphereGeometry(14, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    blackHoleGroup.add(core);

    // 2. Ultra Bright Photon Ring (Edge of Event Horizon)
    const photonRingGeo = new THREE.RingGeometry(14.05, 15.5, 64);
    const photonRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0
    });
    const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    blackHoleGroup.add(photonRing);

    // 3. Smooth Volumetric Horizontal Accretion Disk
    const diskTex = createAccretionDiskTexture();
    const diskGeo = new THREE.PlaneGeometry(85, 85);
    const diskMat = new THREE.MeshBasicMaterial({
        map: diskTex,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    accretionDiskMesh = new THREE.Mesh(diskGeo, diskMat);
    accretionDiskMesh.rotation.x = Math.PI / 2.3;
    blackHoleGroup.add(accretionDiskMesh);

    // 4. Vertical Gravitational Lensing Halo (Interstellar Curved Light Arc)
    const lensingGeo = new THREE.PlaneGeometry(75, 75);
    const lensingMat = new THREE.MeshBasicMaterial({
        map: diskTex,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    gravitationalLensingMesh = new THREE.Mesh(lensingGeo, lensingMat);
    gravitationalLensingMesh.rotation.y = Math.PI / 6;
    blackHoleGroup.add(gravitationalLensingMesh);

    // 5. Ambient Photonic Plasma Dust Stream
    const count = 4000;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const radius = 15 + Math.random() * 32;
        const angle = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
        pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({
        color: 0xffaae5,
        size: 2.0,
        map: particleTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    blackHoleGroup.add(dustParticles);

    scene.add(blackHoleGroup);
}

function createGalaxyAndInfinity() {
    const count = 7000;
    galaxyGeometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // 3D Spiral Galaxy points
    for (let i = 0; i < count; i++) {
        const arm = i % 2;
        const radius = Math.random() * 130;
        const spin = radius * 0.04;
        const angle = (arm * Math.PI) + spin + (Math.random() - 0.5) * 0.35;

        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * (18 - radius * 0.1);
        pos[i * 3 + 2] = Math.sin(angle) * radius;

        const c = new THREE.Color();
        c.setHSL(0.85 + Math.random() * 0.2, 0.95, 0.65);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 2.8,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    galaxyParticles = new THREE.Points(galaxyGeometry, mat);
    galaxyParticles.position.set(0, -1000, 0); // Hide initially
    scene.add(galaxyParticles);

    // Precalculate 3D Infinity curve positions
    const infinityPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const scale = 55;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
        const z = (Math.random() - 0.5) * 10;

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

    // 3. CONTINUOUS particle flow: Orbit -> "For you" -> "ANA" -> Disperse (6.5s - 15.5s)
    if (elapsed > 6.5 && elapsed <= 15.5) {
        if (morphParticles.length === 0) setupMorphParticles();

        let stage = 0;
        let progress = 0;

        if (elapsed <= 8.5) {
            // Stage 0: Orbit into "For you"
            stage = 0;
            progress = Math.min(1, (elapsed - 6.5) / 2.0);
        } else if (elapsed <= 10.5) {
            // Stage 1: Hold "For you"
            stage = 1;
            progress = 1.0;
        } else if (elapsed <= 12.8) {
            // Stage 2: Morph DIRECTLY from "For you" to "ANA"
            stage = 2;
            progress = Math.min(1, (elapsed - 10.5) / 2.3);
        } else if (elapsed <= 14.5) {
            // Stage 3: Hold "ANA"
            stage = 3;
            progress = 1.0;
        } else {
            // Stage 4: Gently disperse into starry space
            stage = 4;
            progress = Math.min(1, (elapsed - 14.5) / 1.0);
        }

        const overallFade = elapsed > 14.8 ? Math.max(0, 1 - (elapsed - 14.8) / 0.7) : 1;

        ctx2d.save();
        ctx2d.globalAlpha = overallFade;
        const maxTargets = Math.max(forYouTargets.length, anaTargets.length);
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

    // --- 3D SPACE STAGE (15.5s onwards) ---
    if (elapsed > 15.5) {
        if (!scene) init3D();

        // 3D Scene Timings:
        // 15.5s - 20.5s: Earth ("Mi amor por ti es más grande que esto")
        if (elapsed > 15.5 && elapsed <= 20.5) {
            setCaption("Mi amor por ti es más grande que esto");

            earthMesh.rotation.y += 0.012;
            earthMesh.position.x = Math.cos(elapsed * 0.2) * 65;
            earthMesh.position.z = Math.sin(elapsed * 0.2) * 65;

            // Camera stays close and dramatic on Earth so it's large & detailed
            const targetCamPos = new THREE.Vector3(
                earthMesh.position.x + 14,
                earthMesh.position.y + 6,
                earthMesh.position.z + 20
            );
            camera.position.lerp(targetCamPos, 0.06);
            camera.lookAt(earthMesh.position);
        }

        // 20.5s - 25.5s: Sun ("Mi amor por ti es más grande que esta estrella")
        else if (elapsed > 20.5 && elapsed <= 25.5) {
            setCaption("Mi amor por ti es más grande que esta estrella");

            sunMesh.rotation.y += 0.006;
            const targetCamPos = new THREE.Vector3(0, 12, 40);
            camera.position.lerp(targetCamPos, 0.06);
            camera.lookAt(sunMesh.position);
        }

        // 25.5s - 31.0s: Solar System Overview ("Esto no es ni siquiera el 1% de mi amor para ti mi querida")
        else if (elapsed > 25.5 && elapsed <= 31.0) {
            setCaption("Esto no es ni siquiera el 1% de mi amor para ti mi querida");

            planets.forEach(p => { p.pivot.rotation.y += p.speed; });

            // Camera stays moderately close so planets are clearly visible and NOT tiny dots!
            const targetCamPos = new THREE.Vector3(0, 90, 150);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 0);
        }

        // 31.0s - 37.0s: Cinematic Gargantua-Style Black Hole
        else if (elapsed > 31.0 && elapsed <= 37.0) {
            setCaption("Mi amor por ti supera a un agujero negro y es capaz de entrar y volver de él por ti");

            blackHoleGroup.position.set(0, 0, 0);
            accretionDiskMesh.rotation.z += 0.01;
            gravitationalLensingMesh.rotation.z -= 0.008;

            const targetCamPos = new THREE.Vector3(0, 10, 60);
            camera.position.lerp(targetCamPos, 0.06);
            camera.lookAt(blackHoleGroup.position);
        }

        // 37.0s - 43.0s: Galaxy ("Mi amor por ti no tiene límite...")
        else if (elapsed > 37.0 && elapsed <= 43.0) {
            setCaption("Mi amor por ti no tiene límite, por más que tratara de mostrarte el universo no podría ni siquiera mostrarte el 1% de mi amor por vos por que es...");

            blackHoleGroup.position.set(0, -1000, 0);
            galaxyParticles.position.set(0, 0, 0);
            galaxyParticles.material.opacity = Math.min(1, (elapsed - 37.0) / 2.0);
            galaxyParticles.rotation.y += 0.003;

            const targetCamPos = new THREE.Vector3(0, 130, 170);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 0);
        }

        // 43.0s onwards: Infinity Symbol ("Porque nuestro amor es infinito ❤️")
        else if (elapsed > 43.0) {
            setCaption("Porque nuestro amor es infinito ❤️");

            galaxyParticles.rotation.y += 0.001;

            const positions = galaxyGeometry.attributes.position.array;
            const targetInfinity = galaxyGeometry.attributes.infinityPosition.array;

            const morphFactor = Math.min(1, (elapsed - 43.0) / 3.5);
            for (let i = 0; i < positions.length; i++) {
                positions[i] = positions[i] * (1 - morphFactor * 0.02) + targetInfinity[i] * (morphFactor * 0.02);
            }
            galaxyGeometry.attributes.position.needsUpdate = true;

            const targetCamPos = new THREE.Vector3(0, 0, 115);
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
