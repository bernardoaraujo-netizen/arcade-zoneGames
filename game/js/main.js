// game/js/main.js - Cutscene 3D Pós-Loading (Aeroporto com Mala + Créditos Bernardo + 5s Suspense + Música)
// + Correções: Personagem visível na Bike/Jet-Ski, Munição Real (não infinita), Braço apontando para frente,
// Tiros com trajetória 3D vertical (cima/baixo) e detecção contínua de colisão nos NPCs e Policiais

window.startRockstarIntro = function() {
    const menuScreen = document.getElementById('vc-menu-screen');
    const introScreen = document.getElementById('vc-intro-screen');
    const loadingScreen = document.getElementById('vc-loading-screen');
    const gameHud = document.getElementById('vc-game-hud');

    if (menuScreen) menuScreen.classList.add('hidden');
    if (gameHud) gameHud.classList.add('hidden');
    if (introScreen) introScreen.classList.remove('hidden');

    if (window.VCSoundFX && typeof VCSoundFX.playSynthChord === 'function') {
        VCSoundFX.playSynthChord();
    }

    setTimeout(() => {
        if (introScreen) introScreen.classList.add('hidden');

        const launchWorldWithCutscene = () => {
            if (menuScreen) menuScreen.classList.add('hidden');
            if (introScreen) introScreen.classList.add('hidden');
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (gameHud) gameHud.classList.remove('hidden');
            initViceCityEngine(true);
        };

        if (window.VCLoadingScreen && typeof VCLoadingScreen.start === 'function') {
            VCLoadingScreen.start(launchWorldWithCutscene);
        } else {
            launchWorldWithCutscene();
        }
    }, 1000);
};

function initViceCityEngine(playOpeningCutscene = true) {
    const mount = document.getElementById('vc-canvas-mount');
    if (!mount) return;
    mount.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b0764);
    scene.fog = new THREE.FogExp2(0x4c1d95, 0.0016);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 850);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const canvasEl = renderer.domElement;

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const hemiLight = new THREE.HemisphereLight(0xfce7f3, 0x1e1b4b, 1.15);
    scene.add(hemiLight);
    const sunLight = new THREE.DirectionalLight(0xf472b6, 1.25);
    sunLight.position.set(180, 260, -160);
    scene.add(sunLight);

    [0, 60, 120, 180, 240, 300, 360].forEach(ix => {
        const roomLight = new THREE.PointLight(0xffffff, 1.6, 42);
        roomLight.position.set(ix, -35.2, 0);
        scene.add(roomLight);
    });

    const gameSettings = { volume: 1.0, sensitivity: 1.0, fov: 60, invertY: false, quality: 'high' };

    function getAudioContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = (window.VCSoundFX && window.VCSoundFX.ctx) || new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    let cutsceneMusicTimer = null;
    function startCutsceneSynthMusic() {
        stopCutsceneSynthMusic();
        const bassNotes = [110.0, 110.0, 130.81, 146.83, 98.0, 98.0, 130.81, 164.81];
        const leadNotes = [440.0, 523.25, 659.25, 587.33, 493.88, 523.25, 659.25, 783.99];
        let step = 0;
        const playStep = () => {
            try {
                const ctx = getAudioContext();
                const vol = Math.max(0.01, gameSettings.volume);
                const now = ctx.currentTime;
                const bassOsc = ctx.createOscillator();
                const bassGain = ctx.createGain();
                bassOsc.type = 'sawtooth';
                bassOsc.frequency.setValueAtTime(bassNotes[step % bassNotes.length], now);
                bassGain.gain.setValueAtTime(0.08 * vol, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                bassOsc.connect(bassGain);
                bassGain.connect(ctx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + 0.25);

                if (step % 2 === 0) {
                    const leadOsc = ctx.createOscillator();
                    const leadGain = ctx.createGain();
                    leadOsc.type = 'triangle';
                    leadOsc.frequency.setValueAtTime(leadNotes[(step / 2) % leadNotes.length], now);
                    leadGain.gain.setValueAtTime(0.065 * vol, now);
                    leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                    leadOsc.connect(leadGain);
                    leadGain.connect(ctx.destination);
                    leadOsc.start(now);
                    leadOsc.stop(now + 0.46);
                }
                step++;
            } catch (e) {}
        };
        playStep();
        cutsceneMusicTimer = setInterval(playStep, 260);
    }

    function stopCutsceneSynthMusic() {
        if (cutsceneMusicTimer) { clearInterval(cutsceneMusicTimer); cutsceneMusicTimer = null; }
    }

    function playSuspenseRiser() {
        try {
            const ctx = getAudioContext();
            const vol = Math.max(0.01, gameSettings.volume);
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(65, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 4.8);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.14 * vol, now + 4.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 5.0);
        } catch (e) {}
    }

    function playTitleImpactBoom() {
        try {
            const ctx = getAudioContext();
            const vol = Math.max(0.01, gameSettings.volume);
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(34, now + 1.2);
            gain.gain.setValueAtTime(0.32 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.45);
        } catch (e) {}
    }

    function playPhoneRingTone() {
        try {
            const ctx = getAudioContext();
            const vol = Math.max(0.01, gameSettings.volume);
            const now = ctx.currentTime;
            [425, 480].forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.12 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.85);
            });
        } catch (e) {}
    }

    function playPhoneHangupBeep() {
        try {
            const ctx = getAudioContext();
            const vol = Math.max(0.01, gameSettings.volume);
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(620, now);
            osc.frequency.setValueAtTime(440, now + 0.12);
            gain.gain.setValueAtTime(0.14 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {}
    }

    function playAmplifiedMoneyChime() {
        try {
            const ctx = getAudioContext();
            const vol = Math.max(0.01, gameSettings.volume);
            const now = ctx.currentTime;
            [987.77, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.18 * vol, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.22);
            });
        } catch (e) { if (window.VCSoundFX) VCSoundFX.playCash(); }
    }

    window.updateGameSettings = () => {
        const volEl = document.getElementById('cfg-volume');
        const sensEl = document.getElementById('cfg-sensitivity');
        const fovEl = document.getElementById('cfg-fov');
        const invEl = document.getElementById('cfg-invert-y');
        const qualEl = document.getElementById('cfg-quality');

        if (volEl) {
            const rawVol = parseInt(volEl.value, 10);
            gameSettings.volume = rawVol / 100;
            const lbl = document.getElementById('cfg-vol-label');
            if (lbl) lbl.textContent = `${rawVol}%`;
            if (window.VCSoundFX) {
                window.VCSoundFX.masterVolume = gameSettings.volume;
                if (window.VCSoundFX.masterGain) window.VCSoundFX.masterGain.gain.value = gameSettings.volume;
            }
        }
        if (sensEl) {
            gameSettings.sensitivity = parseFloat(sensEl.value);
            const lbl = document.getElementById('cfg-sens-label');
            if (lbl) lbl.textContent = `${gameSettings.sensitivity.toFixed(1)}x`;
        }
        if (fovEl) {
            gameSettings.fov = parseInt(fovEl.value, 10);
            const lbl = document.getElementById('cfg-fov-label');
            if (lbl) lbl.textContent = `${gameSettings.fov}°`;
            camera.fov = gameSettings.fov;
            camera.updateProjectionMatrix();
        }
        if (invEl) gameSettings.invertY = invEl.checked;
        if (qualEl) {
            gameSettings.quality = qualEl.value;
            renderer.setPixelRatio(gameSettings.quality === 'low' ? 0.75 : (gameSettings.quality === 'medium' ? 1.0 : Math.min(window.devicePixelRatio, 2)));
            camera.far = gameSettings.quality === 'low' ? 450 : (gameSettings.quality === 'medium' ? 650 : 850);
            camera.updateProjectionMatrix();
        }
    };

    const {
        colliders, sidewalkZones, stuntRamps, interiorColliders, interiorRooms,
        enterableDoors, garages, streetLamps, missionMarker, vehicles, peds,
        animals, clouds, fountain, river, ocean, surfFoam, interior
    } = VCWorld.buildCity(scene);

    const playerChar = VCModels.createHuman3D({
        isPlayer: true,
        customDna: {
            skinHex: '#f1c27d', hairColor: 0x1c1917, shirtHex: '#06b6d4',
            pantsColor: 0x1e3a8a, shoeColor: 0xf8fafc, shirtStyle: 'hawaiian',
            accessory: 'none', hasBeard: false, buildScale: 1.0, strideFreq: 1.0, armSwingAmp: 0.9
        }
    });
    scene.add(playerChar.mesh);

    const suitcase3D = new THREE.Group();
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.54, 0.40), new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.4, roughness: 0.35 }));
    bagBody.position.set(0, -0.34, 0);
    const bagHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.14), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    bagHandle.position.set(0, -0.02, 0);
    suitcase3D.add(bagBody, bagHandle);
    playerChar.handWeaponSocket.add(suitcase3D);

    const welcomeTaxi = VCModels.createCar3D(0xfacc15, false);
    const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.32), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    taxiSign.position.set(0, 1.48, 0.1);
    welcomeTaxi.mesh.add(taxiSign);
    welcomeTaxi.mesh.position.set(-742, 0, 22);
    welcomeTaxi.mesh.rotation.y = Math.PI;
    scene.add(welcomeTaxi.mesh);
    vehicles.push({ ...welcomeTaxi, name: 'Táxi Aeroporto ArcadeCab', speed: 0, maxSpeed: 0.85, angle: Math.PI, aiDir: 0, hp: 140, hasNitro: true, burningTimer: 0, destroyed: false });

    let isCutsceneActive = !!playOpeningCutscene;
    let cutsceneElapsed = 0;
    let suspensePlayed = false;
    let titleBoomPlayed = false;

    const cutsceneOverlay = document.createElement('div');
    cutsceneOverlay.id = 'vc-cutscene-overlay';
    cutsceneOverlay.className = isCutsceneActive ? 'fixed inset-0 z-40 flex flex-col justify-between pointer-events-auto' : 'hidden';
    cutsceneOverlay.innerHTML = `
        <div class="w-full h-14 sm:h-20 bg-black border-b border-pink-500/30 flex items-center justify-between px-5">
            <span class="text-[10px] sm:text-xs font-black tracking-widest text-pink-400 uppercase">✈️ AEROPORTO INTERNACIONAL DE ARCADECITY • CHEGADA</span>
            <button id="vc-skip-cutscene-btn" class="bg-zinc-900 hover:bg-pink-600 text-zinc-200 hover:text-white border border-zinc-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition">
                Pular Cena [ESPAÇO] ⏭
            </button>
        </div>
        <div id="vc-cutscene-center-text" class="px-6 text-center transition-all duration-500">
            <p id="vc-cutscene-sub" class="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-cyan-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"></p>
            <h2 id="vc-cutscene-title" class="mt-2 text-3xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 drop-shadow-[0_4px_20px_rgba(236,72,153,0.7)]"></h2>
        </div>
        <div class="w-full h-14 sm:h-20 bg-black border-t border-cyan-500/30 flex items-center justify-center px-4">
            <p id="vc-cutscene-story" class="text-xs sm:text-sm font-bold text-yellow-300 text-center">
                "Uma nova vida começa hoje em Arcade City..."
            </p>
        </div>
    `;
    document.body.appendChild(cutsceneOverlay);

    function finishOpeningCutscene() {
        if (!isCutsceneActive) return;
        isCutsceneActive = false;
        stopCutsceneSynthMusic();
        suitcase3D.visible = false;
        cutsceneOverlay.classList.add('hidden');
        playerChar.mesh.position.set(-746, 0, 22);
        playerChar.mesh.rotation.y = Math.PI;
        camYaw = Math.PI;
        camPitch = 0.14;
        lockGameCursor();
        showGameToast('🌴 Bem-vindo a Arcade City! Pegue o Táxi [F] ou explore a cidade!');
    }

    const skipBtn = document.getElementById('vc-skip-cutscene-btn');
    if (skipBtn) skipBtn.onclick = finishOpeningCutscene;

    if (isCutsceneActive) {
        playerChar.mesh.position.set(-760, 0, -4);
        playerChar.mesh.rotation.y = -Math.PI * 0.85;
        startCutsceneSynthMusic();
    } else {
        suitcase3D.visible = false;
        playerChar.mesh.position.set(66, 0, -22);
    }

    let isGameFocused = true;
    let lastMouseX = null;
    let lastMouseY = null;

    function lockGameCursor() {
        if (isAnyOverlayOpen() || isCutsceneActive) return;
        isGameFocused = true;
        try { window.focus(); mount.focus(); } catch (e) {}
        document.body.style.cursor = 'none';
        mount.style.cursor = 'none';
        canvasEl.style.cursor = 'none';
        const hint = document.getElementById('vc-lock-hint');
        if (hint) hint.classList.add('hidden');
        try {
            const target = canvasEl.requestPointerLock ? canvasEl : mount;
            if (document.pointerLockElement !== target) {
                const promise = target.requestPointerLock();
                if (promise && typeof promise.catch === 'function') promise.catch(() => {});
            }
        } catch (e) {}
    }

    function unlockGameCursor() {
        isGameFocused = false;
        lastMouseX = null;
        lastMouseY = null;
        document.body.style.cursor = 'default';
        mount.style.cursor = 'default';
        canvasEl.style.cursor = 'default';
        try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    }

    document.addEventListener('pointerlockchange', () => {
        const locked = (document.pointerLockElement === canvasEl || document.pointerLockElement === mount);
        if (locked) {
            isGameFocused = true;
            document.body.style.cursor = 'none';
            canvasEl.style.cursor = 'none';
            const hint = document.getElementById('vc-lock-hint');
            if (hint) hint.classList.add('hidden');
        }
    });

    window.toggleSettingsModal = (forceState) => {
        const modal = document.getElementById('vc-settings-modal');
        if (!modal) return;
        const show = forceState !== undefined ? forceState : modal.classList.contains('hidden');
        modal.classList.toggle('hidden', !show);
        if (show) {
            isAiming = false; mouseLeftDown = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
            document.getElementById('vc-lock-hint').classList.add('hidden');
            unlockGameCursor();
        } else {
            updateGameSettings();
            lockGameCursor();
        }
    };

    const phoneProp3D = new THREE.Group();
    const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.21, 0.025), new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8 }));
    const phoneScreen = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.18, 0.028), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    phoneProp3D.add(phoneBody, phoneScreen);
    phoneProp3D.visible = false;
    playerChar.handWeaponSocket.add(phoneProp3D);

    const weaponModels3D = {
        knife: VCModels.createWeapon3D('knife'),
        bat: VCModels.createWeapon3D('bat'),
        pistol: VCModels.createWeapon3D('pistol'),
        uzi: VCModels.createWeapon3D('uzi'),
        shotgun: VCModels.createWeapon3D('shotgun'),
        m4: VCModels.createWeapon3D('shotgun')
    };
    weaponModels3D.m4.scale.set(1.15, 1.15, 1.25);
    Object.values(weaponModels3D).forEach(m => { m.visible = false; playerChar.handWeaponSocket.add(m); });

    const gasStations = [];
    [
        { name: "Posto Octane Zona Leste", x: 66, z: 110 },
        { name: "Posto Turbo Centro", x: -66, z: -110 }
    ].forEach(gs => {
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 7), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        canopy.position.set(gs.x, 4.4, gs.z);
        const pump1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.9), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 }));
        pump1.position.set(gs.x - 2.2, 0.9, gs.z);
        const pump2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.9), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 }));
        pump2.position.set(gs.x + 2.2, 0.9, gs.z);
        scene.add(canopy, pump1, pump2);
        gasStations.push({ name: gs.name, x: gs.x, z: gs.z, pumps: [pump1, pump2], exploded: false });
    });

    const rainDrops = [];
    const rainGroup = new THREE.Group();
    rainGroup.visible = false;
    const dropGeo = new THREE.BoxGeometry(0.04, 0.85, 0.04);
    const dropMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 450; i++) {
        const drop = new THREE.Mesh(dropGeo, dropMat);
        drop.position.set((Math.random() - 0.5) * 90, Math.random() * 45, (Math.random() - 0.5) * 90);
        rainGroup.add(drop);
        rainDrops.push(drop);
    }
    scene.add(rainGroup);

    const weapons = [
        { name: "Punhos (Desarmado)", icon: "👊", ammo: Infinity, type: "melee", dmg: 30, rate: 15 },
        { name: "Faca Tática", icon: "🔪", ammo: Infinity, type: "knife", dmg: 55, rate: 12 },
        { name: "Bastão de Beisebol", icon: "🏏", ammo: Infinity, type: "bat", dmg: 68, rate: 18 },
        { name: "Pistola 9mm", icon: "🔫", ammo: 60, type: "pistol", dmg: 40, rate: 12 },
        { name: "Uzi Mac-10", icon: "🧨", ammo: 150, type: "uzi", dmg: 25, rate: 5 },
        { name: "Escopeta Cal.12", icon: "💥", ammo: 24, type: "shotgun", dmg: 50, rate: 24 },
        { name: "Fuzil M4 Carbine", icon: "🎖️", ammo: 120, type: "m4", dmg: 45, rate: 6 }
    ];

    function formatAmmoDisplay(wpn) {
        return wpn.ammo === Infinity ? '∞' : String(wpn.ammo);
    }

    const radioStations = [
        { name: "FLASH FM 80s • ON AIR", color: "#22d3ee" },
        { name: "ARCADE SYNTHWAVE • NEON", color: "#ec4899" },
        { name: "VCPD POLICE SCANNER • 190", color: "#facc15" },
        { name: "RÁDIO DESLIGADO", color: "#71717a" }
    ];

    const weatherModes = [
        { id: 'sunny', label: '☀️ 29°C • SOL', rain: false },
        { id: 'rain',  label: '🌧️ 19°C • CHUVA', rain: true },
        { id: 'storm', label: '⛈️ 16°C • TEMPESTADE', rain: true }
    ];
    let currentWeatherIdx = 0;
    let currentRadioIdx = 0;
    let currentWeaponIdx = 0;
    let fireCooldown = 0;
    let grenadeCount = 5;

    let playerCash = 3500;
    let playerHealth = 100;
    let playerArmor = 100;
    let playerStamina = 100;
    let isPlayerDead = false;
    let wastedTimer = 0;
    let invulnFrames = 0;
    let wantedStars = 0;

    let inVehicle = null;
    let ridingAsPassenger = false;
    let isAiming = false;
    let activeInterior = null;
    let clerkSurrendered = false;

    let gpsWaypoint = null;
    let camYaw = 0;
    let camPitch = 0.14;
    let gameMinutes = 17 * 60 + 30;
    let missionStage = 1;
    let wheelieTicks = 0;

    let activePhoneCall = null;
    const dispatchedServices = [];
    const bullets = [];
    const enemyBullets = [];
    const grenades = [];
    const particles = [];
    const droppedPickups = [];

    function isAnyOverlayOpen() {
        return !document.getElementById('vc-full-map').classList.contains('hidden') ||
               !document.getElementById('vc-weapon-wheel').classList.contains('hidden') ||
               !document.getElementById('vc-settings-modal').classList.contains('hidden') ||
               !document.getElementById('vc-phone-modal').classList.contains('hidden');
    }

    function showGameToast(txt) {
        const el = document.getElementById('vc-toast');
        if (!el) return;
        el.textContent = txt;
        el.classList.remove('hidden');
        clearTimeout(window.vcToastTimer);
        window.vcToastTimer = setTimeout(() => el.classList.add('hidden'), 4200);
    }

    function updateRadioHUD() {
        const el = document.getElementById('vc-radio-name');
        if (!el) return;
        const st = radioStations[currentRadioIdx];
        el.textContent = st.name;
        el.style.color = st.color;
    }

    function cycleWeather(forceIdx = null) {
        currentWeatherIdx = forceIdx !== null ? forceIdx : (currentWeatherIdx + 1) % weatherModes.length;
        const w = weatherModes[currentWeatherIdx];
        rainGroup.visible = w.rain && !activeInterior;
        const badge = document.getElementById('vc-weather-badge');
        if (badge) badge.textContent = w.label;
        showGameToast(`🌦️ Clima alterado: ${w.label}`);
    }

    window.togglePhoneModal = (forceState) => {
        if (isCutsceneActive) return;
        const modal = document.getElementById('vc-phone-modal');
        if (!modal) return;
        const show = forceState !== undefined ? forceState : modal.classList.contains('hidden');
        modal.classList.toggle('hidden', !show);
        if (show) {
            isAiming = false; mouseLeftDown = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
            document.getElementById('vc-lock-hint').classList.add('hidden');
            unlockGameCursor();
        } else {
            lockGameCursor();
        }
    };

    function initiatePhoneCall(serviceType) {
        if (activeInterior) { showGameToast('📵 Sem sinal dentro do edifício!'); return; }
        if (activePhoneCall) { showGameToast('📞 Você já está em uma ligação!'); return; }
        togglePhoneModal(false);
        Object.values(weaponModels3D).forEach(m => m.visible = false);
        phoneProp3D.visible = true;
        activePhoneCall = { service: serviceType, stage: 'ringing', timer: 65, ringsLeft: 3, callerPos: playerChar.mesh.position.clone() };
        playPhoneRingTone();
        showGameToast('📞 Chamando... (Segurando celular no ouvido)');
    }

    function spawnDispatchedVehicle(serviceType, destPos) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnX = Math.max(-790, Math.min(790, destPos.x + Math.cos(spawnAngle) * 120));
        const spawnZ = Math.max(-1140, Math.min(1140, destPos.z + Math.sin(spawnAngle) * 120));

        if (serviceType === 'taxi') {
            const taxi = VCModels.createCar3D(0xfacc15, false);
            const tSign = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.32), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
            tSign.position.set(0, 1.48, 0.1);
            taxi.mesh.add(tSign);
            const driver = VCModels.createHuman3D({ seed: 1234 });
            driver.mesh.scale.setScalar(0.75);
            driver.mesh.position.set(-0.35, 0.35, 0.1);
            taxi.mesh.add(driver.mesh);
            taxi.mesh.position.set(spawnX, 0, spawnZ);
            scene.add(taxi.mesh);
            const taxiObj = { ...taxi, driverChar: driver, name: 'Táxi / Uber ArcadeCab', isTaxi: true, speed: 0.45, maxSpeed: 0.85, angle: 0, aiDir: 0, hp: 140, hasNitro: true, burningTimer: 0, destroyed: false };
            vehicles.push(taxiObj);
            dispatchedServices.push({ type: 'taxi', vehicle: taxiObj, targetX: destPos.x, targetZ: destPos.z, arrived: false, tripActive: false });
        } else if (serviceType === 'police') {
            const cop = VCModels.createCar3D(0x090d16, true);
            cop.mesh.position.set(spawnX, 0, spawnZ);
            scene.add(cop.mesh);
            const copObj = { ...cop, name: 'Viatura VCPD (Chamado 190)', isCopCar: true, speed: 0.48, maxSpeed: 0.88, angle: 0, aiDir: 0, hp: 150, hasNitro: true, burningTimer: 0, destroyed: false, deployed: false };
            copUnits.push(copObj);
            dispatchedServices.push({ type: 'police', vehicle: copObj, targetX: destPos.x, targetZ: destPos.z, arrived: false });
        } else if (serviceType === 'mechanic') {
            const sportCar = VCModels.createCar3D(0x06b6d4, false);
            sportCar.mesh.position.set(spawnX, 0, spawnZ);
            scene.add(sportCar.mesh);
            const carObj = { ...sportCar, name: 'Infernus GT Turbo (Mecânico)', speed: 0.48, maxSpeed: 0.98, angle: 0, aiDir: 0, hp: 150, hasNitro: true, burningTimer: 0, destroyed: false };
            vehicles.push(carObj);
            dispatchedServices.push({ type: 'mechanic', vehicle: carObj, targetX: destPos.x, targetZ: destPos.z, arrived: false });
        } else if (serviceType === 'gang') {
            const van = VCModels.createCar3D(0x9333ea, false);
            van.mesh.position.set(spawnX, 0, spawnZ);
            scene.add(van.mesh);
            const vanObj = { ...van, name: 'Carro da Gangue Aliada', speed: 0.46, maxSpeed: 0.84, angle: 0, aiDir: 0, hp: 140, hasNitro: false, burningTimer: 0, destroyed: false };
            vehicles.push(vanObj);
            dispatchedServices.push({ type: 'gang', vehicle: vanObj, targetX: destPos.x, targetZ: destPos.z, arrived: false });
        }
    }

    window.phoneCallTaxi = () => { if (playerCash < 100) { showGameToast('⚠️ Precisa de $100!'); return; } playerCash -= 100; updateHUD(); initiatePhoneCall('taxi'); };
    window.phoneCallPolice = () => initiatePhoneCall('police');
    window.phoneBribePolice = () => { if (wantedStars === 0) return; if (playerCash < 600) { showGameToast('⚠️ Precisa de $600!'); return; } playerCash -= 600; wantedStars = 0; updateHUD(); togglePhoneModal(false); playAmplifiedMoneyChime(); showGameToast('🕶️ Estrelas removidas!'); };
    window.phoneCallMechanic = () => { if (playerCash < 500) { showGameToast('⚠️ Precisa de $500!'); return; } playerCash -= 500; updateHUD(); initiatePhoneCall('mechanic'); };
    window.phoneCallGangBackup = () => { if (playerCash < 400) { showGameToast('⚠️ Precisa de $400!'); return; } playerCash -= 400; updateHUD(); initiatePhoneCall('gang'); };

    const bridgeZs = [-1600, -1200, -900, -800, -600, -400, -300, 0, 300, 400, 600, 800, 900, 1200, 1600];

    function isPointInWater(x, z) {
        const onBridge = bridgeZs.some(bz => Math.abs(z - bz) < 8.5);
        if (!onBridge && Math.abs(x) < 22) return true;
        if (x > 900) return true;
        return false;
    }

    function isPointOnSidewalk(x, z) {
        if (!sidewalkZones || sidewalkZones.length === 0) return true;
        for (let i = 0; i < sidewalkZones.length; i++) {
            const s = sidewalkZones[i];
            if (x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ) return true;
        }
        return false;
    }

    function getOceanWaveHeight(x, z, timeSec) {
        if (x <= 900) return 0.1;
        return 0.25 + Math.sin(x * 0.08 - timeSec * 3.2) * 0.35 + Math.cos(z * 0.05 + timeSec * 2.1) * 0.22;
    }

    function hitsColliderBox(x, z, radius, boxList) {
        if (!boxList) return false;
        for (let i = 0; i < boxList.length; i++) {
            const b = boxList[i];
            if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) return true;
        }
        return false;
    }

    function moveEntityWithHitbox(pos, dx, dz, radius, interiorType = null, allowWater = true, restrictToSidewalk = false) {
        if (interiorType && interiorRooms[interiorType]) {
            const room = interiorRooms[interiorType];
            const roomBoxes = interiorColliders[interiorType] || [];
            const nx = pos.x + dx, nz = pos.z + dz;
            if (Math.abs(nx - room.cx) < 11.2 && !hitsColliderBox(nx, pos.z, radius, roomBoxes)) pos.x = nx;
            if (nz > -11.5 && nz < 11.2 && !hitsColliderBox(pos.x, nz, radius, roomBoxes)) pos.z = nz;
            return true;
        }

        let moved = false;
        const nextX = pos.x + dx;
        let blockedX = (!allowWater && isPointInWater(nextX, pos.z)) || hitsColliderBox(nextX, pos.z, radius, colliders) || (restrictToSidewalk && !isPointOnSidewalk(nextX, pos.z));
        if (!blockedX && Math.abs(nextX) < 2300) { pos.x = nextX; moved = true; }

        const nextZ = pos.z + dz;
        let blockedZ = (!allowWater && isPointInWater(pos.x, nextZ)) || hitsColliderBox(pos.x, nextZ, radius, colliders) || (restrictToSidewalk && !isPointOnSidewalk(pos.x, nextZ));
        if (!blockedZ && Math.abs(nextZ) < 2300) { pos.z = nextZ; moved = true; }
        return moved;
    }

    function checkVehicleBump(movingCar, nextX, nextZ, allVehicles, extraCops) {
        const list = [...allVehicles, ...extraCops];
        for (let other of list) {
            if (other === movingCar || other.destroyed || (other.altitude || 0) > 3 || (movingCar.altitude || 0) > 3) continue;
            if (Math.hypot(nextX - other.mesh.position.x, nextZ - other.mesh.position.z) < 3.4) return other;
        }
        return null;
    }

    function spawnParticle(x, y, z, colorHex, scale = 0.35, vy = 0.08, life = 28) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(scale, scale, scale), new THREE.MeshBasicMaterial({ color: colorHex }));
        p.position.set(x, y, z);
        scene.add(p);
        particles.push({ mesh: p, vx: (Math.random() - 0.5) * 0.14, vy: vy + Math.random() * 0.06, vz: (Math.random() - 0.5) * 0.14, life });
    }

    function spawnPickup(x, z, type = 'cash', value = 85) {
        const group = new THREE.Group();
        group.position.set(x, 0.36, z);
        if (type === 'cash') {
            const billStack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.24, 0.42), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
            const goldBand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.44), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
            group.add(billStack, goldBand);
        } else {
            const colorMap = { health: 0xf43f5e, armor: 0x38bdf8, ammo: 0xfacc15 };
            group.add(new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.45), new THREE.MeshBasicMaterial({ color: colorMap[type] || 0x38bdf8 })));
        }
        scene.add(group);
        droppedPickups.push({ mesh: group, type, value, life: 1500, bobPhase: Math.random() * 6.28 });
    }

    function dropNPCLoot(x, z, baseCash = 85) {
        spawnPickup(x, z, 'cash', baseCash + Math.floor(Math.random() * 75));
        const r = Math.random();
        if (r < 0.25) spawnPickup(x + 0.8, z + 0.5, 'ammo', 30);
        else if (r < 0.45) spawnPickup(x + 0.8, z + 0.5, Math.random() < 0.5 ? 'health' : 'armor', 40);
    }

    function triggerExplosion(pos, radius = 12, maxDamage = 115) {
        if (window.VCSoundFX) VCSoundFX.playGunshot('shotgun');
        for (let i = 0; i < 24; i++) {
            spawnParticle(pos.x + (Math.random() - 0.5) * 2.5, pos.y + 0.8 + Math.random() * 1.5, pos.z + (Math.random() - 0.5) * 2.5, i % 2 === 0 ? 0xf97316 : 0xfacc15, 0.65, 0.18, 36);
        }
        peds.forEach(p => { if (p.alive && p.char.mesh.position.distanceTo(pos) < radius) { p.alive = false; p.hp = 0; p.char.state = 'dead'; dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 95); } });
        copOfficers.forEach(cop => { if (cop.alive && cop.char.mesh.position.distanceTo(pos) < radius) { cop.alive = false; cop.hp = 0; cop.char.state = 'dead'; dropNPCLoot(cop.char.mesh.position.x, cop.char.mesh.position.z, 175); } });
        [...vehicles, ...copUnits].forEach(v => { if (!v.destroyed && v.mesh.position.distanceTo(pos) < radius) damageVehicle(v, 75); });
        if (!activeInterior && !isPlayerDead) {
            const pPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
            const dist = pPos.distanceTo(pos);
            if (dist < radius) applyDamageToPlayer(Math.round(maxDamage * (1 - dist / radius)), 'explosion');
        }
    }

    function damageVehicle(v, dmg) {
        if (!v || v.destroyed) return;
        v.hp = Math.max(0, (v.hp !== undefined ? v.hp : 100) - dmg);
        if (v.hp <= 0 && !v.burningTimer) {
            v.burningTimer = 140;
            if (v === inVehicle) showGameToast('🔥 MOTOR EM CHAMAS! Aperte [F] para pular!');
        }
    }

    const copUnits = [], copOfficers = [], copHelis = [];

    function spawnCopCar(nearPos = null) {
        if (copUnits.length >= 4) return;
        const basePos = nearPos || playerChar.mesh.position;
        const copBuilt = VCModels.createCar3D(0x090d16, true);
        const angleSpawn = Math.random() * Math.PI * 2;
        copBuilt.mesh.position.set(Math.max(-790, Math.min(790, basePos.x + Math.cos(angleSpawn) * 48)), 0, Math.max(-1140, Math.min(1140, basePos.z + Math.sin(angleSpawn) * 48)));
        scene.add(copBuilt.mesh);
        copUnits.push({ ...copBuilt, name: 'Viatura VCPD', isCopCar: true, speed: 0.34, maxSpeed: 0.80, angle: 0, hp: 120, burningTimer: 0, destroyed: false, deployed: false });
    }

    function deployCopsFromCar(copCar) {
        if (copCar.deployed || copCar.destroyed) return;
        copCar.deployed = true; copCar.doorOpenTimer = 45;
        const isSwat = wantedStars >= 4;
        [-1.9, 1.9].forEach((sideOffset, idx) => {
            const officer = VCModels.createHuman3D({ isCop: true, seed: 700 + idx + (isSwat ? 50 : 0) });
            officer.handWeaponSocket.add(VCModels.createWeapon3D(isSwat ? 'uzi' : 'pistol'));
            officer.mesh.position.set(copCar.mesh.position.x + sideOffset, 0, copCar.mesh.position.z + (idx === 0 ? -1 : 1));
            scene.add(officer.mesh);
            copOfficers.push({ char: officer, alive: true, isSwat, hp: isSwat ? 110 : 65, shootCooldown: 28 + Math.floor(Math.random() * 20) });
        });
    }

    function syncPoliceEscalation() {
        const desiredCars = wantedStars >= 4 ? 3 : (wantedStars >= 1 ? Math.min(2, wantedStars) : 0);
        while (copUnits.length < desiredCars) spawnCopCar();
        if (wantedStars === 0) {
            while (copUnits.length) scene.remove(copUnits.pop().mesh);
            while (copOfficers.length) scene.remove(copOfficers.pop().char.mesh);
            while (copHelis.length) scene.remove(copHelis.pop().mesh);
        }
    }

    function updateHUD() {
        document.getElementById('vc-cash').textContent = `$${String(playerCash).padStart(8, '0')}`;
        const hp = Math.max(0, Math.round(playerHealth));
        const arm = Math.max(0, Math.round(playerArmor));
        const stam = Math.max(0, Math.round(playerStamina));
        document.getElementById('vc-health').textContent = hp;
        document.getElementById('vc-armor').textContent = arm;
        const stamEl = document.getElementById('vc-stamina');
        if (stamEl) stamEl.textContent = stam;

        const healthBar = document.getElementById('vc-health-bar');
        const healthText = document.getElementById('vc-health-text');
        const armorBar = document.getElementById('vc-armor-bar');
        const stamBar = document.getElementById('vc-stamina-bar');
        const vignette = document.getElementById('vc-damage-vignette');

        if (armorBar) armorBar.style.width = `${arm}%`;
        if (stamBar) stamBar.style.width = `${stam}%`;
        if (healthBar) {
            healthBar.style.width = `${hp}%`;
            if (hp > 60) { healthBar.className = 'h-full bg-emerald-500 transition-all duration-200'; if (healthText) healthText.className = 'text-emerald-400'; }
            else if (hp > 30) { healthBar.className = 'h-full bg-yellow-400 transition-all duration-200'; if (healthText) healthText.className = 'text-yellow-400'; }
            else { healthBar.className = 'h-full bg-red-600 transition-all duration-200'; if (healthText) healthText.className = 'text-red-500 animate-pulse'; }
        }
        if (vignette) {
            const alpha = hp < 65 ? Math.min(0.88, ((65 - hp) / 65) * 0.85) : 0;
            vignette.style.setProperty('--blood-alpha', alpha.toFixed(2));
            vignette.style.opacity = alpha.toFixed(2);
        }
        document.getElementById('vc-stars').innerHTML = `<span class="text-cyan-300">${'★'.repeat(wantedStars)}</span><span class="text-zinc-600">${'☆'.repeat(6 - wantedStars)}</span>`;
        syncPoliceEscalation();
    }

    function applyDamageToPlayer(dmg, cause = 'combat') {
        if (isPlayerDead || invulnFrames > 0 || isCutsceneActive) return;
        if (playerArmor > 0) {
            const absorbed = Math.min(playerArmor, dmg);
            playerArmor -= absorbed;
            if (dmg - absorbed > 0) playerHealth = Math.max(0, playerHealth - (dmg - absorbed));
        } else {
            playerHealth = Math.max(0, playerHealth - dmg);
        }
        invulnFrames = 12;
        updateHUD();
        if (playerHealth <= 0) {
            isPlayerDead = true; wastedTimer = 160; isAiming = false; activePhoneCall = null; phoneProp3D.visible = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
            if (inVehicle) { playerChar.mesh.position.set(inVehicle.mesh.position.x - 2.2, 0, inVehicle.mesh.position.z); playerChar.mesh.visible = true; inVehicle = null; ridingAsPassenger = false; }
            playerChar.state = 'dead'; wantedStars = 0; syncPoliceEscalation();
            showGameToast('💀 WASTED! (-$250 taxa hospitalar)');
        }
    }

    function respawnAtHospital() {
        isPlayerDead = false; playerChar.state = 'alive'; playerChar.mesh.rotation.x = 0; playerChar.mesh.position.set(84, 0, -28);
        activeInterior = null; clerkSurrendered = false; playerHealth = 100; playerArmor = 50; playerStamina = 100;
        playerCash = Math.max(0, playerCash - 250); invulnFrames = 60; updateHUD();
        showGameToast('🏥 Alta do Hospital Central! Vida restaurada.');
    }

    window.selectVCWeapon = (idx) => {
        if (isPlayerDead || !weapons[idx]) return;
        currentWeaponIdx = idx;
        const wType = weapons[idx].type;
        phoneProp3D.visible = false;
        Object.keys(weaponModels3D).forEach(k => weaponModels3D[k].visible = (k === wType));
        if (wType === 'melee' || wType === 'knife' || wType === 'bat') {
            isAiming = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
        }
        document.getElementById('vc-weapon-icon').textContent = weapons[idx].icon;
        document.getElementById('vc-ammo').textContent = `${formatAmmoDisplay(weapons[idx])} | 💣${grenadeCount}`;
        document.getElementById('vc-weapon-wheel').classList.add('hidden');
        showGameToast(`Equipado: ${weapons[idx].name}`);
        lockGameCursor();
    };

    function throwGrenade() {
        if (grenadeCount <= 0 || inVehicle || isPlayerDead || isCutsceneActive) {
            if (grenadeCount <= 0) showGameToast('⚠️ Sem granadas! Compre na Ammu-Nation.');
            return;
        }
        grenadeCount--;
        document.getElementById('vc-ammo').textContent = `${formatAmmoDisplay(weapons[currentWeaponIdx])} | 💣${grenadeCount}`;
        const gMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.7 }));
        gMesh.position.set(playerChar.mesh.position.x, playerChar.mesh.position.y + 1.5, playerChar.mesh.position.z);
        scene.add(gMesh);
        grenades.push({ mesh: gMesh, vx: -Math.sin(camYaw) * 0.42, vy: 0.24 - camPitch * 0.2, vz: -Math.cos(camYaw) * 0.42, timer: 110 });
        showGameToast('💣 Granada lançada!');
    }

    function triggerStoreRobberyReport(storeDoor) {
        if (storeDoor.reported) return;
        storeDoor.reported = true;
        interior.alarmLight.material.color.setHex(0xef4444);
        wantedStars = Math.min(6, Math.max(3, wantedStars + 3));
        updateHUD();
        const exitPoint = new THREE.Vector3(storeDoor.extX, 0, storeDoor.extZ);
        while (copUnits.length < 2) spawnCopCar(exitPoint);
        copUnits.forEach((c, idx) => { c.mesh.position.set(storeDoor.extX + (idx === 0 ? -7.5 : 7.5), 0, storeDoor.extZ + 11); c.deployed = false; deployCopsFromCar(c); });
        showGameToast(`🚨 DENÚNCIA 190: A polícia cercou a saída de ${storeDoor.name}!`);
    }

    const MAP_EXTENT = 1300;
    window.toggleFullMap = (forceState) => {
        if (isCutsceneActive) return;
        const mapEl = document.getElementById('vc-full-map');
        if (!mapEl) return;
        const show = forceState !== undefined ? forceState : mapEl.classList.contains('hidden');
        mapEl.classList.toggle('hidden', !show);
        if (show) { isAiming = false; document.getElementById('vc-crosshair').classList.add('hidden'); document.getElementById('vc-lock-hint').classList.add('hidden'); unlockGameCursor(); drawBigMap(); }
        else lockGameCursor();
    };
    window.clearGPSWaypoint = () => { gpsWaypoint = null; drawBigMap(); showGameToast('📍 Rota removida'); };

    const bigMapCanvas = document.getElementById('vc-bigmap-canvas');
    if (bigMapCanvas) {
        bigMapCanvas.onclick = (e) => {
            const rect = bigMapCanvas.getBoundingClientRect();
            gpsWaypoint = { x: (((e.clientX - rect.left) - 210) / 210) * MAP_EXTENT, z: (((e.clientY - rect.top) - 210) / 210) * MAP_EXTENT };
            drawBigMap();
            showGameToast('📍 Destino marcado!');
        };
    }

    const doorSymbols = { bank: '💰', store: '🛒', diner: '🍔', school: '🎓', house: '🏠', gunshop: '🔫', police: '🚓' };
    function getPlayerWorldRefPos() {
        if (activeInterior) return new THREE.Vector3(activeInterior.extX, 0, activeInterior.extZ);
        if (inVehicle) return inVehicle.mesh.position;
        return playerChar.mesh.position;
    }

    const radarCanvas = document.getElementById('vc-radar');
    const rCtx = radarCanvas ? radarCanvas.getContext('2d') : null;
    function drawRadar() {
        if (!rCtx) return;
        rCtx.clearRect(0, 0, 112, 112); rCtx.fillStyle = '#0f172a'; rCtx.fillRect(0, 0, 112, 112);
        const ref = getPlayerWorldRefPos(); const px = ref.x, pz = ref.z, scale = 0.28;
        rCtx.fillStyle = '#0284c7'; rCtx.fillRect(56 - (px * scale) - 4, 0, 8, 112);
        if (gpsWaypoint) {
            const gx = 56 + (gpsWaypoint.x - px) * scale, gz = 56 + (gpsWaypoint.z - pz) * scale;
            rCtx.strokeStyle = '#ec4899'; rCtx.lineWidth = 3; rCtx.beginPath(); rCtx.moveTo(56, 56); rCtx.lineTo(gx, gz); rCtx.stroke();
            rCtx.font = '11px sans-serif'; rCtx.fillText('📍', Math.max(8, Math.min(96, gx - 5)), Math.max(12, Math.min(104, gz + 4)));
            if (Math.hypot(gpsWaypoint.x - px, gpsWaypoint.z - pz) < 16) { gpsWaypoint = null; showGameToast('📍 Você chegou ao destino!'); }
        }
        rCtx.font = '10px sans-serif'; rCtx.textAlign = 'center'; rCtx.textBaseline = 'middle';
        enterableDoors.forEach(d => {
            if ((d.type === 'store' || d.type === 'bank') && d.robbed) return;
            const sx = 56 + (d.extX - px) * scale, sz = 56 + (d.extZ - pz) * scale;
            if (sx > 6 && sx < 106 && sz > 6 && sz < 106) rCtx.fillText(doorSymbols[d.type] || '•', sx, sz);
        });
        garages.forEach(g => { const sx = 56 + (g.x - px) * scale, sz = 56 + (g.z - pz) * scale; if (sx > 6 && sx < 106 && sz > 6 && sz < 106) rCtx.fillText('🔧', sx, sz); });
        gasStations.forEach(gs => { const sx = 56 + (gs.x - px) * scale, sz = 56 + (gs.z - pz) * scale; if (sx > 6 && sx < 106 && sz > 6 && sz < 106) rCtx.fillText('⛽', sx, sz); });
        rCtx.fillStyle = '#ffffff'; rCtx.beginPath(); rCtx.arc(56, 56, 3.8, 0, Math.PI * 2); rCtx.fill();
    }

    function drawBigMap() {
        const bc = document.getElementById('vc-bigmap-canvas');
        if (!bc) return;
        const ctx = bc.getContext('2d');
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 420, 420);
        ctx.fillStyle = '#0284c7'; ctx.fillRect(206, 0, 8, 420);
        ctx.fillStyle = '#fde047'; ctx.fillRect(348, 0, 12, 420);
        ctx.fillStyle = '#06b6d4'; ctx.fillRect(360, 0, 60, 420);
        const airportPx = 210 + (-900 / MAP_EXTENT) * 210;
        ctx.fillStyle = '#09090b'; ctx.fillRect(airportPx - 6, 165, 12, 90);
        const ref = getPlayerWorldRefPos();
        const mapPx = 210 + (ref.x / MAP_EXTENT) * 210, mapPz = 210 + (ref.z / MAP_EXTENT) * 210;
        if (gpsWaypoint) {
            const gx = 210 + (gpsWaypoint.x / MAP_EXTENT) * 210, gz = 210 + (gpsWaypoint.z / MAP_EXTENT) * 210;
            ctx.strokeStyle = '#ec4899'; ctx.lineWidth = 4; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(mapPx, mapPz); ctx.lineTo(gx, gz); ctx.stroke(); ctx.setLineDash([]);
            ctx.font = '14px sans-serif'; ctx.fillText('📍', gx - 7, gz + 5);
        }
        ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        enterableDoors.forEach(d => ctx.fillText(doorSymbols[d.type] || '•', 210 + (d.extX / MAP_EXTENT) * 210, 210 + (d.extZ / MAP_EXTENT) * 210));
        garages.forEach(g => ctx.fillText('🔧', 210 + (g.x / MAP_EXTENT) * 210, 210 + (g.z / MAP_EXTENT) * 210));
        gasStations.forEach(gs => ctx.fillText('⛽', 210 + (gs.x / MAP_EXTENT) * 210, 210 + (gs.z / MAP_EXTENT) * 210));
        ctx.fillText('✈️', airportPx, 210);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mapPx, mapPz, 6, 0, Math.PI * 2); ctx.fill();
    }

    const keys = {};
    let mouseLeftDown = false;

    window.onkeydown = (e) => {
        const k = e.key.toLowerCase();
        keys[k] = true;
        if (isCutsceneActive) { if (e.code === 'Space' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); finishOpeningCutscene(); } return; }
        if (k === 'o' || k === 'p') { e.preventDefault(); toggleSettingsModal(); return; }
        if (k === 't') { e.preventDefault(); togglePhoneModal(); return; }
        if (isPlayerDead) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            const wheel = document.getElementById('vc-weapon-wheel');
            if (wheel.classList.contains('hidden')) { isAiming = false; document.getElementById('vc-crosshair').classList.add('hidden'); document.getElementById('vc-lock-hint').classList.add('hidden'); unlockGameCursor(); wheel.classList.remove('hidden'); }
        }
        if (k === 'm') { e.preventDefault(); toggleFullMap(); }
        if (['1','2','3','4','5','6','7'].includes(k)) selectVCWeapon(parseInt(k, 10) - 1);
        if (k === 'x' && !inVehicle && currentWeaponIdx >= 3) { isAiming = !isAiming; document.getElementById('vc-crosshair').classList.toggle('hidden', !isAiming); }
        if (k === 'z' && !inVehicle) performAttack();
        if (k === 'g') { e.preventDefault(); throwGrenade(); }
        if (k === 'c') cycleWeather();
        if (k === 'r') { currentRadioIdx = (currentRadioIdx + 1) % radioStations.length; updateRadioHUD(); if (window.VCSoundFX) VCSoundFX.playSynthChord(); showGameToast(`📻 Rádio: ${radioStations[currentRadioIdx].name}`); }
        if (e.code === 'Space') { e.preventDefault(); const isAircraft = inVehicle && (inVehicle.vehicleType === 'plane' || inVehicle.vehicleType === 'jet'); if (!inVehicle && !isAircraft && playerChar.yPos <= 0.01 && playerChar.state !== 'dead') playerChar.vy = 0.28; }
        if (k === 'h' && inVehicle && window.VCSoundFX) VCSoundFX.playCarHorn();

        if (k === 'f' && !activeInterior) {
            if (inVehicle) {
                const isAircraft = inVehicle.vehicleType === 'plane' || inVehicle.vehicleType === 'jet';
                if (isAircraft && (inVehicle.altitude || 0) > 6) { playerChar.yPos = inVehicle.altitude; playerChar.vy = 0; showGameToast('🪂 Saltou da aeronave!'); }
                inVehicle.doorOpenTimer = 28;
                playerChar.mesh.position.set(inVehicle.mesh.position.x - 2.6, inVehicle.altitude || 0, inVehicle.mesh.position.z);
                playerChar.mesh.visible = true;
                playerChar.bodyContainer.rotation.x = 0;
                inVehicle = null; ridingAsPassenger = false;
                document.getElementById('vc-alt-badge').classList.add('hidden');
            } else {
                const allDrivable = [...vehicles, ...copUnits];
                for (let v of allDrivable) {
                    if (!v.destroyed && playerChar.mesh.position.distanceTo(v.mesh.position) < 5.5) {
                        v.doorOpenTimer = 28;
                        inVehicle = v;
                        if (v.angle === undefined) v.angle = v.mesh.rotation.y;
                        if (v.maxSpeed === undefined) v.maxSpeed = 0.76;
                        camYaw = v.angle;

                        const isOpenVehicle = (v.vehicleType === 'bike' || v.vehicleType === 'jetski');
                        playerChar.mesh.visible = isOpenVehicle;
                        isAiming = false;
                        document.getElementById('vc-crosshair').classList.add('hidden');

                        if (v.isTaxi) {
                            ridingAsPassenger = true;
                            const srv = dispatchedServices.find(s => s.vehicle === v);
                            if (srv) {
                                if (!gpsWaypoint) { gpsWaypoint = { x: -112, z: 75 }; showGameToast('🚕 Entrou no Táxi! Levando ao Banco Central.'); }
                                else showGameToast('🚕 Entrou no Táxi! Indo para o seu destino GPS.');
                                srv.tripActive = true;
                            }
                            return;
                        }
                        ridingAsPassenger = false;
                        if (v.driverChar) { v.mesh.remove(v.driverChar.mesh); v.driverChar = null; v.aiDir = 0; }
                        document.getElementById('vc-alt-badge').classList.toggle('hidden', !(v.vehicleType === 'plane' || v.vehicleType === 'jet'));
                        if (v.isCopCar && wantedStars < 2) { wantedStars = 2; updateHUD(); }
                        showGameToast(`Embarcou: ${v.name}`);
                        break;
                    }
                }
            }
        }

        if (k === 'e') {
            if (inVehicle) {
                for (let g of garages) {
                    if (inVehicle.mesh.position.distanceTo(g.marker.position) < 6.0) {
                        if (playerCash >= 400) {
                            playerCash -= 400; inVehicle.hp = 100; inVehicle.burningTimer = 0; inVehicle.hasNitro = true;
                            if (VCModels.repairCarDent) VCModels.repairCarDent(inVehicle);
                            const newCol = [0xec4899, 0x06b6d4, 0xfacc15, 0xa855f7, 0x10b981][Math.floor(Math.random() * 5)];
                            if (inVehicle.chassis) inVehicle.chassis.material.color.setHex(newCol);
                            wantedStars = 0; updateHUD(); playAmplifiedMoneyChime();
                            showGameToast(`🔧 ${g.name}: Reparado + NITRO [SHIFT]!`);
                        } else showGameToast('⚠️ Precisa de $400!');
                        return;
                    }
                }
                for (let gs of gasStations) {
                    if (!gs.exploded && Math.hypot(inVehicle.mesh.position.x - gs.x, inVehicle.mesh.position.z - gs.z) < 7.0) {
                        if (playerCash >= 80) { playerCash -= 80; inVehicle.hp = 100; inVehicle.hasNitro = true; playAmplifiedMoneyChime(); updateHUD(); showGameToast(`⛽ Abastecido no ${gs.name}! (-$80)`); }
                        else showGameToast('⚠️ Precisa de $80!');
                        return;
                    }
                }
                return;
            }
            if (activeInterior) {
                const room = interiorRooms[activeInterior.type];
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.cx, -40, room.exitZ)) < 3.6) {
                    playerChar.mesh.position.set(activeInterior.extX, 0, activeInterior.extZ);
                    activeInterior = null; clerkSurrendered = false; interior.alarmLight.material.color.setHex(0x334155);
                    showGameToast('Saiu do edifício'); return;
                }
                if (activeInterior.type === 'store' && playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -1.8)) < 3.5 && !activeInterior.robbed) {
                    activeInterior.robbed = true; activeInterior.marker.material.color.setHex(0x52525b); clerkSurrendered = true;
                    playerCash += activeInterior.cash; playAmplifiedMoneyChime(); updateHUD(); triggerStoreRobberyReport(activeInterior); return;
                } else if (activeInterior.type === 'house' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                    playerHealth = 100; playerArmor = 100; playerStamina = 100; wantedStars = 0; updateHUD(); showGameToast('🛏️ Descansou! Vida/Colete 100%.'); return;
                } else if (activeInterior.type === 'gunshop' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                    if (playerCash >= 800) {
                        playerCash -= 800; playerArmor = 100;
                        weapons[3].ammo += 60; weapons[4].ammo += 150; weapons[5].ammo += 24; weapons[6].ammo += 120; grenadeCount += 3;
                        selectVCWeapon(6); updateHUD(); playAmplifiedMoneyChime(); showGameToast('🎖️ Munição e Armas compradas!');
                    } else showGameToast('⚠️ Precisa de $800!');
                    return;
                } else if (activeInterior.type === 'police' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                    playerArmor = 100; weapons[5].ammo += 24; weapons[6].ammo += 90; grenadeCount += 2; wantedStars = Math.min(6, wantedStars + 3); updateHUD(); showGameToast('🚨 Saqueou Arsenal VCPD!'); return;
                } else if (activeInterior.type === 'bank' && !activeInterior.robbed && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 4.0) {
                    activeInterior.robbed = true; activeInterior.marker.material.color.setHex(0x52525b); playerCash += 15000; wantedStars = 5; playAmplifiedMoneyChime(); updateHUD(); showGameToast('🏦 COFRE ARROMBADO! +$15.000!'); return;
                } else if (activeInterior.type === 'diner' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.8) {
                    if (playerCash >= 50) { playerCash -= 50; playerHealth = Math.min(100, playerHealth + 65); playerStamina = 100; playAmplifiedMoneyChime(); updateHUD(); showGameToast('🍔 Comeu Combo Burger! +65 Vida.'); }
                    return;
                } else if (activeInterior.type === 'school' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 4.0) {
                    playerArmor = Math.min(100, playerArmor + 35); updateHUD(); showGameToast('📚 Estudou! +35 Colete.'); return;
                }
                return;
            }
            for (let door of enterableDoors) {
                if (playerChar.mesh.position.distanceTo(door.marker.position) < 4.5) {
                    if (door.type === 'house' && !door.owned) {
                        if (playerCash >= door.price) { playerCash -= door.price; door.owned = true; door.marker.material.color.setHex(0x38bdf8); playAmplifiedMoneyChime(); updateHUD(); showGameToast(`🏠 Comprou ${door.name}!`); }
                        else showGameToast(`⚠️ Custa $${door.price}`);
                        return;
                    }
                    const room = interiorRooms[door.type];
                    if (room) { activeInterior = door; clerkSurrendered = !!door.robbed; playerChar.mesh.position.set(room.cx, -40, room.spawnZ); camYaw = 0; showGameToast(`🚪 Entrou em: ${door.name}`); return; }
                }
            }
            if (playerChar.mesh.position.distanceTo(missionMarker.position) < 4.5) {
                if (missionStage === 1) { missionStage = 2; missionMarker.position.set(-220, 0.12, 220); gpsWaypoint = { x: -220, z: 220 }; wantedStars = Math.min(6, wantedStars + 3); updateHUD(); }
                else { missionStage = 1; missionMarker.position.set(84, 0.12, -42); gpsWaypoint = null; playerCash += 4500; wantedStars = 0; showGameToast('🏆 MISSÃO CONCLUÍDA! +$4.500'); updateHUD(); }
            }
        }
    };

    window.onkeyup = (e) => {
        keys[e.key.toLowerCase()] = false;
        if (e.key === 'Tab') { document.getElementById('vc-weapon-wheel').classList.add('hidden'); lockGameCursor(); }
    };

    const handleMouseDown = (e) => {
        if (isAnyOverlayOpen() || isPlayerDead || isCutsceneActive) return;
        lockGameCursor();
        if (e.button === 2 && !inVehicle && currentWeaponIdx >= 3) { isAiming = true; document.getElementById('vc-crosshair').classList.remove('hidden'); }
        if (e.button === 0 && !inVehicle) { mouseLeftDown = true; performAttack(); }
    };
    mount.addEventListener('mousedown', handleMouseDown);
    canvasEl.addEventListener('mousedown', handleMouseDown);

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) mouseLeftDown = false;
        if (e.button === 2) { isAiming = false; document.getElementById('vc-crosshair').classList.add('hidden'); }
    });

    window.addEventListener('mousemove', (e) => {
        if (isAnyOverlayOpen() || isCutsceneActive) return;
        const locked = (document.pointerLockElement === canvasEl || document.pointerLockElement === mount);
        let moveX = 0, moveY = 0;
        if (locked) { moveX = e.movementX || 0; moveY = e.movementY || 0; }
        else {
            if (lastMouseX !== null && lastMouseY !== null) { moveX = e.clientX - lastMouseX; moveY = e.clientY - lastMouseY; }
            lastMouseX = e.clientX; lastMouseY = e.clientY;
        }
        if (moveX !== 0 || moveY !== 0) {
            const sens = gameSettings.sensitivity;
            const yDir = gameSettings.invertY ? -1 : 1;
            camYaw -= moveX * 0.0055 * sens;
            camPitch = Math.max(-0.65, Math.min(0.85, camPitch + moveY * 0.0045 * sens * yDir));
        }
    });

    function handlePedProvoked(pedObj) {
        if (!pedObj || !pedObj.alive) return;
        if (pedObj.role === 'gang_purple' || pedObj.role === 'gang_green' || pedObj.role === 'thief' || Math.random() < 0.40) {
            pedObj.aggroTarget = 'player'; pedObj.panic = false;
        } else {
            pedObj.panic = true; pedObj.aggroTarget = null;
        }
    }

    function distPointToSegment3D(px, py, pz, x1, y1, z1, x2, y2, z2) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        const lenSq = dx * dx + dy * dy + dz * dz;
        let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy + (pz - z1) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy), pz - (z1 + t * dz));
    }

    function performAttack() {
        if (fireCooldown > 0 || isPlayerDead || inVehicle || isCutsceneActive) return;
        const wpn = weapons[currentWeaponIdx];
        fireCooldown = wpn.rate;

        if (wpn.type === 'melee' || wpn.type === 'knife' || wpn.type === 'bat') {
            playerChar.punchTimer = 14;
            const reach = wpn.type === 'bat' ? 3.4 : 2.8;
            peds.forEach(p => {
                if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < reach) {
                    p.hp -= wpn.dmg; handlePedProvoked(p);
                    spawnParticle(p.char.mesh.position.x, p.char.mesh.position.y + 1.2, p.char.mesh.position.z, 0xef4444, 0.25, 0.08, 18);
                    if (p.hp <= 0) { p.alive = false; p.char.state = 'dead'; dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 85); if (window.VCSoundFX) VCSoundFX.playScream(p.isFemale); }
                }
            });
            copOfficers.forEach(cop => {
                if (cop.alive && playerChar.mesh.position.distanceTo(cop.char.mesh.position) < reach) {
                    cop.hp -= wpn.dmg;
                    spawnParticle(cop.char.mesh.position.x, cop.char.mesh.position.y + 1.2, cop.char.mesh.position.z, 0xef4444, 0.25, 0.08, 18);
                    if (cop.hp <= 0) { cop.alive = false; cop.char.state = 'dead'; dropNPCLoot(cop.char.mesh.position.x, cop.char.mesh.position.z, 165); wantedStars = Math.min(6, wantedStars + 1); updateHUD(); }
                }
            });
            return;
        }

        if (wpn.ammo <= 0) {
            showGameToast(`⚠️ Sem munição para ${wpn.name}! Compre na Ammu-Nation.`);
            return;
        }
        wpn.ammo = Math.max(0, wpn.ammo - 1);
        document.getElementById('vc-ammo').textContent = `${formatAmmoDisplay(wpn)} | 💣${grenadeCount}`;

        playerChar.recoilOffset = 0.22;
        if (window.VCSoundFX) VCSoundFX.playGunshot(wpn.type === 'm4' ? 'uzi' : wpn.type);

        if (activeInterior && activeInterior.type === 'store' && !activeInterior.reported) {
            clerkSurrendered = true; triggerStoreRobberyReport(activeInterior);
        }

        const activeModel = weaponModels3D[wpn.type];
        if (activeModel && activeModel.userData.flash) {
            activeModel.userData.flash.visible = true;
            setTimeout(() => { activeModel.userData.flash.visible = false; }, 60);
        }

        const pitchAngle = -camPitch;
        const bulletCount = wpn.type === 'shotgun' ? 5 : 1;

        for (let s = 0; s < bulletCount; s++) {
            const spreadH = wpn.type === 'shotgun' ? (Math.random() - 0.5) * 0.20 : (wpn.type === 'uzi' ? (Math.random() - 0.5) * 0.05 : 0);
            const spreadV = wpn.type === 'shotgun' ? (Math.random() - 0.5) * 0.14 : 0;
            const yaw = camYaw + spreadH;
            const pitch = pitchAngle + spreadV;

            const speed = 2.6;
            const vx = -Math.sin(yaw) * Math.cos(pitch) * speed;
            const vy = Math.sin(pitch) * speed;
            const vz = -Math.cos(yaw) * Math.cos(pitch) * speed;

            const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
            bMesh.position.set(
                playerChar.mesh.position.x - Math.sin(yaw) * 0.6,
                playerChar.mesh.position.y + 1.42,
                playerChar.mesh.position.z - Math.cos(yaw) * 0.6
            );
            scene.add(bMesh);
            bullets.push({ mesh: bMesh, vx, vy, vz, life: 55, dmg: wpn.dmg });
        }

        peds.forEach(p => { if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 30) p.panic = true; });
        if (wantedStars === 0 && Math.random() < 0.5) { wantedStars = 1; updateHUD(); }
    }

    function handleVehicleRunOver(carObj, speedAbs, isPlayerDriving) {
        if (speedAbs < 0.14 || carObj.destroyed || (carObj.altitude || 0) > 2.5) return;
        const carPos = carObj.mesh.position;
        peds.forEach(p => {
            if (!p.alive) return;
            if (Math.abs(p.char.mesh.position.x - carPos.x) < 1.55 && Math.abs(p.char.mesh.position.z - carPos.z) < 2.45) {
                p.alive = false; p.hp = 0; p.char.state = 'dead'; dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 85);
                if (window.VCSoundFX) VCSoundFX.playScream(p.isFemale);
                if (isPlayerDriving && !ridingAsPassenger) { carObj.speed *= 0.84; if (Math.random() < 0.45) { wantedStars = Math.min(6, wantedStars + 1); updateHUD(); } }
            }
        });
        if (!isPlayerDriving && !inVehicle && !activeInterior && !isPlayerDead && !isCutsceneActive) {
            const dx = playerChar.mesh.position.x - carPos.x, dz = playerChar.mesh.position.z - carPos.z;
            if (Math.abs(dx) < 1.5 && Math.abs(dz) < 2.4) {
                moveEntityWithHitbox(playerChar.mesh.position, (dx >= 0 ? 1 : -1) * 2.2, 0, 0.45, null, true, false);
                playerChar.vy = 0.22; applyDamageToPlayer(Math.round(speedAbs * 145), 'runover');
                showGameToast('🚗 CUIDADO! Você foi atropelado!');
            }
        }
    }

    function updateDayNightCycle() {
        const hour = gameMinutes / 60;
        const w = weatherModes[currentWeatherIdx];
        const isNight = (hour >= 19.5 || hour < 6.0);
        const isSunset = (hour >= 16.5 && hour < 19.5) || (hour >= 6.0 && hour < 8.0);
        if (w.rain) { scene.background.setHex(isNight ? 0x05030a : 0x1e293b); scene.fog.color.setHex(isNight ? 0x090614 : 0x334155); hemiLight.intensity = 0.55; sunLight.intensity = 0.40; }
        else if (isNight) { scene.background.setHex(0x090514); scene.fog.color.setHex(0x13092b); hemiLight.intensity = 0.45; sunLight.intensity = 0.35; }
        else if (isSunset) { scene.background.setHex(0x3b0764); scene.fog.color.setHex(0x4c1d95); hemiLight.intensity = 0.95; sunLight.intensity = 1.1; }
        else { scene.background.setHex(0x0284c7); scene.fog.color.setHex(0x38bdf8); hemiLight.intensity = 1.3; sunLight.intensity = 1.45; }
        const lampColor = (isNight || w.rain) ? 0xfef08a : 0x475569;
        streetLamps.forEach(lamp => { if (lamp && lamp.material) lamp.material.color.setHex(lampColor); });
    }

    updateRadioHUD();
    updateHUD();

    let tick = 0;
    const oceanGeoPos = ocean && ocean.geometry ? ocean.geometry.attributes.position : null;

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        tick++;

        if (isCutsceneActive) {
            cutsceneElapsed += 0.016;
            const subEl = document.getElementById('vc-cutscene-sub');
            const titleEl = document.getElementById('vc-cutscene-title');
            const storyEl = document.getElementById('vc-cutscene-story');

            if (playerChar.mesh.position.x < -746) {
                playerChar.mesh.position.x += 0.055;
                playerChar.mesh.position.z += 0.075;
                VCModels.updateHumanAnimation(playerChar, { speed: 0.09, isRunning: false });
            } else {
                VCModels.updateHumanAnimation(playerChar, { speed: 0 });
            }

            if (cutsceneElapsed < 3.5) {
                if (subEl) subEl.textContent = "UMA PRODUÇÃO INDEPENDENTE";
                if (titleEl) titleEl.textContent = "SONS & ÁUDIO BY: BERNARDO";
                if (storyEl) storyEl.textContent = "\"Recém-chegado no Aeroporto Internacional com uma mala e um sonho...\"";
            } else if (cutsceneElapsed < 7.0) {
                if (subEl) subEl.textContent = "ARTE, CENÁRIOS & MODELAGEM 3D";
                if (titleEl) titleEl.textContent = "DESIGN GRÁFICO BY: BERNARDO";
                if (storyEl) storyEl.textContent = "\"As luzes neon de Arcade City aguardam por você.\"";
            } else if (cutsceneElapsed < 10.5) {
                if (subEl) subEl.textContent = "CÓDIGO, FÍSICA & INTELIGÊNCIA ARTIFICIAL";
                if (titleEl) titleEl.textContent = "DESENVOLVIDO BY: BERNARDO";
                if (storyEl) storyEl.textContent = "\"Ruas cheias de oportunidades, perigos e liberdade total.\"";
            } else if (cutsceneElapsed < 15.5) {
                if (!suspensePlayed) { suspensePlayed = true; stopCutsceneSynthMusic(); playSuspenseRiser(); }
                if (subEl) subEl.textContent = "PREPARE-SE...";
                if (titleEl) titleEl.textContent = "ARCADE ZONE GAMES APRESENTA...";
                if (storyEl) storyEl.textContent = "...";
            } else if (cutsceneElapsed < 19.5) {
                if (!titleBoomPlayed) { titleBoomPlayed = true; playTitleImpactBoom(); }
                if (subEl) subEl.textContent = "BEM-VINDO À METRÓPOLE";
                if (titleEl) titleEl.textContent = "GTA ARCADE CITY";
                if (storyEl) storyEl.textContent = "A cidade inteira agora é sua!";
            } else {
                finishOpeningCutscene();
                return;
            }

            const orbitAng = -0.6 + cutsceneElapsed * 0.14;
            camera.position.set(playerChar.mesh.position.x + Math.sin(orbitAng) * 5.2, 2.3 + Math.sin(cutsceneElapsed * 0.5) * 0.3, playerChar.mesh.position.z + Math.cos(orbitAng) * 5.2);
            camera.lookAt(playerChar.mesh.position.x + 1.5, 1.4, playerChar.mesh.position.z + 1.5);
            renderer.render(scene, camera);
            return;
        }

        const wheelOpen = !document.getElementById('vc-weapon-wheel').classList.contains('hidden');
        const timeScale = wheelOpen ? 0.22 : 1.0;
        const timeSec = tick * 0.016 * timeScale;

        if (invulnFrames > 0) invulnFrames--;
        if (fireCooldown > 0) fireCooldown--;

        if (!inVehicle && !isAnyOverlayOpen()) {
            const camKeySpeed = 0.035 * gameSettings.sensitivity;
            if (keys['arrowleft']) camYaw += camKeySpeed;
            if (keys['arrowright']) camYaw -= camKeySpeed;
            if (keys['arrowup']) camPitch = Math.max(-0.65, camPitch - camKeySpeed * 0.7);
            if (keys['arrowdown']) camPitch = Math.min(0.85, camPitch + camKeySpeed * 0.7);
        }

        if ((mouseLeftDown || keys['z']) && !inVehicle && !isPlayerDead && (currentWeaponIdx === 4 || currentWeaponIdx === 6)) {
            performAttack();
        }

        if (isPlayerDead) {
            VCModels.updateHumanAnimation(playerChar, { speed: 0 });
            wastedTimer--;
            if (wastedTimer <= 0) respawnAtHospital();
            renderer.render(scene, camera);
            return;
        }

        if (activePhoneCall) {
            activePhoneCall.timer--;
            if (activePhoneCall.stage === 'ringing' && activePhoneCall.timer <= 0) {
                activePhoneCall.ringsLeft--;
                if (activePhoneCall.ringsLeft > 0) { playPhoneRingTone(); activePhoneCall.timer = 65; }
                else {
                    activePhoneCall.stage = 'answered'; activePhoneCall.timer = 130;
                    spawnDispatchedVehicle(activePhoneCall.service, playerChar.mesh.position.clone());
                    showGameToast('🗣️ Central atendeu! Veículo a caminho (~20s).');
                }
            } else if (activePhoneCall.stage === 'answered' && activePhoneCall.timer <= 0) {
                playPhoneHangupBeep(); phoneProp3D.visible = false; activePhoneCall = null; selectVCWeapon(currentWeaponIdx);
            }
        }

        for (let i = dispatchedServices.length - 1; i >= 0; i--) {
            const srv = dispatchedServices[i]; const v = srv.vehicle;
            if (!v || v.destroyed) { dispatchedServices.splice(i, 1); continue; }
            if (srv.type === 'taxi' && srv.tripActive && ridingAsPassenger && inVehicle === v) {
                if (!gpsWaypoint) {
                    v.speed = 0; ridingAsPassenger = false; playerChar.mesh.position.set(v.mesh.position.x - 2.5, 0, v.mesh.position.z); playerChar.mesh.visible = true; inVehicle = null;
                    showGameToast('🚕 Táxi chegou ao seu destino!'); dispatchedServices.splice(i, 1); continue;
                }
                const dx = gpsWaypoint.x - v.mesh.position.x, dz = gpsWaypoint.z - v.mesh.position.z;
                if (Math.hypot(dx, dz) < 12) gpsWaypoint = null;
                else {
                    const ang = Math.atan2(-dx, -dz); v.angle = ang; v.mesh.rotation.y = ang; v.speed = 0.62 * timeScale;
                    moveEntityWithHitbox(v.mesh.position, -Math.sin(ang) * v.speed, -Math.cos(ang) * v.speed, 1.35, null, false, false);
                    VCModels.updateCarAnimation(v, v.speed, 0, false);
                }
            } else if (!srv.arrived) {
                const dx = srv.targetX - v.mesh.position.x, dz = srv.targetZ - v.mesh.position.z;
                if (Math.hypot(dx, dz) < 10.0) {
                    srv.arrived = true; v.speed = 0;
                    if (srv.type === 'taxi') showGameToast('🚕 Seu Táxi chegou! Aperte [F] para entrar.');
                    else if (srv.type === 'police') { showGameToast('🚓 Polícia 190 chegou!'); deployCopsFromCar(v); }
                    else showGameToast('🏎️ Seu veículo chegou! Aperte [F] para entrar.');
                } else {
                    const ang = Math.atan2(-dx, -dz); v.angle = ang; v.mesh.rotation.y = ang; v.speed = 0.48 * timeScale;
                    v.mesh.position.x -= Math.sin(ang) * v.speed; v.mesh.position.z -= Math.cos(ang) * v.speed;
                    VCModels.updateCarAnimation(v, v.speed, 0, false);
                }
            }
        }

        if (oceanGeoPos) {
            for (let i = 0; i < oceanGeoPos.count; i++) {
                oceanGeoPos.setZ(i, Math.sin(oceanGeoPos.getX(i) * 0.08 - timeSec * 3.2) * 0.42 + Math.cos(oceanGeoPos.getY(i) * 0.05 + timeSec * 2.0) * 0.25);
            }
            oceanGeoPos.needsUpdate = true;
        }
        if (surfFoam) surfFoam.position.x = 1100 + Math.sin(timeSec * 3.2) * 2.4;
        if (fountain && fountain.spout) fountain.spout.scale.setScalar(0.9 + Math.sin(timeSec * 8) * 0.22);
        clouds.forEach(cl => { cl.position.x += 0.03 * timeScale; if (cl.position.x > 1300) cl.position.x = -1300; });

        const isRaining = weatherModes[currentWeatherIdx].rain && !activeInterior;
        rainGroup.visible = isRaining;
        if (isRaining) {
            const refPos = getPlayerWorldRefPos();
            rainGroup.position.set(refPos.x, refPos.y, refPos.z);
            for (let i = 0; i < rainDrops.length; i++) { rainDrops[i].position.y -= 0.95 * timeScale; if (rainDrops[i].position.y < -2) rainDrops[i].position.y = 38 + Math.random() * 10; }
        }

        animals.forEach(anim => {
            anim.mesh.position.x -= Math.sin(anim.angle) * anim.speed * timeScale;
            anim.mesh.position.z -= Math.cos(anim.angle) * anim.speed * timeScale;
            anim.mesh.rotation.y = anim.angle;
            if (anim.species === 'bird') { anim.angle += 0.012 * timeScale; anim.mesh.position.y = anim.baseY + Math.sin(timeSec * 3 + anim.phase) * 1.5; }
            else if (Math.random() < 0.015) anim.angle += (Math.random() - 0.5) * 1.8;
            VCModels.updateAnimalAnimation(anim, anim.speed * timeScale);
        });

        if (tick % 45 === 0) {
            gameMinutes = (gameMinutes + 1) % 1440;
            const clk = document.getElementById('vc-clock');
            if (clk) clk.textContent = `${String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:${String(gameMinutes % 60).padStart(2, '0')}`;
            if (gameMinutes % 180 === 0) cycleWeather((currentWeatherIdx + 1) % weatherModes.length);
            updateDayNightCycle();
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i]; pt.mesh.position.x += pt.vx * timeScale; pt.mesh.position.y += pt.vy * timeScale; pt.mesh.position.z += pt.vz * timeScale; pt.mesh.scale.multiplyScalar(0.96); pt.life--;
            if (pt.life <= 0) { scene.remove(pt.mesh); particles.splice(i, 1); }
        }

        for (let i = grenades.length - 1; i >= 0; i--) {
            const g = grenades[i]; g.mesh.position.x += g.vx * timeScale; g.mesh.position.y += g.vy * timeScale; g.mesh.position.z += g.vz * timeScale; g.vy -= 0.015 * timeScale;
            if (g.mesh.position.y <= 0.18) { g.mesh.position.y = 0.18; g.vx *= 0.75; g.vz *= 0.75; g.vy = 0; }
            g.timer--;
            if (g.timer <= 0) { triggerExplosion(g.mesh.position, 12, 120); scene.remove(g.mesh); grenades.splice(i, 1); }
        }

        for (let i = droppedPickups.length - 1; i >= 0; i--) {
            const pk = droppedPickups[i]; pk.bobPhase += 0.08 * timeScale; pk.mesh.rotation.y += 0.06 * timeScale; pk.mesh.position.y = 0.34 + Math.sin(pk.bobPhase) * 0.08; pk.life--;
            const collectorPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
            const dist = collectorPos.distanceTo(pk.mesh.position);
            if (dist < 5.5 && dist > 0.1) { pk.mesh.position.x = THREE.MathUtils.lerp(pk.mesh.position.x, collectorPos.x, 0.14); pk.mesh.position.z = THREE.MathUtils.lerp(pk.mesh.position.z, collectorPos.z, 0.14); }
            if (dist < 2.2) {
                if (pk.type === 'cash') { playerCash += pk.value; playAmplifiedMoneyChime(); showGameToast(`💵 +$${pk.value}`); }
                else if (pk.type === 'health') { playerHealth = Math.min(100, playerHealth + 40); showGameToast('❤️ +40 Vida'); }
                else if (pk.type === 'armor') { playerArmor = Math.min(100, playerArmor + 50); showGameToast('🛡️ +50 Colete'); }
                else if (pk.type === 'ammo') { weapons[3].ammo += 20; weapons[4].ammo += 45; weapons[5].ammo += 8; weapons[6].ammo += 35; selectVCWeapon(currentWeaponIdx); showGameToast('🔫 +Munição coletada!'); }
                updateHUD(); pk.life = 0;
            }
            if (pk.life <= 0) { scene.remove(pk.mesh); droppedPickups.splice(i, 1); }
        }

        if (activeInterior) {
            if (activeInterior.type === 'bank') {
                if (interior.bankStaff) interior.bankStaff.forEach(st => VCModels.updateHumanAnimation(st.char, { speed: 0, isTalking: true }));
                if (interior.bankGuards) {
                    interior.bankGuards.forEach(guard => {
                        if (!guard.alive) { VCModels.updateHumanAnimation(guard.char, { speed: 0 }); return; }
                        const dx = playerChar.mesh.position.x - guard.char.mesh.position.x, dz = playerChar.mesh.position.z - guard.char.mesh.position.z;
                        guard.char.mesh.rotation.y = Math.atan2(-dx, -dz);
                        VCModels.updateHumanAnimation(guard.char, { speed: 0, isAiming: isAiming || activeInterior.robbed, hasGun: true });
                        if (isAiming || activeInterior.robbed || wantedStars > 0) {
                            guard.shootCooldown--;
                            if (guard.shootCooldown <= 0) { guard.shootCooldown = 38; if (window.VCSoundFX) VCSoundFX.playGunshot('uzi'); applyDamageToPlayer(8, 'combat'); }
                        }
                    });
                }
            } else if (activeInterior.type === 'school') {
                if (interior.teacherChar) VCModels.updateHumanAnimation(interior.teacherChar, { speed: 0, isTalking: true });
                if (interior.schoolStudents) interior.schoolStudents.forEach(stu => VCModels.updateHumanAnimation(stu.char, { speed: 0, isTalking: Math.random() < 0.05 }));
            } else if (activeInterior.type === 'diner' && interior.dinerWorker) {
                VCModels.updateHumanAnimation(interior.dinerWorker, { speed: 0, isTalking: true });
            }
        }

        if (inVehicle && !ridingAsPassenger) {
            const vType = inVehicle.vehicleType || 'car';
            const isAircraft = (vType === 'plane' || vType === 'jet');
            const isJetSki = (vType === 'jetski');
            const isBike = (vType === 'bike');
            const isWheelie = isBike && (keys['q'] || keys['control']);

            const isNitroActive = !!(inVehicle.hasNitro && keys['shift']);
            const topSpeed = (isNitroActive ? inVehicle.maxSpeed * 1.4 : inVehicle.maxSpeed) * timeScale;
            const accel = (isAircraft ? 0.022 : (isNitroActive ? 0.048 : 0.028)) * timeScale;

            if (keys['w'] || keys['arrowup']) inVehicle.speed = Math.min(topSpeed, inVehicle.speed + accel);
            else if (keys['s'] || keys['arrowdown']) inVehicle.speed = Math.max(isAircraft ? 0 : -0.34 * timeScale, inVehicle.speed - 0.028 * timeScale);
            else inVehicle.speed *= isAircraft ? 0.992 : 0.95;

            let steerInput = 0;
            if (Math.abs(inVehicle.speed) > 0.01) {
                const turn = (inVehicle.speed > 0 ? 0.042 : -0.042) * timeScale;
                if (keys['a'] || keys['arrowleft']) { inVehicle.angle += turn; steerInput = 1; }
                if (keys['d'] || keys['arrowright']) { inVehicle.angle -= turn; steerInput = -1; }
            }

            const dx = -Math.sin(inVehicle.angle) * inVehicle.speed;
            const dz = -Math.cos(inVehicle.angle) * inVehicle.speed;

            if (!isAircraft && stuntRamps) {
                for (let rp of stuntRamps) {
                    if (Math.hypot(inVehicle.mesh.position.x - rp.x, inVehicle.mesh.position.z - rp.z) < rp.radius && Math.abs(inVehicle.speed) > 0.35 && inVehicle.hopY <= 0.1) {
                        inVehicle.hopVy = 0.42; showGameToast('🚀 SALTO STUNT INSANO!'); break;
                    }
                }
            }

            if (isAircraft) {
                if (keys[' '] && inVehicle.speed > 0.40 * timeScale) { inVehicle.altitude = Math.min(220, (inVehicle.altitude || 0) + 0.45 * timeScale); inVehicle.pitchAngle = THREE.MathUtils.lerp(inVehicle.pitchAngle || 0, 0.25, 0.1); }
                else if ((keys['q'] || keys['control']) && (inVehicle.altitude || 0) > 0) { inVehicle.altitude = Math.max(0, (inVehicle.altitude || 0) - 0.45 * timeScale); inVehicle.pitchAngle = THREE.MathUtils.lerp(inVehicle.pitchAngle || 0, -0.22, 0.1); }
                else inVehicle.pitchAngle = THREE.MathUtils.lerp(inVehicle.pitchAngle || 0, 0, 0.1);

                inVehicle.mesh.position.x = Math.max(-2250, Math.min(2250, inVehicle.mesh.position.x + dx));
                inVehicle.mesh.position.z = Math.max(-2250, Math.min(2250, inVehicle.mesh.position.z + dz));
                inVehicle.mesh.position.y = inVehicle.altitude || 0;
                inVehicle.mesh.rotation.y = inVehicle.angle;
                inVehicle.mesh.rotation.x = inVehicle.pitchAngle || 0;
                inVehicle.mesh.rotation.z = steerInput * 0.28;
                const altBadge = document.getElementById('vc-alt-badge');
                if (altBadge) altBadge.textContent = `ALT: ${Math.round(inVehicle.altitude || 0)}m`;
            } else {
                const bumped = checkVehicleBump(inVehicle, inVehicle.mesh.position.x + dx, inVehicle.mesh.position.z + dz, vehicles, copUnits);
                if (bumped) {
                    const impact = Math.abs(inVehicle.speed);
                    if (impact > 0.22 && VCModels.applyCarDent) {
                        VCModels.applyCarDent(inVehicle, impact * 2.2, inVehicle.speed > 0);
                        VCModels.applyCarDent(bumped, impact * 2.5, true);
                        damageVehicle(inVehicle, Math.round(impact * 20));
                    }
                    inVehicle.speed *= -0.35;
                } else {
                    moveEntityWithHitbox(inVehicle.mesh.position, dx, dz, 1.35, null, isJetSki, false);
                }
                inVehicle.mesh.rotation.y = inVehicle.angle;
                if (isJetSki) {
                    inVehicle.mesh.position.y = getOceanWaveHeight(inVehicle.mesh.position.x, inVehicle.mesh.position.z, timeSec);
                    inVehicle.mesh.rotation.x = Math.sin(timeSec * 3.2) * 0.08;
                }
            }

            VCModels.updateCarAnimation(inVehicle, inVehicle.speed, steerInput, isWheelie);
            handleVehicleRunOver(inVehicle, Math.abs(inVehicle.speed), true);

            playerChar.mesh.position.copy(inVehicle.mesh.position);
            if (isBike || isJetSki) {
                playerChar.mesh.visible = true;
                playerChar.mesh.position.y = inVehicle.mesh.position.y + (isBike ? 0.35 : 0.25);
                playerChar.mesh.rotation.y = inVehicle.angle;
                playerChar.bodyContainer.rotation.x = isWheelie ? -0.35 : -0.15;
                playerChar.rightArm.rotation.x = 0.75;
                playerChar.leftArm.rotation.x = 0.75;
                playerChar.leftLeg.rotation.x = 0.55;
                playerChar.rightLeg.rotation.x = 0.55;
            }
        } else if (!inVehicle) {
            const inWater = !activeInterior && isPointInWater(playerChar.mesh.position.x, playerChar.mesh.position.z);
            const wantsSprint = !!keys['shift'] && playerStamina > 2;
            const moveSpeed = (inWater ? (wantsSprint ? 0.25 : 0.13) : (wantsSprint ? 0.34 : 0.16)) * timeScale;

            let moveF = 0, moveR = 0;
            if (keys['w']) moveF += 1;
            if (keys['s']) moveF -= 1;
            if (keys['a']) moveR -= 1;
            if (keys['d']) moveR += 1;

            let currentMoveSpeed = 0;
            if (moveF !== 0 || moveR !== 0) {
                if (wantsSprint) { playerStamina = Math.max(0, playerStamina - 0.32 * timeScale); if (tick % 30 === 0) updateHUD(); }
                else if (playerStamina < 100) playerStamina = Math.min(100, playerStamina + 0.18 * timeScale);

                const forwardX = -Math.sin(camYaw), forwardZ = -Math.cos(camYaw);
                const rightX = Math.cos(camYaw), rightZ = -Math.sin(camYaw);
                let dirX = forwardX * moveF + rightX * moveR, dirZ = forwardZ * moveF + rightZ * moveR;
                const len = Math.hypot(dirX, dirZ);
                dirX /= len; dirZ /= len;

                moveEntityWithHitbox(playerChar.mesh.position, dirX * moveSpeed, dirZ * moveSpeed, 0.48, activeInterior ? activeInterior.type : null, true, false);
                currentMoveSpeed = moveSpeed;
                if (inWater && wantsSprint && tick % 4 === 0) spawnParticle(playerChar.mesh.position.x, 0.25, playerChar.mesh.position.z, 0xe0f2fe, 0.25, 0.06, 16);
                if (!isAiming) playerChar.mesh.rotation.y = Math.atan2(-dirX, -dirZ);
            } else if (playerStamina < 100) {
                playerStamina = Math.min(100, playerStamina + 0.28 * timeScale);
                if (tick % 30 === 0) updateHUD();
            }

            if (isAiming) playerChar.mesh.rotation.y = camYaw;

            VCModels.updateHumanAnimation(playerChar, {
                speed: currentMoveSpeed,
                isRunning: wantsSprint,
                isAiming: false,
                hasGun: false,
                isSwimming: inWater
            });

            if (activePhoneCall) {
                playerChar.rightArm.rotation.x = Math.PI * 0.78;
                playerChar.rightArm.rotation.z = 0.25;
            } else if (currentWeaponIdx >= 3) {
                playerChar.rightArm.rotation.z = 0;
                playerChar.rightArm.rotation.x = isAiming
                    ? (Math.PI * 0.5 - camPitch) - (playerChar.recoilOffset || 0)
                    : (Math.PI * 0.35) - (playerChar.recoilOffset || 0);
            } else {
                playerChar.rightArm.rotation.z = 0;
            }

            if (wantsSprint && currentMoveSpeed > 0.2 && !inWater) {
                playerChar.bodyContainer.rotation.x = THREE.MathUtils.lerp(playerChar.bodyContainer.rotation.x, -0.18, 0.2);
            }
        } else if (ridingAsPassenger && inVehicle) {
            playerChar.mesh.position.copy(inVehicle.mesh.position);
        }

        vehicles.forEach(v => {
            if (v !== inVehicle && !v.destroyed && v.aiDir !== 0 && !v.isTaxi) {
                const aiSpd = 0.24 * v.aiDir * timeScale;
                v.mesh.position.z += aiSpd;
                VCModels.updateCarAnimation(v, Math.abs(aiSpd), 0, false);
                handleVehicleRunOver(v, Math.abs(aiSpd), false);
                if (v.mesh.position.z > 1350) { v.aiDir = -1; v.mesh.rotation.y = 0; }
                if (v.mesh.position.z < -1350) { v.aiDir = 1; v.mesh.rotation.y = Math.PI; }
            }
        });

        peds.forEach((p, pIdx) => {
            if (!p.alive) { VCModels.updateHumanAnimation(p.char, { speed: 0 }); return; }

            if (p.role === 'thief' && p.stealCooldown !== undefined) {
                p.stealCooldown--;
                if (p.stealCooldown <= 0) {
                    p.stealCooldown = 420;
                    const victim = peds.find(other => other !== p && other.alive && other.role === 'citizen' && other.char.mesh.position.distanceTo(p.char.mesh.position) < 12);
                    if (victim) {
                        victim.panic = true; p.panic = true;
                        if (playerChar.mesh.position.distanceTo(p.char.mesh.position) < 65) { showGameToast('🏃‍♂️💨 Ladrão assaltando na calçada! Polícia acionada.'); spawnCopCar(p.char.mesh.position); }
                    }
                }
            }

            if (p.aggroTarget === 'player' && !activeInterior && !inVehicle) {
                const dx = playerChar.mesh.position.x - p.char.mesh.position.x, dz = playerChar.mesh.position.z - p.char.mesh.position.z;
                const dist = Math.hypot(dx, dz), ang = Math.atan2(-dx, -dz);
                p.char.mesh.rotation.y = ang;
                if (dist > 1.8 && dist < 45) {
                    const spd = 0.17 * timeScale;
                    moveEntityWithHitbox(p.char.mesh.position, -Math.sin(ang) * spd, -Math.cos(ang) * spd, 0.45, null, false, false);
                    VCModels.updateHumanAnimation(p.char, { speed: spd, isRunning: true, hasGun: p.hasGun });
                } else if (dist <= 1.8) {
                    p.char.punchTimer = 10; VCModels.updateHumanAnimation(p.char, { speed: 0, hasGun: p.hasGun });
                    if (tick % 35 === 0) applyDamageToPlayer(6, 'combat');
                }
                return;
            }

            if (p.talkTimer > 0) { p.talkTimer--; VCModels.updateHumanAnimation(p.char, { speed: 0, isTalking: true }); return; }
            else if (!p.panic && tick % 90 === pIdx % 90) {
                const partner = peds.find(other => other !== p && other.alive && !other.panic && other.char.mesh.position.distanceTo(p.char.mesh.position) < 2.6);
                if (partner) {
                    p.talkTimer = 160; partner.talkTimer = 160;
                    p.char.mesh.lookAt(partner.char.mesh.position.x, 0.24, partner.char.mesh.position.z);
                    partner.char.mesh.lookAt(p.char.mesh.position.x, 0.24, p.char.mesh.position.z);
                    return;
                }
            }

            const spd = (p.panic ? 0.20 : 0.055) * timeScale;
            const restrictSidewalk = !p.panic && (p.role === 'citizen');
            const moved = moveEntityWithHitbox(p.char.mesh.position, -Math.sin(p.angle) * spd, -Math.cos(p.angle) * spd, 0.45, null, false, restrictSidewalk);
            if (!moved) p.angle += (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
            p.char.mesh.position.y = isPointOnSidewalk(p.char.mesh.position.x, p.char.mesh.position.z) ? 0.24 : 0;
            p.char.mesh.rotation.y = p.angle;
            VCModels.updateHumanAnimation(p.char, { speed: spd, isRunning: p.panic, hasGun: p.hasGun });
        });

        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            const prevX = b.mesh.position.x, prevY = b.mesh.position.y, prevZ = b.mesh.position.z;
            const nextX = prevX + b.vx * timeScale;
            const nextY = prevY + b.vy * timeScale;
            const nextZ = prevZ + b.vz * timeScale;

            b.mesh.position.set(nextX, nextY, nextZ);
            b.life--;

            if (nextY <= 0.05 || nextY > 180) b.life = 0;

            const activeBoxes = activeInterior ? (interiorColliders[activeInterior.type] || []) : colliders;
            if (b.life > 0 && hitsColliderBox(nextX, nextZ, 0.1, activeBoxes)) b.life = 0;

            if (b.life > 0 && !activeInterior) {
                gasStations.forEach(gs => {
                    if (!gs.exploded && Math.hypot(nextX - gs.x, nextZ - gs.z) < 4.5) {
                        gs.exploded = true; b.life = 0; triggerExplosion(new THREE.Vector3(gs.x, 1, gs.z), 16, 140);
                        showGameToast(`💥 EXPLOSÃO NO ${gs.name.toUpperCase()}!`);
                    }
                });
            }

            if (b.life > 0 && activeInterior && activeInterior.type === 'bank' && interior.bankGuards) {
                interior.bankGuards.forEach(guard => {
                    if (!guard.alive) return;
                    const gx = guard.char.mesh.position.x, gy = guard.char.mesh.position.y + 1.0, gz = guard.char.mesh.position.z;
                    if (distPointToSegment3D(gx, gy, gz, prevX, prevY, prevZ, nextX, nextY, nextZ) < 1.1) {
                        guard.hp -= b.dmg; b.life = 0;
                        spawnParticle(gx, gy + 0.3, gz, 0xef4444, 0.25, 0.08, 16);
                        if (guard.hp <= 0) { guard.alive = false; guard.char.state = 'dead'; dropNPCLoot(gx, gz, 250); }
                    }
                });
            }

            if (b.life > 0 && !activeInterior) {
                for (let p of peds) {
                    if (!p.alive) continue;
                    const px = p.char.mesh.position.x, py = p.char.mesh.position.y + 1.0, pz = p.char.mesh.position.z;
                    if (distPointToSegment3D(px, py, pz, prevX, prevY, prevZ, nextX, nextY, nextZ) < 1.1) {
                        p.hp -= b.dmg; b.life = 0; handlePedProvoked(p);
                        spawnParticle(px, py + 0.3, pz, 0xef4444, 0.25, 0.08, 16);
                        if (p.hp <= 0) {
                            p.alive = false; p.char.state = 'dead'; dropNPCLoot(px, pz, 85);
                            wantedStars = Math.min(6, wantedStars + 1); updateHUD();
                        }
                        break;
                    }
                }
            }

            if (b.life > 0 && !activeInterior) {
                for (let cop of copOfficers) {
                    if (!cop.alive) continue;
                    const cx = cop.char.mesh.position.x, cy = cop.char.mesh.position.y + 1.0, cz = cop.char.mesh.position.z;
                    if (distPointToSegment3D(cx, cy, cz, prevX, prevY, prevZ, nextX, nextY, nextZ) < 1.1) {
                        cop.hp -= b.dmg; b.life = 0;
                        spawnParticle(cx, cy + 0.3, cz, 0xef4444, 0.25, 0.08, 16);
                        if (cop.hp <= 0) {
                            cop.alive = false; cop.char.state = 'dead'; dropNPCLoot(cx, cz, 165);
                            wantedStars = Math.min(6, wantedStars + 1); updateHUD();
                        }
                        break;
                    }
                }
            }

            if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); }
        }

        const targetPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
        copUnits.forEach(cop => {
            if (wantedStars > 0 && !activeInterior && cop !== inVehicle && !cop.destroyed) {
                const dx = targetPos.x - cop.mesh.position.x, dz = targetPos.z - cop.mesh.position.z;
                const dist = Math.hypot(dx, dz), cAng = Math.atan2(-dx, -dz);
                cop.mesh.rotation.y = cAng;
                const flash = Math.floor(tick / 8) % 2 === 0;
                if (cop.sR) cop.sR.visible = flash;
                if (cop.sB) cop.sB.visible = !flash;
                if (dist > 14.5) {
                    const cSpd = (0.30 + (wantedStars * 0.03)) * timeScale;
                    moveEntityWithHitbox(cop.mesh.position, -Math.sin(cAng) * cSpd, -Math.cos(cAng) * cSpd, 1.35, null, false, false);
                    VCModels.updateCarAnimation(cop, cSpd, 0, false);
                } else { VCModels.updateCarAnimation(cop, 0, 0, false); deployCopsFromCar(cop); }
            }
        });

        copOfficers.forEach(cop => {
            if (!cop.alive || activeInterior) return;
            const dx = targetPos.x - cop.char.mesh.position.x, dz = targetPos.z - cop.char.mesh.position.z;
            const dist = Math.hypot(dx, dz), angToPlayer = Math.atan2(-dx, -dz);
            cop.char.mesh.rotation.y = angToPlayer;
            cop.char.rightArm.rotation.x = Math.PI * 0.5;
            if (dist > 11 && dist < 55) {
                const spd = 0.14 * timeScale;
                moveEntityWithHitbox(cop.char.mesh.position, -Math.sin(angToPlayer) * spd, -Math.cos(angToPlayer) * spd, 0.45, null, false, false);
                VCModels.updateHumanAnimation(cop.char, { speed: spd, isRunning: true });
            } else { VCModels.updateHumanAnimation(cop.char, { speed: 0 }); }

            cop.shootCooldown--;
            if (cop.shootCooldown <= 0 && dist < 44) {
                cop.shootCooldown = Math.max(20, 62 - wantedStars * 6);
                const eb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
                eb.position.set(cop.char.mesh.position.x, 1.4, cop.char.mesh.position.z);
                scene.add(eb);
                enemyBullets.push({ mesh: eb, vx: -Math.sin(angToPlayer) * 1.18, vy: 0, vz: -Math.cos(angToPlayer) * 1.18, life: 55, dmg: 8 });
            }
        });

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i]; eb.mesh.position.x += eb.vx * timeScale; eb.mesh.position.z += eb.vz * timeScale; eb.life--;
            if (!activeInterior && eb.mesh.position.distanceTo(targetPos) < 1.5) {
                if (inVehicle) damageVehicle(inVehicle, eb.dmg * 0.7);
                else applyDamageToPlayer(eb.dmg, 'combat');
                eb.life = 0;
            }
            if (eb.life <= 0) { scene.remove(eb.mesh); enemyBullets.splice(i, 1); }
        }

        const promptEl = document.getElementById('vc-action-prompt');
        if (promptEl) {
            let msg = "";
            if (inVehicle) {
                for (let g of garages) { if (inVehicle.mesh.position.distanceTo(g.marker.position) < 6.0) { msg = `Pressione [E] para Reparar + NITRO ($400)`; break; } }
                for (let gs of gasStations) { if (!gs.exploded && Math.hypot(inVehicle.mesh.position.x - gs.x, inVehicle.mesh.position.z - gs.z) < 7.0) { msg = `Pressione [E] para Abastecer ($80)`; break; } }
            } else if (activeInterior) {
                const room = interiorRooms[activeInterior.type];
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.cx, -40, room.exitZ)) < 3.6) msg = `Pressione [E] para SAIR de ${activeInterior.name}`;
                else if (activeInterior.type === 'store' && !activeInterior.robbed && playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -1.8)) < 3.5) msg = `Pressione [E] para ROUBAR O CAIXA ($${activeInterior.cash})`;
                else if (activeInterior.type === 'bank' && !activeInterior.robbed && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 4.0) msg = "Pressione [E] para ARROMBAR O COFRE ($15.000)";
                else if (activeInterior.type === 'diner' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.8) msg = "Pressione [E] para COMER Combo Burger ($50)";
                else if (activeInterior.type === 'school' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 4.0) msg = "Pressione [E] para ESTUDAR (+35 Colete)";
                else if (activeInterior.type === 'house' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) msg = "Pressione [E] para DESCANSAR na cama";
                else if (activeInterior.type === 'gunshop' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) msg = "Pressione [E] para COMPRAR Armas e Munição ($800)";
                else if (activeInterior.type === 'police' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) msg = "Pressione [E] para SAQUEAR Arsenal VCPD";
            } else {
                const allDrivable = [...vehicles, ...copUnits];
                for (let v of allDrivable) { if (!v.destroyed && playerChar.mesh.position.distanceTo(v.mesh.position) < 5.5) { msg = v.isTaxi ? "Pressione [F] para ENTRAR NO TÁXI" : `Pressione [F] para usar ${v.name}`; break; } }
                for (let door of enterableDoors) { if (playerChar.mesh.position.distanceTo(door.marker.position) < 4.5) { msg = (door.type === 'house' && !door.owned) ? `Pressione [E] para COMPRAR ${door.name} ($${door.price})` : `Pressione [E] para ENTRAR em ${door.name}`; break; } }
                if (playerChar.mesh.position.distanceTo(missionMarker.position) < 4.5) msg = "Pressione [E] para iniciar Missão [V]";
            }
            if (msg) { promptEl.textContent = msg; promptEl.classList.remove('hidden'); }
            else promptEl.classList.add('hidden');
        }

        const isAircraft = inVehicle && (inVehicle.vehicleType === 'plane' || inVehicle.vehicleType === 'jet');
        const distCam = activeInterior ? 4.4 : (isAiming ? 3.5 : (isAircraft ? 16.5 : (inVehicle ? 9.8 : 6.4)));
        const baseHeight = activeInterior ? 2.1 : (isAiming ? 1.85 : (isAircraft ? 5.2 : (inVehicle ? 3.4 : 2.3)));
        const sideOffset = isAiming ? 0.95 : 0;

        const horizDist = distCam * Math.cos(camPitch * 0.75);
        const vertOffset = distCam * Math.sin(camPitch);
        const camY = activeInterior ? Math.max(-39.2, Math.min(-34.2, targetPos.y + baseHeight + vertOffset)) : Math.max(0.45, targetPos.y + baseHeight + vertOffset);

        camera.position.lerp(new THREE.Vector3(targetPos.x + Math.sin(camYaw) * horizDist + Math.cos(camYaw) * sideOffset, camY, targetPos.z + Math.cos(camYaw) * horizDist - Math.sin(camYaw) * sideOffset), 0.25);
        camera.lookAt(targetPos.x - Math.sin(camYaw) * 6 + Math.cos(camYaw) * sideOffset, targetPos.y + 1.55 - Math.sin(camPitch) * 6.5, targetPos.z - Math.cos(camYaw) * 6 - Math.sin(camYaw) * sideOffset);

        drawRadar();
        renderer.render(scene, camera);
    }

    gameLoop();
}
