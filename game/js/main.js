// game/js/main.js - Motor AAA Estilo GTA V/VI:
// Configurações em Tempo Real [O] (Volume 200%, Sensibilidade, FOV, Inverter Y, Gráficos),
// Drops Magnéticos de Dinheiro dos NPCs, Interiores Entráveis, Hitboxes 3D,
// Atropelamentos, Vida/Wasted, Explosão de Carros, Nitro, Granadas [G], Rádio [R] e Ciclo Dia/Noite

window.startRockstarIntro = function() {
    const introScreen = document.getElementById('vc-intro-screen');
    const gameHud = document.getElementById('vc-game-hud');

    introScreen.classList.remove('hidden');
    gameHud.classList.add('hidden');

    if (window.VCSoundFX) VCSoundFX.playSynthChord();

    setTimeout(() => {
        introScreen.classList.add('hidden');
        VCLoadingScreen.start(() => {
            gameHud.classList.remove('hidden');
            initViceCityEngine();
        });
    }, 1800);
};

function initViceCityEngine() {
    const mount = document.getElementById('vc-canvas-mount');
    mount.innerHTML = '';

    // =========================================================================
    // 1. RENDERIZADOR, CENA, ILUMINAÇÃO DINÂMICA DIA/NOITE E CÂMERA
    // =========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b0764);
    scene.fog = new THREE.FogExp2(0x4c1d95, 0.0044);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const hemiLight = new THREE.HemisphereLight(0xfce7f3, 0x1e1b4b, 1.05);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xf472b6, 1.15);
    sunLight.position.set(80, 120, -60);
    scene.add(sunLight);

    // Luzes dedicadas aos 4 setores de interiores no subsolo (Y = -40)
    [0, 60, 120, 180].forEach(ix => {
        const roomLight = new THREE.PointLight(0xffffff, 1.55, 38);
        roomLight.position.set(ix, -35.2, 0);
        scene.add(roomLight);
    });

    // =========================================================================
    // 2. SISTEMA DE CONFIGURAÇÕES DO JOGO ([O] / [P]) + AMPLIFICADOR DE ÁUDIO
    // =========================================================================
    const gameSettings = {
        volume: 1.0,       // 0.0 a 2.0 (200%)
        sensitivity: 1.0,  // 0.2x a 3.0x
        fov: 60,           // 50 a 95 graus
        invertY: false,
        quality: 'high'
    };

    // Intercepta AudioContext para aplicar o amplificador de volume (até 200%) em todos os sons
    let masterGainNode = null;
    if (window.VCSoundFX && window.VCSoundFX.ctx) {
        try {
            const ctx = window.VCSoundFX.ctx;
            masterGainNode = ctx.createGain();
            masterGainNode.gain.value = gameSettings.volume;
            masterGainNode.connect(ctx.destination);
        } catch (e) {}
    }

    function playAmplifiedMoneyChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = (window.VCSoundFX && window.VCSoundFX.ctx) || new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

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
        } catch (e) {
            if (window.VCSoundFX) VCSoundFX.playCash();
        }
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
            if (masterGainNode) masterGainNode.gain.value = gameSettings.volume;
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

        if (invEl) {
            gameSettings.invertY = invEl.checked;
        }

        if (qualEl) {
            gameSettings.quality = qualEl.value;
            if (gameSettings.quality === 'low') {
                renderer.setPixelRatio(0.75);
                camera.far = 220;
            } else if (gameSettings.quality === 'medium') {
                renderer.setPixelRatio(1.0);
                camera.far = 310;
            } else {
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                camera.far = 420;
            }
            camera.updateProjectionMatrix();
        }
    };

    window.toggleSettingsModal = (forceState) => {
        const modal = document.getElementById('vc-settings-modal');
        if (!modal) return;
        const show = forceState !== undefined ? forceState : modal.classList.contains('hidden');
        modal.classList.toggle('hidden', !show);

        if (show) {
            isAiming = false;
            mouseLeftDown = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
            document.getElementById('vc-lock-hint').classList.add('hidden');
            if (document.pointerLockElement) document.exitPointerLock();
        } else {
            updateGameSettings();
            if (!isAnyOverlayOpen() && document.pointerLockElement !== mount) {
                try { mount.requestPointerLock(); } catch (e) {}
            }
        }
    };

    // =========================================================================
    // 3. CONSTRUÇÃO DO MUNDO E PROTAGONISTA ARTICULADO
    // =========================================================================
    const {
        colliders,
        interiorColliders,
        interiorRooms,
        enterableDoors,
        garages,
        streetLamps,
        missionMarker,
        vehicles,
        peds,
        interior
    } = VCWorld.buildCity(scene);

    const playerChar = VCModels.createHuman3D({
        isPlayer: true,
        customDna: {
            skinHex: '#f1c27d',
            hairColor: 0x1c1917,
            shirtHex: '#06b6d4',
            pantsColor: 0x1e3a8a,
            shoeColor: 0xf8fafc,
            shirtStyle: 'hawaiian',
            accessory: 'none',
            hasBeard: false,
            buildScale: 1.0,
            strideFreq: 1.0,
            armSwingAmp: 0.9
        }
    });
    playerChar.mesh.position.set(45, 0, -15);
    scene.add(playerChar.mesh);

    // Arsenal 3D anexado à mão direita
    const weaponModels3D = {
        pistol: VCModels.createWeapon3D('pistol'),
        uzi: VCModels.createWeapon3D('uzi'),
        shotgun: VCModels.createWeapon3D('shotgun'),
        m4: VCModels.createWeapon3D('shotgun')
    };
    weaponModels3D.m4.scale.set(1.15, 1.15, 1.25);

    Object.values(weaponModels3D).forEach(m => {
        m.visible = false;
        playerChar.handWeaponSocket.add(m);
    });

    // =========================================================================
    // 4. ESTADO GLOBAL DO JOGADOR, VEÍCULOS, RÁDIO E OVERLAYS
    // =========================================================================
    const weapons = [
        { name: "Punhos (Desarmado)", icon: "👊", ammo: "∞", type: "melee", dmg: 32, rate: 16 },
        { name: "Pistola 9mm", icon: "🔫", ammo: 120, type: "pistol", dmg: 38, rate: 10 },
        { name: "Uzi Mac-10", icon: "🧨", ammo: 320, type: "uzi", dmg: 24, rate: 4 },
        { name: "Escopeta Cal.12", icon: "💥", ammo: 48, type: "shotgun", dmg: 48, rate: 22 },
        { name: "Fuzil M4 Carbine", icon: "🎖️", ammo: 240, type: "m4", dmg: 44, rate: 5 }
    ];

    const radioStations = [
        { name: "FLASH FM 80s • ON AIR", color: "#22d3ee" },
        { name: "ARCADE SYNTHWAVE • NEON", color: "#ec4899" },
        { name: "VCPD POLICE SCANNER • 190", color: "#facc15" },
        { name: "RÁDIO DESLIGADO", color: "#71717a" }
    ];

    let currentRadioIdx = 0;
    let currentWeaponIdx = 0;
    let fireCooldown = 0;
    let grenadeCount = 5;

    let playerCash = 3500;
    let playerHealth = 100;
    let playerArmor = 100;
    let isPlayerDead = false;
    let wastedTimer = 0;
    let invulnFrames = 0;

    let wantedStars = 0;
    let wantedDecayTimer = 0;

    let inVehicle = null;
    let isAiming = false;
    let activeInterior = null;
    let clerkSurrendered = false;

    let gpsWaypoint = null;
    let camYaw = 0;
    let camPitch = 0.14;
    let gameMinutes = 17 * 60 + 30;
    let missionStage = 1;

    const bullets = [];
    const enemyBullets = [];
    const grenades = [];
    const particles = [];
    const droppedPickups = [];

    function isAnyOverlayOpen() {
        const mapOpen = !document.getElementById('vc-full-map').classList.contains('hidden');
        const wheelOpen = !document.getElementById('vc-weapon-wheel').classList.contains('hidden');
        const settingsOpen = !document.getElementById('vc-settings-modal').classList.contains('hidden');
        return mapOpen || wheelOpen || settingsOpen;
    }

    mount.onclick = () => {
        if (!isAnyOverlayOpen() && document.pointerLockElement !== mount) {
            try { mount.requestPointerLock(); } catch (e) {}
        }
    };

    document.addEventListener('pointerlockchange', () => {
        const hint = document.getElementById('vc-lock-hint');
        if (hint) {
            const locked = (document.pointerLockElement === mount);
            hint.classList.toggle('hidden', locked || isAnyOverlayOpen());
        }
    });

    function notifySiteDiscount(pct, reason) {
        try {
            window.parent.postMessage({ type: 'ARCADE_GTA_REWARD', discount: pct, reason }, '*');
        } catch (e) {}
    }

    function showGameToast(txt) {
        const el = document.getElementById('vc-toast');
        if (!el) return;
        el.textContent = txt;
        el.classList.remove('hidden');
        clearTimeout(window.vcToastTimer);
        window.vcToastTimer = setTimeout(() => el.classList.add('hidden'), 4000);
    }

    function updateRadioHUD() {
        const el = document.getElementById('vc-radio-name');
        if (!el) return;
        const st = radioStations[currentRadioIdx];
        el.textContent = st.name;
        el.style.color = st.color;
    }

    // =========================================================================
    // 5. MOTOR DE HITBOX 3D (EXTERIOR, INTERIORES, VEÍCULOS E EXPLOSÕES)
    // =========================================================================
    function hitsColliderBox(x, z, radius, boxList) {
        if (!boxList) return false;
        for (let i = 0; i < boxList.length; i++) {
            const b = boxList[i];
            if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
                return true;
            }
        }
        return false;
    }

    function moveEntityWithHitbox(pos, dx, dz, radius, interiorType = null) {
        if (interiorType && interiorRooms[interiorType]) {
            const room = interiorRooms[interiorType];
            const roomBoxes = interiorColliders[interiorType] || [];
            const nx = pos.x + dx;
            const nz = pos.z + dz;

            if (Math.abs(nx - room.cx) < 8.8 && !hitsColliderBox(nx, pos.z, radius, roomBoxes)) {
                pos.x = nx;
            }
            if (nz > -8.6 && nz < 8.8 && !hitsColliderBox(pos.x, nz, radius, roomBoxes)) {
                pos.z = nz;
            }
            return;
        }

        const onBridge = Math.abs(pos.z) < 9.5 || Math.abs(pos.z - 140) < 9.5 || Math.abs(pos.z + 140) < 9.5;
        const nextX = pos.x + dx;
        let blockedX = false;

        if (!onBridge && Math.abs(nextX) < 18.5) blockedX = true;
        if (!blockedX && hitsColliderBox(nextX, pos.z, radius, colliders)) blockedX = true;
        if (!blockedX && Math.abs(nextX) < 205) pos.x = nextX;

        const nextZ = pos.z + dz;
        let blockedZ = false;
        if (hitsColliderBox(pos.x, nextZ, radius, colliders)) blockedZ = true;
        if (!blockedZ && Math.abs(nextZ) < 235) pos.z = nextZ;
    }

    function checkVehicleBump(movingCar, nextX, nextZ, allVehicles, extraCops) {
        const list = [...allVehicles, ...extraCops];
        for (let other of list) {
            if (other === movingCar || other.destroyed) continue;
            const dist = Math.hypot(nextX - other.mesh.position.x, nextZ - other.mesh.position.z);
            if (dist < 3.25) return other;
        }
        return null;
    }

    // =========================================================================
    // 6. PARTÍCULAS, EXPLOSÕES E MAÇOS DE DINHEIRO 3D COM ATRAÇÃO MAGNÉTICA
    // =========================================================================
    function spawnParticle(x, y, z, colorHex, scale = 0.35, vy = 0.08, life = 28) {
        const p = new THREE.Mesh(
            new THREE.BoxGeometry(scale, scale, scale),
            new THREE.MeshBasicMaterial({ color: colorHex })
        );
        p.position.set(x, y, z);
        scene.add(p);
        particles.push({
            mesh: p,
            vx: (Math.random() - 0.5) * 0.14,
            vy: vy + Math.random() * 0.06,
            vz: (Math.random() - 0.5) * 0.14,
            life
        });
    }

    function spawnPickup(x, z, type = 'cash', value = 85) {
        const group = new THREE.Group();
        group.position.set(x, 0.32, z);

        if (type === 'cash') {
            // Maço de notas verdes + cinta dourada + halo brilhante no chão
            const billStack = new THREE.Mesh(
                new THREE.BoxGeometry(0.75, 0.24, 0.42),
                new THREE.MeshBasicMaterial({ color: 0x10b981 })
            );
            const goldBand = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.26, 0.44),
                new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.45, 0.62, 16),
                new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = -0.25;
            group.add(billStack, goldBand, ring);
        } else {
            const colorMap = { health: 0xf43f5e, armor: 0x38bdf8, ammo: 0xfacc15 };
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(0.65, 0.35, 0.45),
                new THREE.MeshBasicMaterial({ color: colorMap[type] || 0x38bdf8 })
            );
            group.add(box);
        }

        scene.add(group);
        droppedPickups.push({ mesh: group, type, value, life: 1500, bobPhase: Math.random() * Math.PI * 2 });
    }

    function dropNPCLoot(x, z, baseCash = 80) {
        // Todo NPC morto dropa maço de dinheiro (e ocasionalmente colete ou kit médico)
        const amount = baseCash + Math.floor(Math.random() * 65);
        spawnPickup(x, z, 'cash', amount);
        if (Math.random() < 0.22) {
            spawnPickup(x + 0.8, z + 0.5, Math.random() < 0.5 ? 'health' : 'armor', 40);
        }
    }

    function triggerExplosion(pos, radius = 11, maxDamage = 110) {
        if (window.VCSoundFX) VCSoundFX.playGunshot('shotgun');

        for (let i = 0; i < 24; i++) {
            const col = i % 2 === 0 ? 0xf97316 : 0xfacc15;
            spawnParticle(
                pos.x + (Math.random() - 0.5) * 2.5,
                pos.y + 0.8 + Math.random() * 1.5,
                pos.z + (Math.random() - 0.5) * 2.5,
                col,
                0.65,
                0.18,
                36
            );
        }

        peds.forEach(p => {
            if (p.alive && p.char.mesh.position.distanceTo(pos) < radius) {
                p.alive = false;
                p.hp = 0;
                p.char.state = 'dead';
                dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 95);
            }
        });

        copOfficers.forEach(cop => {
            if (cop.alive && cop.char.mesh.position.distanceTo(pos) < radius) {
                cop.alive = false;
                cop.hp = 0;
                cop.char.state = 'dead';
                dropNPCLoot(cop.char.mesh.position.x, cop.char.mesh.position.z, 175);
            }
        });

        [...vehicles, ...copUnits].forEach(v => {
            if (!v.destroyed && v.mesh.position.distanceTo(pos) < radius) {
                damageVehicle(v, 70);
            }
        });

        if (!activeInterior && !isPlayerDead) {
            const pPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
            const dist = pPos.distanceTo(pos);
            if (dist < radius) {
                const factor = 1 - (dist / radius);
                applyDamageToPlayer(Math.round(maxDamage * factor), 'explosion');
            }
        }
    }

    function damageVehicle(v, dmg) {
        if (!v || v.destroyed) return;
        v.hp = Math.max(0, (v.hp !== undefined ? v.hp : 100) - dmg);
        if (v.hp <= 0 && !v.burningTimer) {
            v.burningTimer = 140;
            if (v === inVehicle) {
                showGameToast('🔥 MOTOR EM CHAMAS! Aperte [F] para pular antes de explodir!');
            }
        }
    }

    // =========================================================================
    // 7. FORÇA POLICIAL (VIATURAS, DESEMBARQUE ARMADO, SWAT E HELICÓPTEROS)
    // =========================================================================
    const copUnits = [];
    const copOfficers = [];
    const copHelis = [];

    function spawnCopCar(nearPos = null) {
        if (copUnits.length >= 4) return;
        const basePos = nearPos || playerChar.mesh.position;
        const copBuilt = VCModels.createCar3D(0x090d16, true);
        const angleSpawn = Math.random() * Math.PI * 2;
        const sx = Math.max(-195, Math.min(195, basePos.x + Math.cos(angleSpawn) * 44));
        const sz = Math.max(-220, Math.min(220, basePos.z + Math.sin(angleSpawn) * 44));
        copBuilt.mesh.position.set(sx, 0, sz);
        scene.add(copBuilt.mesh);
        copUnits.push({
            ...copBuilt,
            name: 'Viatura VCPD',
            isCopCar: true,
            speed: 0.32,
            maxSpeed: 0.72,
            angle: 0,
            hp: 120,
            burningTimer: 0,
            destroyed: false,
            deployed: false
        });
    }

    function deployCopsFromCar(copCar) {
        if (copCar.deployed || copCar.destroyed) return;
        copCar.deployed = true;
        copCar.doorOpenTimer = 45;

        const isSwat = wantedStars >= 4;
        [-1.9, 1.9].forEach((sideOffset, idx) => {
            const officer = VCModels.createHuman3D({
                isCop: true,
                seed: 700 + idx + (isSwat ? 50 : 0)
            });
            const gun = VCModels.createWeapon3D(isSwat ? 'uzi' : 'pistol');
            officer.handWeaponSocket.add(gun);
            officer.mesh.position.set(
                copCar.mesh.position.x + sideOffset,
                0,
                copCar.mesh.position.z + (idx === 0 ? -1 : 1)
            );
            scene.add(officer.mesh);
            copOfficers.push({
                char: officer,
                alive: true,
                isSwat,
                hp: isSwat ? 110 : 65,
                shootCooldown: 28 + Math.floor(Math.random() * 20)
            });
        });
    }

    function createPoliceHelicopter() {
        const heli = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 1.5, 5.2),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.25 })
        );
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 1.1, 1.8),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 })
        );
        cockpit.position.set(0, -0.1, -2.2);

        const tail = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.45, 4.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        tail.position.set(0, 0.25, 3.8);

        const rotor = new THREE.Mesh(
            new THREE.BoxGeometry(8.8, 0.08, 0.35),
            new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
        );
        rotor.position.set(0, 1.0, 0);

        const spotlight = new THREE.SpotLight(0xffffff, 2.4, 70, Math.PI / 6, 0.4);
        spotlight.position.set(0, -0.8, -1.5);
        heli.add(body, cockpit, tail, rotor, spotlight, spotlight.target);

        return {
            mesh: heli,
            rotor,
            spotlight,
            hp: 180,
            shootCooldown: 50,
            orbitAngle: Math.random() * Math.PI * 2
        };
    }

    function syncPoliceEscalation() {
        const desiredCars = wantedStars >= 4 ? 3 : (wantedStars >= 1 ? Math.min(2, wantedStars) : 0);
        while (copUnits.length < desiredCars) spawnCopCar();

        const desiredHelis = wantedStars >= 5 ? 2 : (wantedStars >= 3 ? 1 : 0);
        while (copHelis.length < desiredHelis) {
            const h = createPoliceHelicopter();
            h.mesh.position.set(playerChar.mesh.position.x + 35, 24, playerChar.mesh.position.z + 35);
            scene.add(h.mesh);
            copHelis.push(h);
            showGameToast('🚁 ALERTA VCPD: Helicóptero da Polícia no ar!');
        }

        if (wantedStars === 0) {
            while (copUnits.length) scene.remove(copUnits.pop().mesh);
            while (copOfficers.length) scene.remove(copOfficers.pop().char.mesh);
            while (copHelis.length) scene.remove(copHelis.pop().mesh);
        }
    }

    // =========================================================================
    // 8. HUD, VIDA/WASTED, ARSENAL, GRANADAS E DENÚNCIA 190
    // =========================================================================
    function updateHUD() {
        document.getElementById('vc-cash').textContent = `$${String(playerCash).padStart(8, '0')}`;
        document.getElementById('vc-health').textContent = Math.max(0, Math.round(playerHealth));
        document.getElementById('vc-armor').textContent = Math.max(0, Math.round(playerArmor));
        document.getElementById('vc-stars').innerHTML =
            `<span class="text-cyan-300">${'★'.repeat(wantedStars)}</span><span class="text-zinc-600">${'☆'.repeat(6 - wantedStars)}</span>`;
        syncPoliceEscalation();
    }

    function applyDamageToPlayer(dmg, cause = 'combat') {
        if (isPlayerDead || invulnFrames > 0) return;

        if (playerArmor > 0) {
            const absorbed = Math.min(playerArmor, dmg);
            playerArmor -= absorbed;
            const leftover = dmg - absorbed;
            if (leftover > 0) playerHealth = Math.max(0, playerHealth - leftover);
        } else {
            playerHealth = Math.max(0, playerHealth - dmg);
        }

        invulnFrames = 12;
        updateHUD();

        if (playerHealth <= 0) {
            triggerPlayerWasted(cause);
        }
    }

    function triggerPlayerWasted(cause) {
        if (isPlayerDead) return;
        isPlayerDead = true;
        wastedTimer = 160;
        isAiming = false;
        document.getElementById('vc-crosshair').classList.add('hidden');

        if (inVehicle) {
            playerChar.mesh.position.set(inVehicle.mesh.position.x - 2.2, 0, inVehicle.mesh.position.z);
            playerChar.mesh.visible = true;
            inVehicle = null;
        }
        playerChar.state = 'dead';
        wantedStars = 0;
        syncPoliceEscalation();

        const msg = cause === 'runover'
            ? '💀 WASTED! Você foi atropelado! (-$250 taxa hospitalar)'
            : (cause === 'explosion'
                ? '💀 WASTED! Você explodiu! (-$250 taxa hospitalar)'
                : '💀 WASTED! Você foi eliminado! (-$250 taxa hospitalar)');
        showGameToast(msg);
        if (window.speakVC) speakVC("Wasted! You are out.", "Eliminado! Você caiu em combate.", 0.8, 0.95);
    }

    function respawnAtHospital() {
        isPlayerDead = false;
        playerChar.state = 'alive';
        playerChar.mesh.rotation.x = 0;
        playerChar.mesh.position.set(45, 0, -15);
        activeInterior = null;
        clerkSurrendered = false;
        playerHealth = 100;
        playerArmor = 50;
        playerCash = Math.max(0, playerCash - 250);
        invulnFrames = 60;
        updateHUD();
        showGameToast('🏥 Alta do Hospital ArcadeCity! Vida restaurada.');
    }

    window.selectVCWeapon = (idx) => {
        if (isPlayerDead || !weapons[idx]) return;
        currentWeaponIdx = idx;
        const wType = weapons[idx].type;
        Object.keys(weaponModels3D).forEach(k => weaponModels3D[k].visible = (k === wType));

        if (wType === 'melee') {
            isAiming = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
        }

        document.getElementById('vc-weapon-icon').textContent = weapons[idx].icon;
        document.getElementById('vc-ammo').textContent = `${weapons[idx].ammo} | 💣${grenadeCount}`;
        document.getElementById('vc-weapon-wheel').classList.add('hidden');
        showGameToast(`Equipado: ${weapons[idx].name}`);

        if (!isAnyOverlayOpen() && document.pointerLockElement !== mount) {
            try { mount.requestPointerLock(); } catch (e) {}
        }
    };

    function throwGrenade() {
        if (grenadeCount <= 0 || inVehicle || isPlayerDead) {
            if (grenadeCount <= 0) showGameToast('⚠️ Sem granadas! Compre na Ammu-Nation.');
            return;
        }
        grenadeCount--;
        const wpn = weapons[currentWeaponIdx];
        document.getElementById('vc-ammo').textContent = `${wpn.ammo} | 💣${grenadeCount}`;

        const gMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.7 })
        );
        gMesh.position.set(playerChar.mesh.position.x, playerChar.mesh.position.y + 1.5, playerChar.mesh.position.z);
        scene.add(gMesh);

        grenades.push({
            mesh: gMesh,
            vx: -Math.sin(camYaw) * 0.42,
            vy: 0.24,
            vz: -Math.cos(camYaw) * 0.42,
            timer: 110
        });
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
        copUnits.forEach((c, idx) => {
            c.mesh.position.set(storeDoor.extX + (idx === 0 ? -7.5 : 7.5), 0, storeDoor.extZ + 11);
            c.deployed = false;
            deployCopsFromCar(c);
        });

        if (window.triggerDynamicDialogue) triggerDynamicDialogue('shop_robbery', 1.3, 1.15);
        if (window.speakVC) {
            speakVC(
                `911 Emergency! Armed robbery reported at ${storeDoor.name}! All VCPD units respond!`,
                `Emergência 190! Assalto denunciado em ${storeDoor.name}! Todas as viaturas VCPD no local!`,
                0.9,
                1.1
            );
        }
        showGameToast(`🚨 DENÚNCIA 190: O atendente denunciou o roubo em ${storeDoor.name}! A polícia cercou a saída!`);
    }

    // =========================================================================
    // 9. MAPA COMPLETO (M) E GPS
    // =========================================================================
    window.toggleFullMap = (forceState) => {
        const mapEl = document.getElementById('vc-full-map');
        if (!mapEl) return;
        const show = forceState !== undefined ? forceState : mapEl.classList.contains('hidden');
        mapEl.classList.toggle('hidden', !show);

        if (show) {
            isAiming = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
            document.getElementById('vc-lock-hint').classList.add('hidden');
            if (document.pointerLockElement) document.exitPointerLock();
            drawBigMap();
        } else {
            if (!isAnyOverlayOpen() && document.pointerLockElement !== mount) {
                try { mount.requestPointerLock(); } catch (e) {}
            }
        }
    };

    window.clearGPSWaypoint = () => {
        gpsWaypoint = null;
        drawBigMap();
        showGameToast('📍 Rota de GPS removida');
    };

    const bigMapCanvas = document.getElementById('vc-bigmap-canvas');
    if (bigMapCanvas) {
        bigMapCanvas.onclick = (e) => {
            const rect = bigMapCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const worldX = ((clickX - 210) / 210) * 240;
            const worldZ = ((clickY - 210) / 210) * 240;
            gpsWaypoint = { x: worldX, z: worldZ };
            drawBigMap();
            showGameToast('📍 Destino marcado! Siga o rastro rosa no minimapa.');
        };
    }

    // =========================================================================
    // 10. CONTROLES DE TECLADO E MOUSE (COM SENSIBILIDADE E EIXO Y INVERTIDO)
    // =========================================================================
    const keys = {};
    let mouseLeftDown = false;

    window.onkeydown = (e) => {
        const k = e.key.toLowerCase();
        keys[k] = true;

        // Tecla [O] ou [P] abre/fecha o Menu de Configurações
        if (k === 'o' || k === 'p') {
            e.preventDefault();
            toggleSettingsModal();
            return;
        }

        if (isPlayerDead) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            const wheel = document.getElementById('vc-weapon-wheel');
            if (wheel.classList.contains('hidden')) {
                isAiming = false;
                document.getElementById('vc-crosshair').classList.add('hidden');
                document.getElementById('vc-lock-hint').classList.add('hidden');
                if (document.pointerLockElement) document.exitPointerLock();
                wheel.classList.remove('hidden');
            }
        }

        if (k === 'm') {
            e.preventDefault();
            toggleFullMap();
        }

        if (k === '1') selectVCWeapon(0);
        if (k === '2') selectVCWeapon(1);
        if (k === '3') selectVCWeapon(2);
        if (k === '4') selectVCWeapon(3);
        if (k === '5') selectVCWeapon(4);

        if (k === 'g') {
            e.preventDefault();
            throwGrenade();
        }

        if (k === 'r') {
            currentRadioIdx = (currentRadioIdx + 1) % radioStations.length;
            updateRadioHUD();
            if (window.VCSoundFX) VCSoundFX.playSynthChord();
            showGameToast(`📻 Rádio: ${radioStations[currentRadioIdx].name}`);
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (!inVehicle && playerChar.yPos <= 0.01 && playerChar.state !== 'dead') {
                playerChar.vy = 0.28;
            }
        }

        if (k === 'h' && inVehicle && window.VCSoundFX) VCSoundFX.playCarHorn();

        if (k === 'f' && !activeInterior) {
            if (inVehicle) {
                inVehicle.doorOpenTimer = 28;
                playerChar.mesh.position.set(inVehicle.mesh.position.x - 2.3, 0, inVehicle.mesh.position.z);
                playerChar.mesh.visible = true;
                inVehicle = null;
                showGameToast('Saiu do veículo');
            } else {
                const allDrivable = [...vehicles, ...copUnits];
                for (let v of allDrivable) {
                    if (!v.destroyed && playerChar.mesh.position.distanceTo(v.mesh.position) < 4.5) {
                        v.doorOpenTimer = 28;
                        inVehicle = v;
                        if (v.angle === undefined) v.angle = v.mesh.rotation.y;
                        if (v.maxSpeed === undefined) v.maxSpeed = 0.72;
                        camYaw = v.angle;
                        playerChar.mesh.visible = false;
                        isAiming = false;
                        document.getElementById('vc-crosshair').classList.add('hidden');
                        if (window.triggerDynamicDialogue) triggerDynamicDialogue('car_theft', 1.15, 1.1);
                        if (v.isCopCar && wantedStars < 2) {
                            wantedStars = 2;
                            updateHUD();
                        }
                        showGameToast(`Dirigindo: ${v.name || 'Viatura VCPD'}${v.hasNitro ? ' (NITRO ATIVO [SHIFT])' : ''}`);
                        break;
                    }
                }
            }
        }

        if (k === 'e') {
            if (inVehicle) {
                for (let g of garages) {
                    if (inVehicle.mesh.position.distanceTo(g.marker.position) < 5.5) {
                        if (playerCash >= 400) {
                            playerCash -= 400;
                            inVehicle.hp = 100;
                            inVehicle.burningTimer = 0;
                            inVehicle.hasNitro = true;
                            const neonColors = [0xec4899, 0x06b6d4, 0xfacc15, 0xa855f7, 0x10b981];
                            const newCol = neonColors[Math.floor(Math.random() * neonColors.length)];
                            if (inVehicle.chassis) inVehicle.chassis.material.color.setHex(newCol);
                            wantedStars = 0;
                            updateHUD();
                            playAmplifiedMoneyChime();
                            showGameToast(`🔧 ${g.name}: Lataria 100%, Nova Pintura, NITRO [SHIFT] instalado e Polícia despistada!`);
                        } else {
                            showGameToast('⚠️ Precisa de $400 para usar a Pay \'n\' Spray!');
                        }
                        return;
                    }
                }
                return;
            }

            if (activeInterior) {
                const room = interiorRooms[activeInterior.type];
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.cx, -40, room.exitZ)) < 3.4) {
                    playerChar.mesh.position.set(activeInterior.extX, 0, activeInterior.extZ);
                    const wasReported = activeInterior.reported;
                    activeInterior = null;
                    clerkSurrendered = false;
                    interior.alarmLight.material.color.setHex(0x334155);
                    showGameToast(wasReported ? '🚨 Alerta! A polícia cercou a saída!' : 'Saiu do edifício');
                    return;
                }

                if (activeInterior.type === 'store') {
                    if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -1.8)) < 3.5 && !activeInterior.robbed) {
                        activeInterior.robbed = true;
                        activeInterior.marker.material.color.setHex(0x52525b);
                        clerkSurrendered = true;
                        playerCash += activeInterior.cash;
                        playAmplifiedMoneyChime();
                        notifySiteDiscount(0.10, `Assalto em ${activeInterior.name}`);
                        showGameToast(`💰 ROUBOU $${activeInterior.cash} DO CAIXA! Fuja pela porta azul!`);
                        updateHUD();
                        triggerStoreRobberyReport(activeInterior);
                        return;
                    }
                } else if (activeInterior.type === 'house') {
                    if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                        playerHealth = 100;
                        playerArmor = 100;
                        wantedStars = 0;
                        if (window.VCSoundFX) VCSoundFX.playSynthChord();
                        updateHUD();
                        showGameToast(`🛏️ Descansou em ${activeInterior.name}: Vida/Colete 100% e Polícia despistada!`);
                        return;
                    }
                } else if (activeInterior.type === 'gunshop') {
                    if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                        if (playerCash >= 800) {
                            playerCash -= 800;
                            playerArmor = 100;
                            weapons[1].ammo += 60;
                            weapons[2].ammo += 150;
                            weapons[3].ammo += 24;
                            weapons[4].ammo += 120;
                            grenadeCount += 3;
                            selectVCWeapon(4);
                            updateHUD();
                            playAmplifiedMoneyChime();
                            showGameToast('🎖️ Pacote Ammu-Nation comprado: Rifle M4, Granadas, Colete 100% e Munição!');
                        } else {
                            showGameToast('⚠️ Precisa de $800 para o Pacote Completo Ammu-Nation!');
                        }
                        return;
                    }
                } else if (activeInterior.type === 'police') {
                    if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                        playerArmor = 100;
                        weapons[3].ammo += 24;
                        weapons[4].ammo += 90;
                        grenadeCount += 2;
                        wantedStars = Math.min(6, wantedStars + 3);
                        updateHUD();
                        if (window.VCSoundFX) VCSoundFX.playPoliceSirenStep(true);
                        showGameToast('🚨 INVADIU O ARSENAL DA VCPD! Colete/Munição no máximo e 3 Estrelas de Procurado!');
                        return;
                    }
                }
                return;
            }

            for (let door of enterableDoors) {
                if (playerChar.mesh.position.distanceTo(door.marker.position) < 4.2) {
                    if (door.type === 'house' && !door.owned) {
                        if (playerCash >= door.price) {
                            playerCash -= door.price;
                            door.owned = true;
                            door.marker.material.color.setHex(0x38bdf8);
                            playAmplifiedMoneyChime();
                            updateHUD();
                            showGameToast(`🏠 VOCÊ COMPROU: ${door.name}! Aperte [E] novamente para entrar.`);
                        } else {
                            showGameToast(`⚠️ Dinheiro insuficiente! ${door.name} custa $${door.price}`);
                        }
                        return;
                    }

                    const room = interiorRooms[door.type];
                    if (room) {
                        activeInterior = door;
                        clerkSurrendered = !!door.robbed;
                        if (door.type === 'store') {
                            interior.alarmLight.material.color.setHex(door.reported ? 0xef4444 : 0x334155);
                        }
                        playerChar.mesh.position.set(room.cx, -40, room.spawnZ);
                        camYaw = 0;

                        if (door.type === 'police' && wantedStars > 0) {
                            showGameToast('🚨 Você entrou na Delegacia VCPD sendo procurado! Cuidado!');
                        } else {
                            showGameToast(`🚪 Entrou em: ${door.name}`);
                        }
                        return;
                    }
                }
            }

            if (playerChar.mesh.position.distanceTo(missionMarker.position) < 4.5) {
                if (missionStage === 1) {
                    missionStage = 2;
                    missionMarker.position.set(-120, 0.12, 126);
                    gpsWaypoint = { x: -120, z: 126 };
                    wantedStars = Math.min(6, wantedStars + 3);
                    document.getElementById('vc-mission-text').textContent = "Siga a linha rosa do GPS até Downtown e despiste a VCPD!";
                    if (window.triggerDynamicDialogue) triggerDynamicDialogue('police_dispatch', 0.85, 1.05);
                    updateHUD();
                } else {
                    missionStage = 1;
                    missionMarker.position.set(45, 0.12, -42);
                    gpsWaypoint = null;
                    playerCash += 4500;
                    wantedStars = 0;
                    if (window.VCSoundFX) VCSoundFX.playSynthChord();
                    notifySiteDiscount(0.15, "Missão ArcadeCity Concluída");
                    document.getElementById('vc-mission-text').textContent = "Missão Concluída! (+15% OFF liberado no site!)";
                    if (window.speakVC) speakVC("Mission passed! Respect plus!", "Missão cumprida! Respeito aumentado!", 0.9, 1.0);
                    showGameToast('🏆 MISSÃO CONCLUÍDA! +$4.500 e 15% OFF!');
                    updateHUD();
                }
            }
        }
    };

    window.onkeyup = (e) => {
        keys[e.key.toLowerCase()] = false;
        if (e.key === 'Tab') {
            document.getElementById('vc-weapon-wheel').classList.add('hidden');
            if (!isAnyOverlayOpen() && document.pointerLockElement !== mount) {
                try { mount.requestPointerLock(); } catch (e) {}
            }
        }
    };

    mount.onmousedown = (e) => {
        if (isAnyOverlayOpen() || isPlayerDead) return;
        if (e.button === 2 && !inVehicle && currentWeaponIdx > 0) {
            isAiming = true;
            document.getElementById('vc-crosshair').classList.remove('hidden');
        }
        if (e.button === 0 && !inVehicle) {
            mouseLeftDown = true;
            performAttack();
        }
    };

    window.onmouseup = (e) => {
        if (e.button === 0) mouseLeftDown = false;
        if (e.button === 2) {
            isAiming = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
        }
    };

    window.onmousemove = (e) => {
        if (document.pointerLockElement === mount && !isAnyOverlayOpen()) {
            const sens = gameSettings.sensitivity;
            const yDir = gameSettings.invertY ? -1 : 1;
            camYaw -= e.movementX * 0.004 * sens;
            camPitch = Math.max(-0.65, Math.min(0.85, camPitch + e.movementY * 0.0038 * sens * yDir));
        }
    };

    function performAttack() {
        if (fireCooldown > 0 || isPlayerDead || inVehicle) return;
        const wpn = weapons[currentWeaponIdx];
        fireCooldown = wpn.rate;

        if (wpn.type === 'melee') {
            playerChar.punchTimer = 14;
            peds.forEach(p => {
                if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 2.8) {
                    p.hp -= wpn.dmg;
                    if (p.hp <= 0) {
                        p.alive = false;
                        p.char.state = 'dead';
                        dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 75);
                        if (window.VCSoundFX) VCSoundFX.playScream(p.isFemale);
                    }
                }
            });
            copOfficers.forEach(cop => {
                if (cop.alive && playerChar.mesh.position.distanceTo(cop.char.mesh.position) < 2.8) {
                    cop.hp -= wpn.dmg;
                    if (cop.hp <= 0) {
                        cop.alive = false;
                        cop.char.state = 'dead';
                        dropNPCLoot(cop.char.mesh.position.x, cop.char.mesh.position.z, 140);
                        wantedStars = Math.min(6, wantedStars + 1);
                        updateHUD();
                    }
                }
            });
            return;
        }

        if (wpn.ammo <= 0) return;
        wpn.ammo--;
        document.getElementById('vc-ammo').textContent = `${wpn.ammo} | 💣${grenadeCount}`;
        playerChar.recoilOffset = 0.28;
        if (window.VCSoundFX) VCSoundFX.playGunshot(wpn.type === 'm4' ? 'uzi' : wpn.type);

        if (activeInterior && activeInterior.type === 'store' && !activeInterior.reported) {
            clerkSurrendered = true;
            triggerStoreRobberyReport(activeInterior);
        }
        if (activeInterior && activeInterior.type === 'police' && wantedStars < 3) {
            wantedStars = 3;
            updateHUD();
        }

        const activeModel = weaponModels3D[wpn.type];
        if (activeModel && activeModel.userData.flash) {
            activeModel.userData.flash.visible = true;
            setTimeout(() => { activeModel.userData.flash.visible = false; }, 60);
        }

        const bulletCount = wpn.type === 'shotgun' ? 4 : 1;
        for (let s = 0; s < bulletCount; s++) {
            const spread = wpn.type === 'shotgun' ? (Math.random() - 0.5) * 0.22 : (wpn.type === 'uzi' ? (Math.random() - 0.5) * 0.06 : 0);
            const bMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6),
                new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            bMesh.rotation.x = Math.PI / 2;
            bMesh.rotation.y = camYaw + spread;
            bMesh.position.set(playerChar.mesh.position.x, playerChar.mesh.position.y + 1.42, playerChar.mesh.position.z);
            scene.add(bMesh);
            bullets.push({ mesh: bMesh, angle: camYaw + spread, life: 55, dmg: wpn.dmg });
        }

        peds.forEach(p => { if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 30) p.panic = true; });
        if (wantedStars === 0 && Math.random() < 0.5) {
            wantedStars = 1;
            updateHUD();
        }
    }

    // =========================================================================
    // 11. ATROPELAMENTOS REALISTAS (CARROS <-> PEDESTRES <-> POLICIAIS <-> PLAYER)
    // =========================================================================
    function handleVehicleRunOver(carObj, speedAbs, isPlayerDriving) {
        if (speedAbs < 0.14 || carObj.destroyed) return;
        const carPos = carObj.mesh.position;

        peds.forEach(p => {
            if (!p.alive) return;
            if (Math.abs(p.char.mesh.position.x - carPos.x) < 1.55 && Math.abs(p.char.mesh.position.z - carPos.z) < 2.45) {
                p.alive = false;
                p.hp = 0;
                p.char.state = 'dead';
                dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 85);
                if (window.VCSoundFX) VCSoundFX.playScream(p.isFemale);

                if (isPlayerDriving) {
                    carObj.speed *= 0.84;
                    if (Math.random() < 0.45) {
                        wantedStars = Math.min(6, wantedStars + 1);
                        updateHUD();
                    }
                }
            }
        });

        copOfficers.forEach(cop => {
            if (!cop.alive) return;
            if (Math.abs(cop.char.mesh.position.x - carPos.x) < 1.55 && Math.abs(cop.char.mesh.position.z - carPos.z) < 2.45) {
                cop.alive = false;
                cop.hp = 0;
                cop.char.state = 'dead';
                dropNPCLoot(cop.char.mesh.position.x, cop.char.mesh.position.z, 160);
                if (isPlayerDriving) {
                    carObj.speed *= 0.80;
                    wantedStars = Math.min(6, wantedStars + 1);
                    updateHUD();
                }
            }
        });

        if (!isPlayerDriving && !inVehicle && !activeInterior && !isPlayerDead) {
            const dx = playerChar.mesh.position.x - carPos.x;
            const dz = playerChar.mesh.position.z - carPos.z;
            if (Math.abs(dx) < 1.5 && Math.abs(dz) < 2.4) {
                const pushDir = dx >= 0 ? 1 : -1;
                moveEntityWithHitbox(playerChar.mesh.position, pushDir * 2.2, 0, 0.45, null);
                playerChar.vy = 0.22;
                applyDamageToPlayer(Math.round(speedAbs * 145), 'runover');
                showGameToast('🚗 CUIDADO! Você foi atropelado!');
            }
        }
    }

    // =========================================================================
    // 12. CICLO DINÂMICO DE 24 HORAS (DIA, PÔR DO SOL NEON E NOITE)
    // =========================================================================
    function updateDayNightCycle() {
        const hour = gameMinutes / 60;
        const isNight = (hour >= 19.5 || hour < 6.0);
        const isSunset = (hour >= 16.5 && hour < 19.5) || (hour >= 6.0 && hour < 8.0);

        if (isNight) {
            scene.background.setHex(0x090514);
            scene.fog.color.setHex(0x13092b);
            hemiLight.intensity = 0.45;
            sunLight.intensity = 0.35;
        } else if (isSunset) {
            scene.background.setHex(0x3b0764);
            scene.fog.color.setHex(0x4c1d95);
            hemiLight.intensity = 0.95;
            sunLight.intensity = 1.1;
        } else {
            scene.background.setHex(0x0284c7);
            scene.fog.color.setHex(0x38bdf8);
            hemiLight.intensity = 1.3;
            sunLight.intensity = 1.45;
        }

        const lampColor = isNight ? 0xfef08a : 0x475569;
        streetLamps.forEach(lamp => {
            if (lamp && lamp.material) lamp.material.color.setHex(lampColor);
        });
    }

    // =========================================================================
    // 13. RADAR MINIMAPA E MAPA AMPLIADO (M)
    // =========================================================================
    const radarCanvas = document.getElementById('vc-radar');
    const rCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

    function getPlayerWorldRefPos() {
        if (activeInterior) return new THREE.Vector3(activeInterior.extX, 0, activeInterior.extZ);
        if (inVehicle) return inVehicle.mesh.position;
        return playerChar.mesh.position;
    }

    function drawRadar() {
        if (!rCtx) return;
        rCtx.clearRect(0, 0, 112, 112);
        rCtx.fillStyle = '#0f172a';
        rCtx.fillRect(0, 0, 112, 112);

        const ref = getPlayerWorldRefPos();
        const px = ref.x;
        const pz = ref.z;

        rCtx.fillStyle = '#0284c7';
        rCtx.fillRect(56 - (px * 0.45) - 8, 0, 16, 112);

        if (gpsWaypoint) {
            const gx = 56 + (gpsWaypoint.x - px) * 0.45;
            const gz = 56 + (gpsWaypoint.z - pz) * 0.45;
            rCtx.strokeStyle = '#ec4899';
            rCtx.lineWidth = 3;
            rCtx.beginPath();
            rCtx.moveTo(56, 56);
            rCtx.lineTo(gx, gz);
            rCtx.stroke();

            rCtx.fillStyle = '#ec4899';
            rCtx.beginPath();
            rCtx.arc(Math.max(10, Math.min(102, gx)), Math.max(10, Math.min(102, gz)), 4.5, 0, Math.PI * 2);
            rCtx.fill();

            if (Math.hypot(gpsWaypoint.x - px, gpsWaypoint.z - pz) < 10) {
                gpsWaypoint = null;
                showGameToast('📍 Você chegou ao destino marcado!');
            }
        }

        enterableDoors.forEach(d => {
            if (d.type === 'store' && d.robbed) return;
            const colors = { store: '#facc15', house: d.owned ? '#38bdf8' : '#10b981', gunshop: '#f97316', police: '#3b82f6' };
            rCtx.fillStyle = colors[d.type] || '#ffffff';
            rCtx.fillRect(56 + (d.extX - px) * 0.45 - 2.5, 56 + (d.extZ - pz) * 0.45 - 2.5, 5, 5);
        });

        garages.forEach(g => {
            rCtx.fillStyle = '#06b6d4';
            rCtx.fillRect(56 + (g.x - px) * 0.45 - 2.5, 56 + (g.z - pz) * 0.45 - 2.5, 5, 5);
        });

        copOfficers.forEach(cop => {
            if (cop.alive) {
                rCtx.fillStyle = '#ef4444';
                rCtx.fillRect(56 + (cop.char.mesh.position.x - px) * 0.45 - 2, 56 + (cop.char.mesh.position.z - pz) * 0.45 - 2, 4, 4);
            }
        });

        copHelis.forEach(h => {
            rCtx.fillStyle = '#38bdf8';
            rCtx.beginPath();
            rCtx.arc(56 + (h.mesh.position.x - px) * 0.45, 56 + (h.mesh.position.z - pz) * 0.45, 4, 0, Math.PI * 2);
            rCtx.fill();
        });

        const mx = 56 + (missionMarker.position.x - px) * 0.45;
        const mz = 56 + (missionMarker.position.z - pz) * 0.45;
        rCtx.fillStyle = '#f43f5e';
        rCtx.font = 'bold 11px sans-serif';
        rCtx.fillText('V', Math.max(10, Math.min(98, mx)), Math.max(14, Math.min(102, mz)));

        rCtx.fillStyle = '#ffffff';
        rCtx.beginPath();
        rCtx.arc(56, 56, 3.8, 0, Math.PI * 2);
        rCtx.fill();
    }

    function drawBigMap() {
        const bc = document.getElementById('vc-bigmap-canvas');
        if (!bc) return;
        const ctx = bc.getContext('2d');
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 420, 420);

        ctx.fillStyle = '#0284c7'; ctx.fillRect(196, 0, 28, 420);
        ctx.fillStyle = '#fde047'; ctx.fillRect(365, 0, 25, 420);
        ctx.fillStyle = '#06b6d4'; ctx.fillRect(390, 0, 30, 420);

        ctx.fillStyle = '#64748b';
        [-140, 0, 140].forEach(bz => {
            const py = 210 + (bz / 240) * 210;
            ctx.fillRect(194, py - 6, 32, 12);
        });

        const ref = getPlayerWorldRefPos();
        const mapPx = 210 + (ref.x / 240) * 210;
        const mapPz = 210 + (ref.z / 240) * 210;

        if (gpsWaypoint) {
            const gx = 210 + (gpsWaypoint.x / 240) * 210;
            const gz = 210 + (gpsWaypoint.z / 240) * 210;
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.moveTo(mapPx, mapPz);
            ctx.lineTo(gx, gz);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(gx, gz, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        enterableDoors.forEach(d => {
            if (d.type === 'store' && d.robbed) return;
            const colors = { store: '#facc15', house: d.owned ? '#38bdf8' : '#10b981', gunshop: '#f97316', police: '#3b82f6' };
            ctx.fillStyle = colors[d.type] || '#ffffff';
            ctx.fillRect(210 + (d.extX / 240) * 210 - 4, 210 + (d.extZ / 240) * 210 - 4, 8, 8);
        });

        garages.forEach(g => {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(210 + (g.x / 240) * 210 - 4, 210 + (g.z / 240) * 210 - 4, 8, 8);
        });

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('V', 210 + (missionMarker.position.x / 240) * 210 - 4, 210 + (missionMarker.position.z / 240) * 210 + 4);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mapPx, mapPz, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    if (window.speakVC) {
        speakVC(
            "Welcome to ArcadeCity! Press O for settings, G for grenades, and collect cash dropped by NPCs.",
            "Bem-vindo a ArcadeCity! Aperte O para configurações, G para granadas e colete o dinheiro dos NPCs.",
            0.9,
            1.0
        );
    }
    updateRadioHUD();
    updateHUD();

    // =========================================================================
    // 14. LOOP PRINCIPAL DE SIMULAÇÃO (60 FPS)
    // =========================================================================
    let tick = 0;
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        tick++;

        if (invulnFrames > 0) invulnFrames--;
        if (fireCooldown > 0) fireCooldown--;

        if (mouseLeftDown && !inVehicle && !isPlayerDead && (currentWeaponIdx === 2 || currentWeaponIdx === 4)) {
            performAttack();
        }

        if (isPlayerDead) {
            VCModels.updateHumanAnimation(playerChar, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
            wastedTimer--;
            if (wastedTimer <= 0) respawnAtHospital();
            renderer.render(scene, camera);
            return;
        }

        if (tick % 45 === 0 && window.VCSoundFX) VCSoundFX.playAmbientCityTick();

        if (tick % 45 === 0) {
            gameMinutes = (gameMinutes + 1) % 1440;
            const clk = document.getElementById('vc-clock');
            if (clk) {
                clk.textContent = `${String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:${String(gameMinutes % 60).padStart(2, '0')}`;
            }
            updateDayNightCycle();
        }

        if (wantedStars > 0 && !activeInterior) {
            wantedDecayTimer++;
            if (wantedDecayTimer > 1500) {
                wantedStars = Math.max(0, wantedStars - 1);
                wantedDecayTimer = 0;
                updateHUD();
                if (wantedStars === 0) showGameToast('🕶️ Polícia despistada!');
            }
        }

        const hasGun = currentWeaponIdx > 0;
        if (!hasGun) isAiming = false;

        // Partículas
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.mesh.position.x += pt.vx;
            pt.mesh.position.y += pt.vy;
            pt.mesh.position.z += pt.vz;
            pt.mesh.scale.multiplyScalar(0.96);
            pt.life--;
            if (pt.life <= 0) {
                scene.remove(pt.mesh);
                particles.splice(i, 1);
            }
        }

        // Granadas [G]
        for (let i = grenades.length - 1; i >= 0; i--) {
            const g = grenades[i];
            g.mesh.position.x += g.vx;
            g.mesh.position.y += g.vy;
            g.mesh.position.z += g.vz;
            g.vy -= 0.015;
            if (g.mesh.position.y <= 0.18) {
                g.mesh.position.y = 0.18;
                g.vx *= 0.75;
                g.vz *= 0.75;
                g.vy = 0;
            }
            g.timer--;
            if (g.timer <= 0) {
                triggerExplosion(g.mesh.position, 12, 120);
                scene.remove(g.mesh);
                grenades.splice(i, 1);
            }
        }

        // Coleta Magnética de Maços de Dinheiro e Itens Dropados pelos NPCs
        for (let i = droppedPickups.length - 1; i >= 0; i--) {
            const pk = droppedPickups[i];
            pk.bobPhase += 0.08;
            pk.mesh.rotation.y += 0.06;
            pk.mesh.position.y = 0.30 + Math.sin(pk.bobPhase) * 0.08;
            pk.life--;

            const collectorPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
            const dist = collectorPos.distanceTo(pk.mesh.position);

            // Atração magnética quando o jogador chega a menos de 5.5m
            if (dist < 5.5 && dist > 0.1) {
                pk.mesh.position.x = THREE.MathUtils.lerp(pk.mesh.position.x, collectorPos.x, 0.14);
                pk.mesh.position.z = THREE.MathUtils.lerp(pk.mesh.position.z, collectorPos.z, 0.14);
            }

            if (dist < 2.2) {
                if (pk.type === 'cash') {
                    playerCash += pk.value;
                    playAmplifiedMoneyChime();
                    showGameToast(`💵 +$${pk.value} coletado!`);
                } else if (pk.type === 'health') {
                    playerHealth = Math.min(100, playerHealth + 40);
                    playAmplifiedMoneyChime();
                    showGameToast('❤️ +40 Vida recuperada!');
                } else if (pk.type === 'armor') {
                    playerArmor = Math.min(100, playerArmor + 50);
                    playAmplifiedMoneyChime();
                    showGameToast('🛡️ +50 Colete Balístico!');
                }
                updateHUD();
                pk.life = 0;
            }
            if (pk.life <= 0) {
                scene.remove(pk.mesh);
                droppedPickups.splice(i, 1);
            }
        }

        // Animações internas dos NPCs
        if (activeInterior) {
            if (activeInterior.type === 'store') {
                if (activeInterior.reported) {
                    const blink = Math.floor(tick / 10) % 2 === 0;
                    interior.alarmLight.material.color.setHex(blink ? 0xef4444 : 0x7f1d1d);
                }
                if (clerkSurrendered) {
                    interior.clerkChar.leftArm.rotation.x = -Math.PI * 0.92;
                    interior.clerkChar.rightArm.rotation.x = -Math.PI * 0.92;
                } else {
                    VCModels.updateHumanAnimation(interior.clerkChar, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
                    if (isAiming && hasGun && playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -1.8)) < 4.5) {
                        clerkSurrendered = true;
                        triggerStoreRobberyReport(activeInterior);
                    }
                }
            } else if (activeInterior.type === 'gunshop') {
                VCModels.updateHumanAnimation(interior.gunDealerChar, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
            } else if (activeInterior.type === 'police') {
                VCModels.updateHumanAnimation(interior.deskCopChar, { speed: 0, isRunning: false, isAiming: false, hasGun: true });
            }
        }

        // Física de Dano/Fumaça/Explosão de Veículos
        const allVehiclesList = [...vehicles, ...copUnits];
        allVehiclesList.forEach(v => {
            if (v.destroyed) return;
            const hp = v.hp !== undefined ? v.hp : 100;
            if (hp < 45 && tick % 6 === 0) {
                spawnParticle(v.mesh.position.x, 1.1, v.mesh.position.z, hp < 20 ? 0x18181b : 0x64748b, 0.35, 0.08, 24);
            }
            if (v.burningTimer > 0) {
                v.burningTimer--;
                if (tick % 3 === 0) {
                    spawnParticle(v.mesh.position.x, 1.2, v.mesh.position.z, 0xf97316, 0.5, 0.12, 20);
                }
                if (v.burningTimer <= 0) {
                    v.destroyed = true;
                    if (v.chassis) v.chassis.material.color.setHex(0x18181b);
                    if (v === inVehicle) {
                        playerChar.mesh.position.set(v.mesh.position.x - 2.2, 0, v.mesh.position.z);
                        playerChar.mesh.visible = true;
                        inVehicle = null;
                    }
                    triggerExplosion(v.mesh.position, 11, 130);
                }
            }
        });

        // Movimento do Jogador
        if (inVehicle) {
            let steerInput = 0;
            const isNitroActive = !!(inVehicle.hasNitro && keys['shift']);
            const isHandbrake = !!keys[' '];
            const topSpeed = isNitroActive ? inVehicle.maxSpeed * 1.45 : inVehicle.maxSpeed;
            const accel = isNitroActive ? 0.048 : 0.028;

            if (keys['w'] || keys['arrowup']) inVehicle.speed = Math.min(topSpeed, inVehicle.speed + accel);
            else if (keys['s'] || keys['arrowdown']) inVehicle.speed = Math.max(-0.34, inVehicle.speed - 0.028);
            else inVehicle.speed *= isHandbrake ? 0.88 : 0.95;

            if (isNitroActive && Math.abs(inVehicle.speed) > 0.2 && tick % 2 === 0) {
                spawnParticle(
                    inVehicle.mesh.position.x + Math.sin(inVehicle.angle) * 2.1,
                    0.45,
                    inVehicle.mesh.position.z + Math.cos(inVehicle.angle) * 2.1,
                    0x06b6d4,
                    0.28,
                    0.02,
                    14
                );
            }

            if (Math.abs(inVehicle.speed) > 0.01) {
                const turnMult = isHandbrake ? 0.068 : 0.045;
                const turn = inVehicle.speed > 0 ? turnMult : -turnMult;
                if (keys['a'] || keys['arrowleft']) { inVehicle.angle += turn; steerInput = 1; }
                if (keys['d'] || keys['arrowright']) { inVehicle.angle -= turn; steerInput = -1; }
            }

            if (Math.abs(inVehicle.speed) > 0.08 && tick % 8 === 0 && window.VCSoundFX) {
                VCSoundFX.playEnginePulse(Math.abs(inVehicle.speed) / topSpeed, (isHandbrake || Math.abs(steerInput) > 0) && Math.abs(inVehicle.speed) > 0.45);
            }

            const dx = -Math.sin(inVehicle.angle) * inVehicle.speed;
            const dz = -Math.cos(inVehicle.angle) * inVehicle.speed;

            const bumped = checkVehicleBump(inVehicle, inVehicle.mesh.position.x + dx, inVehicle.mesh.position.z + dz, vehicles, copUnits);
            if (bumped) {
                const impact = Math.abs(inVehicle.speed);
                if (impact > 0.25) {
                    damageVehicle(inVehicle, Math.round(impact * 24));
                    damageVehicle(bumped, Math.round(impact * 30));
                }
                inVehicle.speed *= -0.35;
                if (bumped.isCopCar && wantedStars < 1) {
                    wantedStars = 1;
                    updateHUD();
                }
            } else {
                moveEntityWithHitbox(inVehicle.mesh.position, dx, dz, 1.35, null);
            }

            inVehicle.mesh.rotation.y = inVehicle.angle;
            VCModels.updateCarAnimation(inVehicle, inVehicle.speed, steerInput);
            handleVehicleRunOver(inVehicle, Math.abs(inVehicle.speed), true);

            playerChar.mesh.position.copy(inVehicle.mesh.position);
        } else {
            const isRunning = keys['shift'];
            const moveSpeed = isRunning ? 0.30 : 0.16;
            let moveF = 0, moveR = 0;
            if (keys['w'] || keys['arrowup']) moveF += 1;
            if (keys['s'] || keys['arrowdown']) moveF -= 1;
            if (keys['a'] || keys['arrowleft']) moveR -= 1;
            if (keys['d'] || keys['arrowright']) moveR += 1;

            let currentMoveSpeed = 0;
            if (moveF !== 0 || moveR !== 0) {
                const forwardX = -Math.sin(camYaw);
                const forwardZ = -Math.cos(camYaw);
                const rightX = Math.cos(camYaw);
                const rightZ = -Math.sin(camYaw);

                let dirX = forwardX * moveF + rightX * moveR;
                let dirZ = forwardZ * moveF + rightZ * moveR;
                const len = Math.hypot(dirX, dirZ);
                dirX /= len; dirZ /= len;

                moveEntityWithHitbox(
                    playerChar.mesh.position,
                    dirX * moveSpeed,
                    dirZ * moveSpeed,
                    0.48,
                    activeInterior ? activeInterior.type : null
                );
                currentMoveSpeed = moveSpeed;

                if (!isAiming) playerChar.mesh.rotation.y = Math.atan2(-dirX, -dirZ);
            }
            if (isAiming) playerChar.mesh.rotation.y = camYaw;

            VCModels.updateHumanAnimation(playerChar, { speed: currentMoveSpeed, isRunning, isAiming, hasGun });
        }

        // Tráfego Civil NPC
        vehicles.forEach(v => {
            if (v !== inVehicle && !v.destroyed) {
                const aiSpd = 0.22 * v.aiDir;
                const bumped = checkVehicleBump(v, v.mesh.position.x, v.mesh.position.z + aiSpd, vehicles, copUnits);
                if (!bumped) {
                    v.mesh.position.z += aiSpd;
                    VCModels.updateCarAnimation(v, Math.abs(aiSpd), 0);
                    handleVehicleRunOver(v, Math.abs(aiSpd), false);
                }
                if (v.mesh.position.z > 215) { v.aiDir = -1; v.mesh.rotation.y = 0; }
                if (v.mesh.position.z < -215) { v.aiDir = 1; v.mesh.rotation.y = Math.PI; }
            }
        });

        // Pedestres
        peds.forEach(p => {
            if (!p.alive) {
                VCModels.updateHumanAnimation(p.char, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
                return;
            }
            const spd = p.panic ? 0.22 : 0.055;
            const prevX = p.char.mesh.position.x;
            const prevZ = p.char.mesh.position.z;
            moveEntityWithHitbox(p.char.mesh.position, -Math.sin(p.angle) * spd, -Math.cos(p.angle) * spd, 0.45, null);

            if (Math.hypot(p.char.mesh.position.x - prevX, p.char.mesh.position.z - prevZ) < spd * 0.3) {
                p.angle += Math.PI * 0.65;
            }
            p.char.mesh.rotation.y = p.angle;
            VCModels.updateHumanAnimation(p.char, { speed: spd, isRunning: p.panic, isAiming: false, hasGun: false });
            if (Math.abs(p.char.mesh.position.x) > 185 || Math.abs(p.char.mesh.position.z) > 215) p.angle += Math.PI;
        });

        // Projéteis do Jogador
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.mesh.position.x -= Math.sin(b.angle) * 1.85;
            b.mesh.position.z -= Math.cos(b.angle) * 1.85;
            b.life--;

            const activeBoxes = activeInterior ? (interiorColliders[activeInterior.type] || []) : colliders;
            if (hitsColliderBox(b.mesh.position.x, b.mesh.position.z, 0.1, activeBoxes)) {
                b.life = 0;
            }

            if (b.life > 0 && !activeInterior) {
                peds.forEach(p => {
                    if (p.alive && b.mesh.position.distanceTo(p.char.mesh.position) < 1.25) {
                        p.hp -= b.dmg;
                        b.life = 0;
                        if (p.hp <= 0) {
                            p.alive = false; p.char.state = 'dead';
                            dropNPCLoot(p.char.mesh.position.x, p.char.mesh.position.z, 85);
                            wantedStars = Math.min(6, wantedStars + 1);
                            if (window.VCSoundFX) VCSoundFX.playScream(p.isFemale);
                            updateHUD();
                        }
                    }
                });

                copOfficers.forEach(cop => {
                    if (cop.alive && b.mesh.position.distanceTo(cop.char.mesh.position) < 1.3) {
                        cop.hp -= b.dmg;
                        b.life = 0;
                        if (cop.hp <= 0) {
                            cop.alive = false; cop.char.state = 'dead';
                            dropNPCLoot(cop.char.mesh.position.x, cop.char.mesh.position.z, 165);
                            wantedStars = Math.min(6, wantedStars + 1);
                            updateHUD();
                        }
                    }
                });

                allVehiclesList.forEach(v => {
                    if (!v.destroyed && v !== inVehicle && b.mesh.position.distanceTo(v.mesh.position) < 2.2) {
                        damageVehicle(v, b.dmg * 0.65);
                        b.life = 0;
                    }
                });

                copHelis.forEach((h, hIdx) => {
                    if (Math.hypot(b.mesh.position.x - h.mesh.position.x, b.mesh.position.z - h.mesh.position.z) < 3.5) {
                        h.hp -= b.dmg;
                        b.life = 0;
                        if (h.hp <= 0) {
                            triggerExplosion(h.mesh.position, 10, 60);
                            scene.remove(h.mesh);
                            copHelis.splice(hIdx, 1);
                            playerCash += 500;
                            updateHUD();
                            showGameToast('🚁 Helicóptero da VCPD abatido! +$500');
                        }
                    }
                });
            }

            if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); }
        }

        // IA Policial (Viaturas, Desembarque Armado e Helicópteros)
        const targetPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
        if (wantedStars > 0 && !activeInterior && tick % 18 === 0 && window.VCSoundFX) {
            VCSoundFX.playPoliceSirenStep(Math.floor(tick / 18) % 2 === 0);
        }

        copUnits.forEach(cop => {
            if (wantedStars > 0 && !activeInterior && cop !== inVehicle && !cop.destroyed) {
                const dx = targetPos.x - cop.mesh.position.x;
                const dz = targetPos.z - cop.mesh.position.z;
                const dist = Math.hypot(dx, dz);
                const cAng = Math.atan2(-dx, -dz);
                cop.mesh.rotation.y = cAng;

                const flash = Math.floor(tick / 8) % 2 === 0;
                if (cop.sR) cop.sR.visible = flash;
                if (cop.sB) cop.sB.visible = !flash;

                if (dist > 14.5) {
                    const cSpd = 0.29 + (wantedStars * 0.03);
                    moveEntityWithHitbox(cop.mesh.position, -Math.sin(cAng) * cSpd, -Math.cos(cAng) * cSpd, 1.35, null);
                    VCModels.updateCarAnimation(cop, cSpd, 0);
                } else {
                    VCModels.updateCarAnimation(cop, 0, 0);
                    deployCopsFromCar(cop);
                }
            }
        });

        copOfficers.forEach(cop => {
            if (!cop.alive) {
                VCModels.updateHumanAnimation(cop.char, { speed: 0, isRunning: false, isAiming: false, hasGun: true });
                return;
            }
            if (activeInterior) return;

            const dx = targetPos.x - cop.char.mesh.position.x;
            const dz = targetPos.z - cop.char.mesh.position.z;
            const dist = Math.hypot(dx, dz);
            const angToPlayer = Math.atan2(-dx, -dz);
            cop.char.mesh.rotation.y = angToPlayer;

            if (dist > 11 && dist < 55) {
                moveEntityWithHitbox(cop.char.mesh.position, -Math.sin(angToPlayer) * 0.14, -Math.cos(angToPlayer) * 0.14, 0.45, null);
                VCModels.updateHumanAnimation(cop.char, { speed: 0.14, isRunning: true, isAiming: true, hasGun: true });
            } else {
                VCModels.updateHumanAnimation(cop.char, { speed: 0, isRunning: false, isAiming: true, hasGun: true });
            }

            cop.shootCooldown--;
            if (cop.shootCooldown <= 0 && dist < 44) {
                cop.shootCooldown = Math.max(20, 62 - wantedStars * 6);
                cop.char.recoilOffset = 0.25;
                if (window.VCSoundFX) VCSoundFX.playGunshot('pistol');

                const eb = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6),
                    new THREE.MeshBasicMaterial({ color: 0xef4444 })
                );
                eb.rotation.x = Math.PI / 2;
                eb.rotation.y = angToPlayer;
                eb.position.set(cop.char.mesh.position.x, 1.4, cop.char.mesh.position.z);
                scene.add(eb);
                enemyBullets.push({
                    mesh: eb,
                    vx: -Math.sin(angToPlayer) * 1.18,
                    vy: 0,
                    vz: -Math.cos(angToPlayer) * 1.18,
                    life: 55,
                    dmg: cop.isSwat ? 11 : 7
                });
            }
        });

        copHelis.forEach((heli, idx) => {
            heli.rotor.rotation.y += 0.48;
            heli.orbitAngle += 0.015;

            const desiredX = targetPos.x + Math.cos(heli.orbitAngle + idx * Math.PI) * 20;
            const desiredZ = targetPos.z + Math.sin(heli.orbitAngle + idx * Math.PI) * 20;
            heli.mesh.position.x = THREE.MathUtils.lerp(heli.mesh.position.x, desiredX, 0.04);
            heli.mesh.position.z = THREE.MathUtils.lerp(heli.mesh.position.z, desiredZ, 0.04);
            heli.mesh.position.y = 22 + Math.sin(tick * 0.05) * 1.2;

            heli.mesh.lookAt(targetPos.x, 1.5, targetPos.z);
            heli.spotlight.target.position.copy(targetPos);

            if (!activeInterior) {
                heli.shootCooldown--;
                if (heli.shootCooldown <= 0) {
                    heli.shootCooldown = Math.max(20, 52 - wantedStars * 5);
                    if (window.VCSoundFX) VCSoundFX.playGunshot('uzi');

                    const dir = new THREE.Vector3(
                        targetPos.x - heli.mesh.position.x,
                        (targetPos.y + 1.0) - heli.mesh.position.y,
                        targetPos.z - heli.mesh.position.z
                    ).normalize();

                    const hb = new THREE.Mesh(
                        new THREE.SphereGeometry(0.14, 6, 6),
                        new THREE.MeshBasicMaterial({ color: 0xf97316 })
                    );
                    hb.position.copy(heli.mesh.position);
                    scene.add(hb);
                    enemyBullets.push({ mesh: hb, vx: dir.x * 1.38, vy: dir.y * 1.38, vz: dir.z * 1.38, life: 60, dmg: 9 });
                }
            }
        });

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            eb.mesh.position.x += eb.vx;
            eb.mesh.position.y += eb.vy;
            eb.mesh.position.z += eb.vz;
            eb.life--;

            if (!activeInterior && eb.mesh.position.distanceTo(targetPos) < (inVehicle ? 2.4 : 1.15)) {
                if (inVehicle) damageVehicle(inVehicle, eb.dmg * 0.75);
                else applyDamageToPlayer(eb.dmg, 'combat');
                eb.life = 0;
            }
            if (eb.life <= 0) { scene.remove(eb.mesh); enemyBullets.splice(i, 1); }
        }

        // Prompts Contextuais na Tela
        const promptEl = document.getElementById('vc-action-prompt');
        if (promptEl) {
            let msg = "";
            if (inVehicle) {
                for (let g of garages) {
                    if (inVehicle.mesh.position.distanceTo(g.marker.position) < 5.5) {
                        msg = `Pressione [E] para Reparar, Pintar + NITRO na ${g.name} ($400)`;
                        break;
                    }
                }
            } else if (activeInterior) {
                const room = interiorRooms[activeInterior.type];
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(room.cx, -40, room.exitZ)) < 3.4) {
                    msg = `Pressione [E] para SAIR de ${activeInterior.name}`;
                } else if (activeInterior.type === 'store' && !activeInterior.robbed && playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -1.8)) < 3.5) {
                    msg = `Pressione [E] para ROUBAR O CAIXA ($${activeInterior.cash})`;
                } else if (activeInterior.type === 'house' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                    msg = "Pressione [E] para DESCANSAR na cama (Vida/Colete 100% + Limpar Polícia)";
                } else if (activeInterior.type === 'gunshop' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                    msg = "Pressione [E] para COMPRAR Pacote Rifle M4 + Granadas + Colete ($800)";
                } else if (activeInterior.type === 'police' && playerChar.mesh.position.distanceTo(new THREE.Vector3(room.actionX, -40, room.actionZ)) < 3.6) {
                    msg = "Pressione [E] para SAQUEAR Arsenal Policial (+Colete, Munição e +3 Estrelas)";
                }
            } else {
                const allDrivable = [...vehicles, ...copUnits];
                for (let v of allDrivable) {
                    if (!v.destroyed && playerChar.mesh.position.distanceTo(v.mesh.position) < 4.5) {
                        msg = `Pressione [F] para roubar ${v.name || 'Viatura VCPD'}`;
                        break;
                    }
                }
                for (let door of enterableDoors) {
                    if (playerChar.mesh.position.distanceTo(door.marker.position) < 4.2) {
                        if (door.type === 'house' && !door.owned) {
                            msg = `Pressione [E] para COMPRAR ${door.name} ($${door.price})`;
                        } else {
                            msg = `Pressione [E] para ENTRAR em ${door.name}`;
                        }
                        break;
                    }
                }
                if (playerChar.mesh.position.distanceTo(missionMarker.position) < 4.5) {
                    msg = "Pressione [E] para iniciar Missão [V]";
                }
            }

            if (msg) { promptEl.textContent = msg; promptEl.classList.remove('hidden'); }
            else promptEl.classList.add('hidden');
        }

        // Órbita 3D da Câmera
        const distCam = activeInterior ? 4.4 : (isAiming ? 3.5 : (inVehicle ? 9.8 : 6.4));
        const baseHeight = activeInterior ? 2.1 : (isAiming ? 1.85 : (inVehicle ? 3.4 : 2.3));
        const sideOffset = isAiming ? 0.95 : 0;

        const horizDist = distCam * Math.cos(camPitch * 0.75);
        const vertOffset = distCam * Math.sin(camPitch);
        const camY = activeInterior
            ? Math.max(-39.2, Math.min(-34.2, targetPos.y + baseHeight + vertOffset))
            : Math.max(0.45, targetPos.y + baseHeight + vertOffset);

        const desiredCamPos = new THREE.Vector3(
            targetPos.x + Math.sin(camYaw) * horizDist + Math.cos(camYaw) * sideOffset,
            camY,
            targetPos.z + Math.cos(camYaw) * horizDist - Math.sin(camYaw) * sideOffset
        );
        camera.position.lerp(desiredCamPos, 0.25);

        const lookAtY = targetPos.y + 1.55 - Math.sin(camPitch) * 6.5;
        camera.lookAt(
            targetPos.x - Math.sin(camYaw) * 6 + Math.cos(camYaw) * sideOffset,
            lookAtY,
            targetPos.z - Math.cos(camYaw) * 6 - Math.sin(camYaw) * sideOffset
        );

        drawRadar();
        renderer.render(scene, camera);
    }

    gameLoop();
}
