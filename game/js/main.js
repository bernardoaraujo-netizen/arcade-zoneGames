// game/js/main.js - Engine PC Completo: Hitboxes Reais, Atropelamentos, Vida/Wasted,
// Interior de Lojas com Denúncia Policial, Desembarque com Tiroteio e Helicópteros VCPD

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b0764);
    scene.fog = new THREE.FogExp2(0x4c1d95, 0.0046);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 380);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function isAnyOverlayOpen() {
        const mapOpen = !document.getElementById('vc-full-map').classList.contains('hidden');
        const wheelOpen = !document.getElementById('vc-weapon-wheel').classList.contains('hidden');
        return mapOpen || wheelOpen;
    }

    mount.onclick = () => {
        if (!isAnyOverlayOpen() && document.pointerLockElement !== mount) {
            mount.requestPointerLock();
        }
    };

    document.addEventListener('pointerlockchange', () => {
        const hint = document.getElementById('vc-lock-hint');
        if (hint) {
            const locked = (document.pointerLockElement === mount);
            hint.classList.toggle('hidden', locked || isAnyOverlayOpen());
        }
    });

    scene.add(new THREE.HemisphereLight(0xfce7f3, 0x1e1b4b, 1.05));
    const sun = new THREE.DirectionalLight(0xf472b6, 1.15);
    sun.position.set(80, 120, -60);
    scene.add(sun);

    const intLight = new THREE.PointLight(0xffffff, 1.6, 35);
    intLight.position.set(0, -35.5, 0);
    scene.add(intLight);

    const { colliders, interiorColliders, stores, houses, missionMarker, vehicles, peds, interior } = VCWorld.buildCity(scene);

    // Protagonista Humano Articulado
    const playerChar = VCModels.createHuman3D({
        customDna: {
            skinHex: '#f1c27d', hairColor: 0x1c1917, shirtHex: '#06b6d4', pantsColor: 0x1e3a8a,
            shoeColor: 0xf8fafc, shirtStyle: 'hawaiian', accessory: 'none', hasBeard: false,
            buildScale: 1.0, strideFreq: 1.0, armSwingAmp: 0.9, postureTilt: 0
        }
    });
    playerChar.mesh.position.set(45, 0, -15);
    scene.add(playerChar.mesh);

    // Armas 3D na Mão Direita
    const weaponModels3D = {
        pistol: VCModels.createWeapon3D('pistol'),
        uzi: VCModels.createWeapon3D('uzi'),
        shotgun: VCModels.createWeapon3D('shotgun')
    };
    Object.values(weaponModels3D).forEach(m => {
        m.visible = false;
        playerChar.handWeaponSocket.add(m);
    });

    // =========================================================================
    // MOTOR DE HITBOX 3D (AABB + CÍRCULOS + COLISÃO DE VEÍCULOS)
    // =========================================================================
    function hitsColliderBox(x, z, radius, boxList) {
        for (let i = 0; i < boxList.length; i++) {
            const b = boxList[i];
            if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
                return true;
            }
        }
        return false;
    }

    function moveEntityWithHitbox(pos, dx, dz, radius, isInsideStore = false) {
        if (isInsideStore) {
            const nx = pos.x + dx;
            const nz = pos.z + dz;
            if (Math.abs(nx) < 8.6 && !hitsColliderBox(nx, pos.z, radius, interiorColliders)) {
                pos.x = nx;
            }
            if (nz > -7.8 && nz < 8.3 && !hitsColliderBox(pos.x, nz, radius, interiorColliders)) {
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
        const checkList = [...allVehicles, ...extraCops];
        for (let other of checkList) {
            if (other === movingCar) continue;
            const dist = Math.hypot(nextX - other.mesh.position.x, nextZ - other.mesh.position.z);
            if (dist < 3.2) return other;
        }
        return null;
    }

    // =========================================================================
    // SISTEMA DE FORÇA POLICIAL (VIATURAS, DESEMBARQUE, HELICÓPTEROS E DENÚNCIAS)
    // =========================================================================
    const copUnits = [];
    const copOfficers = [];
    const copHelis = [];
    const enemyBullets = [];
    const droppedCash = [];

    function spawnDroppedCash(x, z, amount) {
        const cashMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.14, 0.35),
            new THREE.MeshBasicMaterial({ color: 0x10b981 })
        );
        cashMesh.position.set(x, 0.18, z);
        scene.add(cashMesh);
        droppedCash.push({ mesh: cashMesh, amount, life: 900 });
    }

    function spawnCopCar(nearPos = null) {
        if (copUnits.length >= 4) return;
        const basePos = nearPos || playerChar.mesh.position;
        const copBuilt = VCModels.createCar3D(0x090d16, true);
        const angleSpawn = Math.random() * Math.PI * 2;
        const sx = Math.max(-195, Math.min(195, basePos.x + Math.cos(angleSpawn) * 42));
        const sz = Math.max(-220, Math.min(220, basePos.z + Math.sin(angleSpawn) * 42));
        copBuilt.mesh.position.set(sx, 0, sz);
        scene.add(copBuilt.mesh);
        copUnits.push({ ...copBuilt, speed: 0.32, deployed: false });
    }

    function deployCopsFromCar(copCar) {
        if (copCar.deployed) return;
        copCar.deployed = true;
        copCar.doorOpenTimer = 45;

        [-1.9, 1.9].forEach((sideOffset, idx) => {
            const officer = VCModels.createHuman3D({ isCop: true, seed: 700 + idx });
            const gun = VCModels.createWeapon3D('pistol');
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
                hp: 65,
                shootCooldown: 30 + Math.floor(Math.random() * 25)
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
            new THREE.BoxGeometry(8.5, 0.08, 0.35),
            new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
        );
        rotor.position.set(0, 1.0, 0);

        const spotlight = new THREE.SpotLight(0xffffff, 2.2, 65, Math.PI / 6, 0.4);
        spotlight.position.set(0, -0.8, -1.5);
        heli.add(body, cockpit, tail, rotor, spotlight, spotlight.target);

        return { mesh: heli, rotor, spotlight, shootCooldown: 55, orbitAngle: Math.random() * Math.PI * 2 };
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
    // ARSENAL, ESTADO DE VIDA DO PERSONAGEM E SISTEMA WASTED
    // =========================================================================
    const weapons = [
        { name: "Punhos (Desarmado)", icon: "👊", ammo: "∞", type: "melee" },
        { name: "Pistola 9mm", icon: "🔫", ammo: 96, type: "pistol" },
        { name: "Uzi Mac-10", icon: "🧨", ammo: 280, type: "uzi" },
        { name: "Escopeta", icon: "💥", ammo: 36, type: "shotgun" }
    ];
    let currentWeaponIdx = 0;
    let playerCash = 2000;
    let playerHealth = 100;
    let playerArmor = 100;
    let isPlayerDead = false;
    let wastedTimer = 0;
    let invulnFrames = 0;
    let wantedStars = 0;
    let inVehicle = null;
    let isAiming = false;
    let activeStoreInterior = null;
    let clerkSurrendered = false;
    let storeReportTimer = 0;
    let gpsWaypoint = null;
    let camYaw = 0;
    let camPitch = 0.12;
    let gameMinutes = 17 * 60 + 16;
    let missionStage = 1;
    const bullets = [];

    function notifySiteDiscount(pct, reason) {
        try { window.parent.postMessage({ type: 'ARCADE_GTA_REWARD', discount: pct, reason }, '*'); } catch (e) {}
    }

    function showGameToast(txt) {
        const el = document.getElementById('vc-toast');
        if (!el) return;
        el.textContent = txt;
        el.classList.remove('hidden');
        clearTimeout(window.vcToastTimer);
        window.vcToastTimer = setTimeout(() => el.classList.add('hidden'), 3800);
    }

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

        invulnFrames = 14;
        updateHUD();

        if (playerHealth <= 0) {
            triggerPlayerWasted(cause);
        }
    }

    function triggerPlayerWasted(cause) {
        if (isPlayerDead) return;
        isPlayerDead = true;
        wastedTimer = 150;
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
            : '💀 WASTED! Você foi eliminado! (-$250 taxa hospitalar)';
        showGameToast(msg);
        speakVC("Wasted! You are out.", "Eliminado! Você caiu em combate.", 0.8, 0.95);
    }

    function respawnAtHospital() {
        isPlayerDead = false;
        playerChar.state = 'alive';
        playerChar.mesh.rotation.x = 0;
        playerChar.mesh.position.set(45, 0, -15);
        activeStoreInterior = null;
        clerkSurrendered = false;
        playerHealth = 100;
        playerArmor = 50;
        playerCash = Math.max(0, playerCash - 250);
        invulnFrames = 60;
        updateHUD();
        showGameToast('🏥 Alta do Hospital ArcadeCity! Vida restaurada.');
    }

    window.selectVCWeapon = (idx) => {
        if (isPlayerDead) return;
        currentWeaponIdx = idx;
        const wType = weapons[idx].type;
        Object.keys(weaponModels3D).forEach(k => weaponModels3D[k].visible = (k === wType));

        if (wType === 'melee') {
            isAiming = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
        }

        document.getElementById('vc-weapon-icon').textContent = weapons[idx].icon;
        document.getElementById('vc-ammo').textContent = weapons[idx].ammo;
        document.getElementById('vc-weapon-wheel').classList.add('hidden');
        showGameToast(`Equipado: ${weapons[idx].name}`);

        if (document.pointerLockElement !== mount) {
            try { mount.requestPointerLock(); } catch (e) {}
        }
    };

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
            if (document.pointerLockElement !== mount) {
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

    // Denúncia Policial quando o jogador rouba a loja
    function triggerStoreRobberyReport(storeObj) {
        if (storeObj.reported) return;
        storeObj.reported = true;
        interior.alarmLight.material.color.setHex(0xef4444);

        wantedStars = Math.min(6, Math.max(3, wantedStars + 3));
        updateHUD();

        // Posiciona viaturas e policiais armados na porta de saída da loja esperando o jogador!
        const exitPoint = new THREE.Vector3(storeObj.exitX, 0, storeObj.exitZ);
        while (copUnits.length < 2) spawnCopCar(exitPoint);
        copUnits.forEach((c, idx) => {
            c.mesh.position.set(storeObj.exitX + (idx === 0 ? -7 : 7), 0, storeObj.exitZ + 11);
            c.deployed = false;
            deployCopsFromCar(c);
        });

        triggerDynamicDialogue('shop_robbery', 1.3, 1.15);
        speakVC(
            `911 Emergency! Armed robbery reported at ${storeObj.name}! All VCPD units respond!`,
            `Emergência 190! Assalto à mão armada denunciado em ${storeObj.name}! Todas as viaturas VCPD no local!`,
            0.9,
            1.1
        );
        showGameToast(`🚨 DENÚNCIA 190: O atendente denunciou o roubo em ${storeObj.name}! A polícia cercou a porta!`);
    }

    const keys = {};
    window.onkeydown = (e) => {
        const k = e.key.toLowerCase();
        keys[k] = true;

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

        if (e.code === 'Space') {
            e.preventDefault();
            if (inVehicle && inVehicle.hopY <= 0.01) {
                inVehicle.hopVy = 0.24;
            } else if (!inVehicle && playerChar.yPos <= 0.01 && playerChar.state !== 'dead') {
                playerChar.vy = 0.28;
            }
        }

        if (k === 'h' && inVehicle) VCSoundFX.playCarHorn();

        if (k === 'f' && !activeStoreInterior) {
            if (inVehicle) {
                inVehicle.doorOpenTimer = 28;
                playerChar.mesh.position.set(inVehicle.mesh.position.x - 2.3, 0, inVehicle.mesh.position.z);
                playerChar.mesh.visible = true;
                inVehicle = null;
                showGameToast('Saiu do veículo');
            } else {
                const allDrivable = [...vehicles, ...copUnits];
                for (let v of allDrivable) {
                    if (playerChar.mesh.position.distanceTo(v.mesh.position) < 4.5) {
                        v.doorOpenTimer = 28;
                        inVehicle = v;
                        if (v.angle === undefined) v.angle = v.mesh.rotation.y;
                        if (v.maxSpeed === undefined) v.maxSpeed = 0.72;
                        camYaw = v.angle;
                        playerChar.mesh.visible = false;
                        isAiming = false;
                        document.getElementById('vc-crosshair').classList.add('hidden');
                        triggerDynamicDialogue('car_theft', 1.15, 1.1);
                        if (v.isCopCar && wantedStars < 2) {
                            wantedStars = 2;
                            updateHUD();
                        }
                        showGameToast(`Dirigindo: ${v.name || 'Viatura VCPD'}`);
                        break;
                    }
                }
            }
        }

        if (k === 'e' && !inVehicle) {
            if (activeStoreInterior) {
                // Sair pela porta azul da loja
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, 8.2)) < 3.2) {
                    playerChar.mesh.position.set(activeStoreInterior.exitX, 0, activeStoreInterior.exitZ);
                    const wasReported = activeStoreInterior.reported;
                    activeStoreInterior = null;
                    clerkSurrendered = false;
                    interior.alarmLight.material.color.setHex(0x334155);
                    showGameToast(wasReported ? '🚨 Cuidado! A polícia está na porta da loja!' : 'Saiu da loja');
                    return;
                }
                // Roubar o caixa registradora no balcão
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -2.2)) < 3.4 && !activeStoreInterior.robbed) {
                    activeStoreInterior.robbed = true;
                    activeStoreInterior.marker.material.color.setHex(0x52525b);
                    clerkSurrendered = true;
                    playerCash += activeStoreInterior.cash;
                    VCSoundFX.playCash();
                    notifySiteDiscount(0.10, `Assalto em ${activeStoreInterior.name}`);
                    showGameToast(`💰 ROUBOU $${activeStoreInterior.cash} DO CAIXA! Fuja pela porta azul!`);
                    updateHUD();
                    triggerStoreRobberyReport(activeStoreInterior);
                    return;
                }
                return;
            }

            // Entrar na loja pela porta
            for (let st of stores) {
                if (playerChar.mesh.position.distanceTo(st.marker.position) < 4.5) {
                    activeStoreInterior = st;
                    clerkSurrendered = st.robbed;
                    storeReportTimer = 0;
                    interior.alarmLight.material.color.setHex(st.reported ? 0xef4444 : 0x334155);
                    playerChar.mesh.position.set(0, -40, 6.8);
                    camYaw = 0;
                    showGameToast(`🏪 Entrou em ${st.name} • Vá até o balcão [E] para roubar o caixa!`);
                    return;
                }
            }

            // Comprar ou descansar em casa
            for (let hs of houses) {
                if (playerChar.mesh.position.distanceTo(hs.marker.position) < 4.5) {
                    if (!hs.owned) {
                        if (playerCash >= hs.price) {
                            playerCash -= hs.price;
                            hs.owned = true;
                            hs.marker.material.color.setHex(0x38bdf8);
                            VCSoundFX.playCash();
                            speakVC("Property purchased! This place is yours now.", "Propriedade comprada! Este lugar agora é seu.", 0.95, 1.0);
                            showGameToast(`🏠 VOCÊ COMPROU: ${hs.name}!`);
                            updateHUD();
                        } else {
                            showGameToast(`⚠️ Dinheiro insuficiente! Custa $${hs.price}`);
                        }
                    } else {
                        playerHealth = 100; playerArmor = 100; wantedStars = 0;
                        VCSoundFX.playSynthChord();
                        showGameToast(`🏠 Descansou em ${hs.name}: Vida/Colete 100% e Polícia despistada!`);
                        updateHUD();
                    }
                    return;
                }
            }

            // Missão [V]
            if (playerChar.mesh.position.distanceTo(missionMarker.position) < 4.5) {
                if (missionStage === 1) {
                    missionStage = 2;
                    missionMarker.position.set(-120, 0.12, 126);
                    gpsWaypoint = { x: -120, z: 126 };
                    wantedStars = Math.min(6, wantedStars + 3);
                    document.getElementById('vc-mission-text').textContent = "Siga a linha rosa do GPS até Downtown e despiste a VCPD!";
                    triggerDynamicDialogue('police_dispatch', 0.85, 1.05);
                    updateHUD();
                } else {
                    missionStage = 1;
                    missionMarker.position.set(45, 0.12, -42);
                    gpsWaypoint = null;
                    playerCash += 4500;
                    wantedStars = 0;
                    VCSoundFX.playSynthChord();
                    notifySiteDiscount(0.15, "Missão ArcadeCity Concluída");
                    document.getElementById('vc-mission-text').textContent = "Missão Concluída! (+15% OFF liberado no site!)";
                    speakVC("Mission passed! Respect plus!", "Missão cumprida! Respeito aumentado!", 0.9, 1.0);
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
            performAttack();
        }
    };

    window.onmouseup = (e) => {
        if (e.button === 2) {
            isAiming = false;
            document.getElementById('vc-crosshair').classList.add('hidden');
        }
    };

    window.onmousemove = (e) => {
        if (document.pointerLockElement === mount && !isAnyOverlayOpen()) {
            camYaw -= e.movementX * 0.004;
            camPitch = Math.max(-0.65, Math.min(0.85, camPitch + e.movementY * 0.0038));
        }
    };

    function performAttack() {
        const wpn = weapons[currentWeaponIdx];

        if (wpn.type === 'melee') {
            playerChar.punchTimer = 14;
            peds.forEach(p => {
                if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 2.8) {
                    p.hp -= 30;
                    if (p.hp <= 0) {
                        p.alive = false; p.char.state = 'dead';
                        spawnDroppedCash(p.char.mesh.position.x, p.char.mesh.position.z, 65);
                        VCSoundFX.playScream(p.isFemale);
                        triggerDynamicDialogue('pedestrian_panic', p.isFemale ? 1.35 : 0.95, 1.15);
                    }
                }
            });
            copOfficers.forEach(cop => {
                if (cop.alive && playerChar.mesh.position.distanceTo(cop.char.mesh.position) < 2.8) {
                    cop.hp -= 35;
                    if (cop.hp <= 0) {
                        cop.alive = false; cop.char.state = 'dead';
                        spawnDroppedCash(cop.char.mesh.position.x, cop.char.mesh.position.z, 120);
                        wantedStars = Math.min(6, wantedStars + 1);
                        updateHUD();
                    }
                }
            });
            return;
        }

        if (wpn.ammo <= 0) return;
        wpn.ammo--;
        document.getElementById('vc-ammo').textContent = wpn.ammo;
        playerChar.recoilOffset = 0.28;
        VCSoundFX.playGunshot(wpn.type);

        // Se atirar dentro da loja, o atendente rende-se e denuncia o assalto
        if (activeStoreInterior && !activeStoreInterior.reported) {
            clerkSurrendered = true;
            triggerStoreRobberyReport(activeStoreInterior);
        }

        const activeModel = weaponModels3D[wpn.type];
        if (activeModel && activeModel.userData.flash) {
            activeModel.userData.flash.visible = true;
            setTimeout(() => { activeModel.userData.flash.visible = false; }, 65);
        }

        const bulletCount = wpn.type === 'shotgun' ? 4 : 1;
        const dmgPerBullet = wpn.type === 'shotgun' ? 50 : (wpn.type === 'uzi' ? 25 : 35);

        for (let s = 0; s < bulletCount; s++) {
            const spread = wpn.type === 'shotgun' ? (Math.random() - 0.5) * 0.22 : 0;
            const bMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6),
                new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            bMesh.rotation.x = Math.PI / 2;
            bMesh.rotation.y = camYaw + spread;
            bMesh.position.set(playerChar.mesh.position.x, playerChar.mesh.position.y + 1.42, playerChar.mesh.position.z);
            scene.add(bMesh);
            bullets.push({ mesh: bMesh, angle: camYaw + spread, life: 55, dmg: dmgPerBullet });
        }

        peds.forEach(p => { if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 28) p.panic = true; });
        if (wantedStars === 0 && Math.random() < 0.55) {
            wantedStars = 1;
            triggerDynamicDialogue('police_dispatch', 0.85, 1.1);
            updateHUD();
        }
    }

    // =========================================================================
    // SISTEMA DE ATROPELAMENTO REALISTA (JOGADOR <-> CARROS <-> PEDESTRES)
    // =========================================================================
    function handleVehicleRunOver(carObj, speedAbs, isPlayerDriving) {
        if (speedAbs < 0.14) return;
        const carPos = carObj.mesh.position;

        // 1. Atropelar Pedestres (Hitbox do carro vs Hitbox do pedestre)
        peds.forEach(p => {
            if (!p.alive) return;
            const dx = p.char.mesh.position.x - carPos.x;
            const dz = p.char.mesh.position.z - carPos.z;
            if (Math.abs(dx) < 1.55 && Math.abs(dz) < 2.45) {
                p.alive = false;
                p.hp = 0;
                p.char.state = 'dead';
                spawnDroppedCash(p.char.mesh.position.x, p.char.mesh.position.z, 70);
                VCSoundFX.playScream(p.isFemale);

                if (isPlayerDriving) {
                    carObj.speed *= 0.82;
                    if (Math.random() < 0.45) {
                        wantedStars = Math.min(6, wantedStars + 1);
                        updateHUD();
                    }
                }
            }
        });

        // 2. Atropelar Policiais a pé
        copOfficers.forEach(cop => {
            if (!cop.alive) return;
            const dx = cop.char.mesh.position.x - carPos.x;
            const dz = cop.char.mesh.position.z - carPos.z;
            if (Math.abs(dx) < 1.55 && Math.abs(dz) < 2.45) {
                cop.alive = false;
                cop.hp = 0;
                cop.char.state = 'dead';
                spawnDroppedCash(cop.char.mesh.position.x, cop.char.mesh.position.z, 130);
                if (isPlayerDriving) {
                    carObj.speed *= 0.80;
                    wantedStars = Math.min(6, wantedStars + 1);
                    updateHUD();
                }
            }
        });

        // 3. Atropelar o Jogador se ele estiver a pé na frente de um carro em movimento
        if (!isPlayerDriving && !inVehicle && !activeStoreInterior && !isPlayerDead) {
            const dx = playerChar.mesh.position.x - carPos.x;
            const dz = playerChar.mesh.position.z - carPos.z;
            if (Math.abs(dx) < 1.5 && Math.abs(dz) < 2.4) {
                // Empurra o jogador para o lado e aplica dano de atropelamento
                const pushDir = dx >= 0 ? 1 : -1;
                moveEntityWithHitbox(playerChar.mesh.position, pushDir * 2.2, 0, 0.45, false);
                playerChar.vy = 0.22;
                applyDamageToPlayer(Math.round(speedAbs * 140), 'runover');
                showGameToast('🚗 CUIDADO! Você foi atropelado!');
            }
        }
    }

    const radarCanvas = document.getElementById('vc-radar');
    const rCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

    function drawRadar() {
        if (!rCtx) return;
        rCtx.clearRect(0, 0, 112, 112);
        rCtx.fillStyle = '#0f172a'; rCtx.fillRect(0, 0, 112, 112);

        const px = activeStoreInterior ? activeStoreInterior.x : (inVehicle ? inVehicle.mesh.position.x : playerChar.mesh.position.x);
        const pz = activeStoreInterior ? activeStoreInterior.z : (inVehicle ? inVehicle.mesh.position.z : playerChar.mesh.position.z);

        rCtx.fillStyle = '#0284c7';
        rCtx.fillRect(56 - (px * 0.45) - 8, 0, 16, 112);

        if (gpsWaypoint) {
            const gx = 56 + (gpsWaypoint.x - px) * 0.45;
            const gz = 56 + (gpsWaypoint.z - pz) * 0.45;
            rCtx.strokeStyle = '#ec4899';
            rCtx.lineWidth = 3;
            rCtx.beginPath(); rCtx.moveTo(56, 56); rCtx.lineTo(gx, gz); rCtx.stroke();

            rCtx.fillStyle = '#ec4899';
            rCtx.beginPath(); rCtx.arc(Math.max(10, Math.min(102, gx)), Math.max(10, Math.min(102, gz)), 4.5, 0, Math.PI * 2); rCtx.fill();

            if (Math.hypot(gpsWaypoint.x - px, gpsWaypoint.z - pz) < 10) {
                gpsWaypoint = null;
                showGameToast('📍 Você chegou ao destino marcado!');
            }
        }

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
        rCtx.fillStyle = '#f43f5e'; rCtx.font = 'bold 11px sans-serif';
        rCtx.fillText('V', Math.max(10, Math.min(98, mx)), Math.max(14, Math.min(102, mz)));

        stores.forEach(st => {
            if (!st.robbed) {
                rCtx.fillStyle = '#facc15';
                rCtx.fillRect(56 + (st.x - px) * 0.45 - 2.5, 56 + (st.z - pz) * 0.45 - 2.5, 5, 5);
            }
        });
        houses.forEach(hs => {
            rCtx.fillStyle = hs.owned ? '#38bdf8' : '#10b981';
            rCtx.fillRect(56 + (hs.x - px) * 0.45 - 2.5, 56 + (hs.z - pz) * 0.45 - 2.5, 5, 5);
        });

        rCtx.fillStyle = '#ffffff';
        rCtx.beginPath(); rCtx.arc(56, 56, 3.8, 0, Math.PI * 2); rCtx.fill();
    }

    function drawBigMap() {
        const bc = document.getElementById('vc-bigmap-canvas'); if (!bc) return;
        const ctx = bc.getContext('2d');
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 420, 420);

        ctx.fillStyle = '#0284c7'; ctx.fillRect(196, 0, 28, 420);
        ctx.fillStyle = '#fde047'; ctx.fillRect(365, 0, 25, 420);
        ctx.fillStyle = '#06b6d4'; ctx.fillRect(390, 0, 30, 420);

        ctx.fillStyle = '#64748b';
        [-140, 0, 140].forEach(bz => {
            const py = 210 + (bz / 240) * 210;
            ctx.fillRect(194, py - 6, 32, 12);
        });

        const px = activeStoreInterior ? activeStoreInterior.x : (inVehicle ? inVehicle.mesh.position.x : playerChar.mesh.position.x);
        const pz = activeStoreInterior ? activeStoreInterior.z : (inVehicle ? inVehicle.mesh.position.z : playerChar.mesh.position.z);
        const mapPx = 210 + (px / 240) * 210;
        const mapPz = 210 + (pz / 240) * 210;

        if (gpsWaypoint) {
            const gx = 210 + (gpsWaypoint.x / 240) * 210;
            const gz = 210 + (gpsWaypoint.z / 240) * 210;
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 5]);
            ctx.beginPath(); ctx.moveTo(mapPx, mapPz); ctx.lineTo(gx, gz); ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#ec4899';
            ctx.beginPath(); ctx.arc(gx, gz, 7, 0, Math.PI * 2); ctx.fill();
        }

        stores.forEach(st => {
            if (!st.robbed) {
                ctx.fillStyle = '#facc15';
                ctx.fillRect(210 + (st.x / 240) * 210 - 4, 210 + (st.z / 240) * 210 - 4, 8, 8);
            }
        });

        houses.forEach(hs => {
            ctx.fillStyle = hs.owned ? '#38bdf8' : '#10b981';
            ctx.fillRect(210 + (hs.x / 240) * 210 - 4, 210 + (hs.z / 240) * 210 - 4, 8, 8);
        });

        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('V', 210 + (missionMarker.position.x / 240) * 210 - 4, 210 + (missionMarker.position.z / 240) * 210 + 4);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(mapPx, mapPz, 6, 0, Math.PI * 2); ctx.fill();
    }

    speakVC("Welcome to ArcadeCity! Enter yellow markers to rob stores, or press M for the GPS map.", "Bem-vindo a ArcadeCity! Entre nos pontos amarelos para assaltar lojas ou aperte M para o mapa.", 0.9, 1.0);
    updateHUD();

    let tick = 0;
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        tick++;

        if (invulnFrames > 0) invulnFrames--;

        // Lógica de Wasted (Morte do Personagem)
        if (isPlayerDead) {
            VCModels.updateHumanAnimation(playerChar, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
            wastedTimer--;
            if (wastedTimer <= 0) respawnAtHospital();
            renderer.render(scene, camera);
            return;
        }

        if (tick % 45 === 0) VCSoundFX.playAmbientCityTick();

        if (tick % 60 === 0) {
            gameMinutes = (gameMinutes + 1) % 1440;
            const clk = document.getElementById('vc-clock');
            if (clk) clk.textContent = `${String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:${String(gameMinutes % 60).padStart(2, '0')}`;
        }

        const hasGun = currentWeaponIdx > 0;
        if (!hasGun) isAiming = false;

        // Dinheiro dropado no chão (Coleta automática ao passar por cima)
        for (let i = droppedCash.length - 1; i >= 0; i--) {
            const dc = droppedCash[i];
            dc.mesh.rotation.y += 0.06;
            dc.life--;
            const collectorPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
            if (collectorPos.distanceTo(dc.mesh.position) < 2.5) {
                playerCash += dc.amount;
                VCSoundFX.playCash();
                showGameToast(`💵 +$${dc.amount} coletado!`);
                updateHUD();
                dc.life = 0;
            }
            if (dc.life <= 0) {
                scene.remove(dc.mesh);
                droppedCash.splice(i, 1);
            }
        }

        // Animação e Alarme no Interior da Loja
        if (activeStoreInterior) {
            if (activeStoreInterior.reported) {
                const blink = Math.floor(tick / 10) % 2 === 0;
                interior.alarmLight.material.color.setHex(blink ? 0xef4444 : 0x7f1d1d);
            }
            if (clerkSurrendered) {
                interior.clerkChar.leftArm.rotation.x = -Math.PI * 0.92;
                interior.clerkChar.rightArm.rotation.x = -Math.PI * 0.92;
            } else {
                VCModels.updateHumanAnimation(interior.clerkChar, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
                // Se o jogador apontar arma no balcão, atendente se rende e denuncia!
                if (isAiming && hasGun && playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -2.5)) < 4.5) {
                    clerkSurrendered = true;
                    triggerStoreRobberyReport(activeStoreInterior);
                }
            }
        }

        // Movimento do Jogador (Veículo ou A Pé com Hitbox)
        if (inVehicle) {
            let steerInput = 0;
            if (keys['w'] || keys['arrowup']) inVehicle.speed = Math.min(inVehicle.maxSpeed, inVehicle.speed + 0.028);
            else if (keys['s'] || keys['arrowdown']) inVehicle.speed = Math.max(-0.32, inVehicle.speed - 0.028);
            else inVehicle.speed *= 0.95;

            if (Math.abs(inVehicle.speed) > 0.01) {
                const turn = inVehicle.speed > 0 ? 0.045 : -0.045;
                if (keys['a'] || keys['arrowleft']) { inVehicle.angle += turn; steerInput = 1; }
                if (keys['d'] || keys['arrowright']) { inVehicle.angle -= turn; steerInput = -1; }
            }

            if (Math.abs(inVehicle.speed) > 0.08 && tick % 8 === 0) {
                VCSoundFX.playEnginePulse(Math.abs(inVehicle.speed) / inVehicle.maxSpeed, Math.abs(steerInput) > 0 && Math.abs(inVehicle.speed) > 0.45);
            }

            const dx = -Math.sin(inVehicle.angle) * inVehicle.speed;
            const dz = -Math.cos(inVehicle.angle) * inVehicle.speed;

            // Colisão veículo vs veículo
            const bumped = checkVehicleBump(inVehicle, inVehicle.mesh.position.x + dx, inVehicle.mesh.position.z + dz, vehicles, copUnits);
            if (bumped) {
                inVehicle.speed *= -0.35;
                if (bumped.isCopCar && wantedStars < 1) {
                    wantedStars = 1;
                    updateHUD();
                }
            } else {
                moveEntityWithHitbox(inVehicle.mesh.position, dx, dz, 1.35, false);
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

                moveEntityWithHitbox(playerChar.mesh.position, dirX * moveSpeed, dirZ * moveSpeed, 0.48, !!activeStoreInterior);
                currentMoveSpeed = moveSpeed;

                if (!isAiming) playerChar.mesh.rotation.y = Math.atan2(-dirX, -dirZ);
            }
            if (isAiming) playerChar.mesh.rotation.y = camYaw;

            VCModels.updateHumanAnimation(playerChar, { speed: currentMoveSpeed, isRunning, isAiming, hasGun });
        }

        // Tráfego de Veículos NPC (Atropelam se estiverem em velocidade)
        vehicles.forEach(v => {
            if (v !== inVehicle) {
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

        // Pedestres com Hitbox de Prédios
        peds.forEach(p => {
            if (!p.alive) {
                VCModels.updateHumanAnimation(p.char, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
                return;
            }
            const spd = p.panic ? 0.22 : 0.055;
            const prevX = p.char.mesh.position.x;
            const prevZ = p.char.mesh.position.z;
            moveEntityWithHitbox(p.char.mesh.position, -Math.sin(p.angle) * spd, -Math.cos(p.angle) * spd, 0.45, false);

            // Se bateu numa parede, muda de direção
            if (Math.hypot(p.char.mesh.position.x - prevX, p.char.mesh.position.z - prevZ) < spd * 0.3) {
                p.angle += Math.PI * 0.65;
            }
            p.char.mesh.rotation.y = p.angle;
            VCModels.updateHumanAnimation(p.char, { speed: spd, isRunning: p.panic, isAiming: false, hasGun: false });
            if (Math.abs(p.char.mesh.position.x) > 185 || Math.abs(p.char.mesh.position.z) > 215) p.angle += Math.PI;
        });

        // Projéteis do Jogador (Com Hitbox de Parede, Pedestres e Policiais)
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.mesh.position.x -= Math.sin(b.angle) * 1.75;
            b.mesh.position.z -= Math.cos(b.angle) * 1.75;
            b.life--;

            const activeBoxes = activeStoreInterior ? interiorColliders : colliders;
            if (hitsColliderBox(b.mesh.position.x, b.mesh.position.z, 0.1, activeBoxes)) {
                b.life = 0;
            }

            if (b.life > 0 && !activeStoreInterior) {
                peds.forEach(p => {
                    if (p.alive && b.mesh.position.distanceTo(p.char.mesh.position) < 1.25) {
                        p.hp -= b.dmg;
                        b.life = 0;
                        if (p.hp <= 0) {
                            p.alive = false; p.char.state = 'dead';
                            spawnDroppedCash(p.char.mesh.position.x, p.char.mesh.position.z, 75);
                            wantedStars = Math.min(6, wantedStars + 1);
                            VCSoundFX.playScream(p.isFemale);
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
                            spawnDroppedCash(cop.char.mesh.position.x, cop.char.mesh.position.z, 150);
                            wantedStars = Math.min(6, wantedStars + 1);
                            updateHUD();
                        }
                    }
                });
            }

            if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); }
        }

        // IA Policial: Viaturas Cercam, Desembarcam Policiais e Helicópteros Atiram
        const targetPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
        if (wantedStars > 0 && !activeStoreInterior && tick % 18 === 0) {
            VCSoundFX.playPoliceSirenStep(Math.floor(tick / 18) % 2 === 0);
        }

        copUnits.forEach(cop => {
            if (wantedStars > 0 && !activeStoreInterior && cop !== inVehicle) {
                const dx = targetPos.x - cop.mesh.position.x;
                const dz = targetPos.z - cop.mesh.position.z;
                const dist = Math.hypot(dx, dz);
                const cAng = Math.atan2(-dx, -dz);
                cop.mesh.rotation.y = cAng;

                const flash = Math.floor(tick / 8) % 2 === 0;
                cop.sR.visible = flash; cop.sB.visible = !flash;

                if (dist > 14.5) {
                    const cSpd = 0.29 + (wantedStars * 0.03);
                    moveEntityWithHitbox(cop.mesh.position, -Math.sin(cAng) * cSpd, -Math.cos(cAng) * cSpd, 1.35, false);
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
            if (activeStoreInterior) return;

            const dx = targetPos.x - cop.char.mesh.position.x;
            const dz = targetPos.z - cop.char.mesh.position.z;
            const dist = Math.hypot(dx, dz);
            const angToPlayer = Math.atan2(-dx, -dz);
            cop.char.mesh.rotation.y = angToPlayer;

            if (dist > 11 && dist < 55) {
                moveEntityWithHitbox(cop.char.mesh.position, -Math.sin(angToPlayer) * 0.14, -Math.cos(angToPlayer) * 0.14, 0.45, false);
                VCModels.updateHumanAnimation(cop.char, { speed: 0.14, isRunning: true, isAiming: true, hasGun: true });
            } else {
                VCModels.updateHumanAnimation(cop.char, { speed: 0, isRunning: false, isAiming: true, hasGun: true });
            }

            cop.shootCooldown--;
            if (cop.shootCooldown <= 0 && dist < 42) {
                cop.shootCooldown = Math.max(24, 65 - wantedStars * 6);
                cop.char.recoilOffset = 0.25;
                VCSoundFX.playGunshot('pistol');

                const eb = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6),
                    new THREE.MeshBasicMaterial({ color: 0xef4444 })
                );
                eb.rotation.x = Math.PI / 2;
                eb.rotation.y = angToPlayer;
                eb.position.set(cop.char.mesh.position.x, 1.4, cop.char.mesh.position.z);
                scene.add(eb);
                enemyBullets.push({ mesh: eb, vx: -Math.sin(angToPlayer) * 1.15, vy: 0, vz: -Math.cos(angToPlayer) * 1.15, life: 55, dmg: 8 });
            }
        });

        copHelis.forEach((heli, idx) => {
            heli.rotor.rotation.y += 0.45;
            heli.orbitAngle += 0.015;

            const desiredX = targetPos.x + Math.cos(heli.orbitAngle + idx * Math.PI) * 20;
            const desiredZ = targetPos.z + Math.sin(heli.orbitAngle + idx * Math.PI) * 20;
            heli.mesh.position.x = THREE.MathUtils.lerp(heli.mesh.position.x, desiredX, 0.04);
            heli.mesh.position.z = THREE.MathUtils.lerp(heli.mesh.position.z, desiredZ, 0.04);
            heli.mesh.position.y = 22 + Math.sin(tick * 0.05) * 1.2;

            heli.mesh.lookAt(targetPos.x, 1.5, targetPos.z);
            heli.spotlight.target.position.copy(targetPos);

            if (!activeStoreInterior) {
                heli.shootCooldown--;
                if (heli.shootCooldown <= 0) {
                    heli.shootCooldown = Math.max(22, 55 - wantedStars * 5);
                    VCSoundFX.playGunshot('uzi');

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
                    enemyBullets.push({ mesh: hb, vx: dir.x * 1.35, vy: dir.y * 1.35, vz: dir.z * 1.35, life: 60, dmg: 9 });
                }
            }
        });

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            eb.mesh.position.x += eb.vx;
            eb.mesh.position.y += eb.vy;
            eb.mesh.position.z += eb.vz;
            eb.life--;

            if (!activeStoreInterior && eb.mesh.position.distanceTo(targetPos) < (inVehicle ? 2.4 : 1.15)) {
                applyDamageToPlayer(eb.dmg, 'combat');
                eb.life = 0;
            }
            if (eb.life <= 0) { scene.remove(eb.mesh); enemyBullets.splice(i, 1); }
        }

        const promptEl = document.getElementById('vc-action-prompt');
        if (promptEl) {
            let msg = "";
            if (activeStoreInterior) {
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, 8.2)) < 3.2) {
                    msg = "Pressione [E] para SAIR DA LOJA";
                } else if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -2.2)) < 3.4 && !activeStoreInterior.robbed) {
                    msg = `Pressione [E] para ROUBAR O CAIXA ($${activeStoreInterior.cash})`;
                }
            } else {
                if (!inVehicle) {
                    const allDrivable = [...vehicles, ...copUnits];
                    for (let v of allDrivable) {
                        if (playerChar.mesh.position.distanceTo(v.mesh.position) < 4.5) { msg = `Pressione [F] para roubar ${v.name || 'Viatura VCPD'}`; break; }
                    }
                }
                for (let st of stores) {
                    if (playerChar.mesh.position.distanceTo(st.marker.position) < 4.5) { msg = `Pressione [E] para ENTRAR em ${st.name}`; break; }
                }
                for (let hs of houses) {
                    if (playerChar.mesh.position.distanceTo(hs.marker.position) < 4.5) {
                        msg = hs.owned
                            ? `Pressione [E] para DESCANSAR em ${hs.name} (Vida 100% + Limpar Polícia)`
                            : `Pressione [E] para COMPRAR ${hs.name} ($${hs.price})`;
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

        // Órbita 3D completa da Câmera
        const distCam = activeStoreInterior ? 4.4 : (isAiming ? 3.5 : (inVehicle ? 9.8 : 6.4));
        const baseHeight = activeStoreInterior ? 2.1 : (isAiming ? 1.85 : (inVehicle ? 3.4 : 2.3));
        const sideOffset = isAiming ? 0.95 : 0;

        const horizDist = distCam * Math.cos(camPitch * 0.75);
        const vertOffset = distCam * Math.sin(camPitch);
        const camY = activeStoreInterior
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
