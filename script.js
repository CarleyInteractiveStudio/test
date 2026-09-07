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
            }, 500);
        }
    }
}

// ==========================================
// 2D CANVAS ANIMATIONS (Heart -> Rose -> For you -> ANA)
// ==========================================

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
    const roseCenterY = centerY;

    for (let t = 0; t <= 1; t += 0.02) {
        const sy = roseCenterY + 10 + t * 100;
        const sx = roseCenterX + Math.sin(t * Math.PI * 2) * 6;
        points.push({ x: sx, y: sy, type: 'stem' });
    }

    for (let t = 0; t <= Math.PI * 2; t += 0.15) {
        let lx = roseCenterX - 12 - Math.sin(t) * 20;
        let ly = roseCenterY + 55 - Math.cos(t) * 8;
        points.push({ x: lx, y: ly, type: 'leaf' });

        let rx = roseCenterX + 12 + Math.sin(t) * 20;
        let ry = roseCenterY + 40 - Math.cos(t) * 8;
        points.push({ x: rx, y: ry, type: 'leaf' });
    }

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
    const rosePoints = getRosePoints();

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

function createAccretionDiskTexture() {
    const adCanvas = document.createElement('canvas');
    adCanvas.width = 512;
    adCanvas.height = 512;
    const adCtx = adCanvas.getContext('2d');

    const grad = adCtx.createRadialGradient(256, 256, 70, 256, 256, 256);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.1, 'rgba(255, 220, 150, 0.95)');
    grad.addColorStop(0.35, 'rgba(255, 80, 140, 0.85)');
    grad.addColorStop(0.7, 'rgba(180, 20, 100, 0.4)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    adCtx.fillStyle = grad;
    adCtx.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(adCanvas);
}

// ==========================================
// 3D THREE.JS SPACE ENGINE (Solar System, Warp Flight, Black Hole, Galaxy, Infinity)
// ==========================================

let scene, camera, renderer;
let sunMesh, earthMesh, moonMesh;
let solarSystemGroup;
let planetsList = [];

let blackHoleGroup, accretionDiskMesh, gravitationalLensingMesh;
let warpLinesGroup, warpLines = [];
let galaxyParticles, galaxyGeometry;
let particleTexture;

const texLoader = new THREE.TextureLoader();

function loadTextureSafe(url) {
    return texLoader.load(url, undefined, undefined, () => {
        console.warn('Fallback texture for', url);
    });
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
    // Textures downloaded in textures/
    const sunTex = loadTextureSafe('textures/sun.jpg');
    const mercuryTex = loadTextureSafe('textures/mercury.jpg');
    const venusTex = loadTextureSafe('textures/venus.jpg');
    const earthTex = loadTextureSafe('textures/earth.jpg');
    const earthNormal = loadTextureSafe('textures/earth_normal.jpg');
    const earthSpec = loadTextureSafe('textures/earth_specular.jpg');
    const moonTex = loadTextureSafe('textures/moon.jpg');
    const marsTex = loadTextureSafe('textures/mars.jpg');
    const jupiterTex = loadTextureSafe('textures/jupiter.jpg');
    const saturnTex = loadTextureSafe('textures/saturn.jpg');
    const uranusTex = loadTextureSafe('textures/uranus.jpg');
    const neptuneTex = loadTextureSafe('textures/neptune.jpg');

    // Sun
    const sunGeo = new THREE.SphereGeometry(18, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    solarSystemGroup.add(sunMesh);

    // Sun Glow
    const glowGeo = new THREE.SphereGeometry(21, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.45,
        side: THREE.BackSide
    });
    sunMesh.add(new THREE.Mesh(glowGeo, glowMat));

    // Planet Definitions with realistic textures and continuous orbit speeds
    const pData = [
        { name: 'Mercury', r: 2.5, dist: 35, tex: mercuryTex, speed: 0.022, angle: Math.random() * Math.PI * 2 },
        { name: 'Venus', r: 4.2, dist: 52, tex: venusTex, speed: 0.016, angle: Math.random() * Math.PI * 2 },
        {
            name: 'Earth', r: 5.2, dist: 78, tex: earthTex, normalMap: earthNormal, specMap: earthSpec,
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
        let pMat;

        if (data.isEarth) {
            pMat = new THREE.MeshStandardMaterial({
                map: data.tex,
                normalMap: data.normalMap,
                roughnessMap: data.specMap,
                roughness: 0.5,
                metalness: 0.1
            });
        } else {
            pMat = new THREE.MeshStandardMaterial({
                map: data.tex,
                roughness: 0.6,
                metalness: 0.1
            });
        }

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

            // Atmosphere Glow
            const atmoGeo = new THREE.SphereGeometry(data.r * 1.08, 32, 32);
            const atmoMat = new THREE.MeshBasicMaterial({
                color: 0x33b5ff,
                transparent: true,
                opacity: 0.35,
                side: THREE.BackSide
            });
            earthMesh.add(new THREE.Mesh(atmoGeo, atmoMat));

            // Moon
            const moonGeo = new THREE.SphereGeometry(1.4, 20, 20);
            const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.8 });
            moonMesh = new THREE.Mesh(moonGeo, moonMat);
            moonMesh.position.set(12, 0, 0);
            earthMesh.add(moonMesh);
        }

        if (data.ring) {
            const ringGeo = new THREE.RingGeometry(data.r + 3, data.r + 12, 64);
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0xd4b27d,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
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

    // 2. Ultra Bright Photon Ring
    const photonRingGeo = new THREE.RingGeometry(16.1, 18.0, 64);
    const photonRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0
    });
    const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    blackHoleGroup.add(photonRing);

    // 3. Volumetric Accretion Disk
    const diskTex = createAccretionDiskTexture();
    const diskGeo = new THREE.PlaneGeometry(110, 110);
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

    // 4. Vertical Gravitational Lensing Halo Arc
    const lensingGeo = new THREE.PlaneGeometry(95, 95);
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

    // 5. Plasma Dust Stream
    const count = 5000;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const radius = 18 + Math.random() * 45;
        const angle = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
        pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({
        color: 0xffaae5,
        size: 2.2,
        map: particleTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    blackHoleGroup.add(dustParticles);

    scene.add(blackHoleGroup);
}

function createGalaxyAndInfinity() {
    const count = 8000;
    galaxyGeometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const arm = i % 2;
        const radius = Math.random() * 140;
        const spin = radius * 0.04;
        const angle = (arm * Math.PI) + spin + (Math.random() - 0.5) * 0.35;

        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * (20 - radius * 0.1);
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
    galaxyParticles.position.set(0, 0, -1800);
    scene.add(galaxyParticles);

    const infinityPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const scale = 60;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
        const z = (Math.random() - 0.5) * 12;

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
    const elapsed = (timestamp - startTime) / 1000;

    // Clear 2D canvas appropriately
    if (elapsed > 16.0) {
        ctx2d.clearRect(0, 0, width, height);
    } else {
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx2d.fillRect(0, 0, width, height);
    }

    // 1. Heart (0.5s - 4.0s)
    if (elapsed > 0.5 && elapsed <= 4.0) {
        const hProg = Math.min(1, (elapsed - 0.5) / 2.5);
        const hFade = elapsed > 3.2 ? Math.max(0, 1 - (elapsed - 3.2) / 0.8) : 1;

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

    // 2. Rose (4.0s - 7.5s)
    if (elapsed > 4.0 && elapsed <= 7.5) {
        const rProg = Math.min(1, (elapsed - 4.0) / 2.5);
        const rFade = elapsed > 6.7 ? Math.max(0, 1 - (elapsed - 6.7) / 0.8) : 1;
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

    // 3. CONTINUOUS particle flow: Orbit -> "For you" -> "ANA" -> Disperse (7.5s - 16.0s)
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

        // ALWAYS update planet orbits around the Sun from the very start
        planetsList.forEach(p => {
            p.angle += p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.dist;
            p.mesh.position.z = Math.sin(p.angle) * p.dist;
            p.mesh.rotation.y += 0.015;
        });

        if (sunMesh) sunMesh.rotation.y += 0.005;

        // Stage 1: Zoom in on Earth (16.0s - 23.0s)
        if (elapsed > 16.0 && elapsed <= 23.0) {
            setCaption("Mi amor por ti es más grande que esto");

            if (earthMesh) {
                // Camera smoothly follows Earth as it orbits the Sun
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

        // Stage 2: Zoom to the Sun (23.0s - 29.0s)
        else if (elapsed > 23.0 && elapsed <= 29.0) {
            setCaption("Mi amor por ti es más grande que esta estrella");

            const targetCamPos = new THREE.Vector3(0, 15, 45);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, 0);
        }

        // Stage 3: Full Solar System Overview (29.0s - 36.0s)
        else if (elapsed > 29.0 && elapsed <= 36.0) {
            setCaption("Esto no es ni siquiera el 1% de mi amor para ti mi querida");

            const targetCamPos = new THREE.Vector3(0, 160, 260);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, 0);
        }

        // Stage 4: Turn Camera into Deep Space & Warp Speed Travel (36.0s - 42.0s)
        else if (elapsed > 36.0 && elapsed <= 42.0) {
            setCaption("Viajando más allá de las estrellas por ti...");

            warpLinesGroup.visible = true;

            // Animate warp speed streaks toward black hole (-Z direction)
            const warpPositions = warpLinesGroup.children[0].geometry.attributes.position.array;
            for (let i = 0; i < warpPositions.length / 6; i++) {
                warpPositions[i * 6 + 2] += 25; // move fast in Z
                warpPositions[i * 6 + 5] += 25;
                if (warpPositions[i * 6 + 2] > camera.position.z) {
                    warpPositions[i * 6 + 2] -= 800;
                    warpPositions[i * 6 + 5] -= 800;
                }
            }
            warpLinesGroup.children[0].geometry.attributes.position.needsUpdate = true;

            // Camera rotates and speeds forward into deep space towards black hole (-Z)
            const targetCamPos = new THREE.Vector3(0, 0, -1200);
            camera.position.lerp(targetCamPos, 0.04);
            camera.lookAt(0, 0, -1800);
        }

        // Stage 5: Arrival at Black Hole (42.0s - 49.0s)
        else if (elapsed > 42.0 && elapsed <= 49.0) {
            setCaption("Mi amor por ti supera a un agujero negro y es capaz de entrar y volver de él por ti");

            warpLinesGroup.visible = false;

            accretionDiskMesh.rotation.z += 0.01;
            gravitationalLensingMesh.rotation.z -= 0.008;

            const targetCamPos = new THREE.Vector3(0, 10, -1720);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, -1800);
        }

        // Stage 6: Galaxy View (49.0s - 56.0s)
        else if (elapsed > 49.0 && elapsed <= 56.0) {
            setCaption("Mi amor por ti no tiene límite, por más que tratara de mostrarte el universo no podría ni siquiera mostrarte el 1% de mi amor por vos por que es...");

            galaxyParticles.material.opacity = Math.min(1, (elapsed - 49.0) / 2.0);
            galaxyParticles.rotation.y += 0.003;

            const targetCamPos = new THREE.Vector3(0, 130, -1620);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, -1800);
        }

        // Stage 7: Infinity Symbol (56.0s onwards)
        else if (elapsed > 56.0) {
            setCaption("Porque nuestro amor es infinito ❤️");

            galaxyParticles.rotation.y += 0.001;

            const positions = galaxyGeometry.attributes.position.array;
            const targetInfinity = galaxyGeometry.attributes.infinityPosition.array;

            const morphFactor = Math.min(1, (elapsed - 56.0) / 3.5);
            for (let i = 0; i < positions.length; i++) {
                positions[i] = positions[i] * (1 - morphFactor * 0.02) + targetInfinity[i] * (morphFactor * 0.02);
            }
            galaxyGeometry.attributes.position.needsUpdate = true;

            const targetCamPos = new THREE.Vector3(0, 0, -1680);
            camera.position.lerp(targetCamPos, 0.05);
            camera.lookAt(0, 0, -1800);
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
