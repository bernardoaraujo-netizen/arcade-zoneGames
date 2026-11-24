// game/js/main.js - Engine Mundo Aberto, GPS Interativo com Rastro, Interiores de Lojas e Compra de Casas

window.startRockstarIntro = function() {
    const introScreen = document.getElementById('vc-intro-screen');
    const loadScreen = document.getElementById('vc-loading-screen');
    const gameHud = document.getElementById('vc-game-hud');

    introScreen.classList.remove('hidden');
    loadScreen.classList.add('hidden');
    gameHud.classList.add('hidden');

    if (window.VCSoundFX) VCSoundFX.playSynthChord();

    setTimeout(() => {
        introScreen.classList.add('hidden');
        loadScreen.classList.remove('hidden');
        if (window.VCTextures) VCTextures.renderLoadingArt('vc-loading-art');

        let pct = 0;
        const bar = document.getElementById('vc-load-bar');
        const pctText = document.getElementById('vc-load-pct');
        const statusText = document.getElementById('vc-load-status');
        const msgs = [
            "Construindo distritos de Ocean Beach, Downtown & Pontes...",
            "Carregando interiores de lojas e casas compráveis...",
            "Sincronizando sistema de GPS e rastreamento de rota...",
            "Populando Vice City com +5.000 NPCs e frota V8..."
        ];

        const timer = setInterval(() => {
            pct += 25;
            if (bar) bar.style.width = `${pct}%`;
            if (pctText) pctText.textContent = `${pct}%`;
            if (statusText && msgs[(pct / 25) - 1]) statusText.textContent = msgs[(pct / 25) - 1];

            if (pct >= 100) {
                clearInterval(timer);
                setTimeout(() => {
                    loadScreen.classList.add('hidden');
                    gameHud.classList.remove('hidden');
                    initViceCityEngine();
                }, 400);
            }
        }, 420);
    }, 1800);
};

function initViceCityEngine() {
    const mount = document.getElementById('vc-canvas-mount');
    mount.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3b0764);
    scene.fog = new THREE.FogExp2(0x4c1d95, 0.0055);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 350);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // PointerLock (Trava do cursor para câmera 360° estilo PC)
    mount.onclick = () => {
        const mapOpen = !document.getElementById('vc-full-map').classList.contains('hidden');
        const wheelOpen = !document.getElementById('vc-weapon-wheel').classList.contains('hidden');
        if (!mapOpen && !wheelOpen && document.pointerLockElement !== mount) {
            mount.requestPointerLock();
        }
    };
    document.addEventListener('pointerlockchange', () => {
        const hint = document.getElementById('vc-lock-hint');
        if (hint) hint.classList.toggle('hidden', document.pointerLockElement === mount);
    });

    scene.add(new THREE.HemisphereLight(0xfce7f3, 0x1e1b4b, 1.05));
    const sun = new THREE.DirectionalLight(0xf472b6, 1.1);
    sun.position.set(80, 120, -60);
    scene.add(sun);

    // Luz interna para o interior das lojas (Y = -40)
    const intLight = new THREE.PointLight(0xffffff, 1.4, 30);
    intLight.position.set(0, -36, 0);
    scene.add(intLight);

    // Constrói o Mundo Aberto
    const { buildings, stores, houses, missionMarker, vehicles, peds, interior } = VCWorld.buildCity(scene);

    // Protagonista Humano
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

    // Viaturas Policiais
    const copUnits = [];
    function spawnCopCar() {
        if (copUnits.length >= 4) return;
        const copBuilt = VCModels.createCar3D(0x090d16, true);
        copBuilt.mesh.position.set(playerChar.mesh.position.x + 42, 0, playerChar.mesh.position.z + 42);
        scene.add(copBuilt.mesh);
        copUnits.push({ ...copBuilt, speed: 0.30, steer: 0 });
    }

    // Estado Geral do Jogo
    const weapons = [
        { name: "Punhos (Briga)", icon: "👊", ammo: "∞", type: "melee" },
        { name: "Pistola 9mm", icon: "🔫", ammo: 96, type: "pistol" },
        { name: "Uzi Mac-10", icon: "🧨", ammo: 280, type: "uzi" },
        { name: "Escopeta", icon: "💥", ammo: 36, type: "shotgun" }
    ];
    let currentWeaponIdx = 0;
    let playerCash = 2000; // Dinheiro inicial suficiente para testar compra de casa ou armas
    let playerHealth = 100, playerArmor = 100, wantedStars = 0;
    let inVehicle = null, isAiming = false;
    let activeStoreInterior = null; // Loja em que o jogador está dentro no momento
    let clerkSurrendered = false;
    let gpsWaypoint = null; // { x, z } marcado pelo jogador no mapa
    let camYaw = 0, camPitch = 0.25;
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
        window.vcToastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
    }

    window.selectVCWeapon = (idx) => {
        currentWeaponIdx = idx;
        const wType = weapons[idx].type;
        Object.keys(weaponModels3D).forEach(k => weaponModels3D[k].visible = (k === wType));
        document.getElementById('vc-weapon-icon').textContent = weapons[idx].icon;
        document.getElementById('vc-ammo').textContent = weapons[idx].ammo;
        document.getElementById('vc-weapon-wheel').classList.add('hidden');
        showGameToast(`Equipado: ${weapons[idx].name}`);
    };

    // =========================================================================
    // SISTEMA DE MAPA GERAL INTERATIVO + MARCAÇÃO DE GPS COM RASTRO
    // =========================================================================
    window.toggleFullMap = (forceState) => {
        const mapEl = document.getElementById('vc-full-map');
        if (!mapEl) return;
        const show = forceState !== undefined ? forceState : mapEl.classList.contains('hidden');
        mapEl.classList.toggle('hidden', !show);
        if (show) {
            if (document.pointerLockElement) document.exitPointerLock();
            drawBigMap();
        }
    };

    window.clearGPSWaypoint = () => {
        gpsWaypoint = null;
        drawBigMap();
        showGameToast('📍 Rota de GPS removida');
    };

    // Clique no Mapa Grande para marcar destino e traçar o rastro
    const bigMapCanvas = document.getElementById('vc-bigmap-canvas');
    if (bigMapCanvas) {
        bigMapCanvas.onclick = (e) => {
            const rect = bigMapCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Converte pixel (0..420) para coordenada do mundo (-240..+240)
            const worldX = ((clickX - 210) / 210) * 240;
            const worldZ = ((clickY - 210) / 210) * 240;

            gpsWaypoint = { x: worldX, z: worldZ };
            drawBigMap();
            showGameToast('📍 Destino marcado! Siga o rastro rosa no minimapa.');
        };
    }

    function updateHUD() {
        document.getElementById('vc-cash').textContent = `$${String(playerCash).padStart(8, '0')}`;
        document.getElementById('vc-health').textContent = Math.max(0, Math.round(playerHealth));
        document.getElementById('vc-armor').textContent = Math.max(0, Math.round(playerArmor));
        document.getElementById('vc-stars').innerHTML =
            `<span class="text-cyan-300">${'★'.repeat(wantedStars)}</span><span class="text-zinc-600">${'☆'.repeat(6 - wantedStars)}</span>`;
    }

    // Controles Teclado & Mouse
    const keys = {};
    window.onkeydown = (e) => {
        const k = e.key.toLowerCase();
        keys[k] = true;

        if (e.key === 'Tab') {
            e.preventDefault();
            if (document.pointerLockElement) document.exitPointerLock();
            document.getElementById('vc-weapon-wheel').classList.remove('hidden');
        }
        if (k === 'm') toggleFullMap();
        if (k === '1') selectVCWeapon(0);
        if (k === '2') selectVCWeapon(1);
        if (k === '3') selectVCWeapon(2);
        if (k === '4') selectVCWeapon(3);

        // Pulo ou Suspensão do Carro [Espaço]
        if (e.code === 'Space') {
            e.preventDefault();
            if (inVehicle && inVehicle.hopY <= 0.01) {
                inVehicle.hopVy = 0.24;
            } else if (!inVehicle && playerChar.yPos <= 0.01 && playerChar.state !== 'dead') {
                playerChar.vy = 0.28;
            }
        }

        // Buzina [H]
        if (k === 'h' && inVehicle) VCSoundFX.playCarHorn();

        // Entrar / Roubar / Sair do Carro [F]
        if (k === 'f' && !activeStoreInterior) {
            if (inVehicle) {
                inVehicle.doorOpenTimer = 28;
                playerChar.mesh.position.set(inVehicle.mesh.position.x - 2.3, 0, inVehicle.mesh.position.z);
                playerChar.mesh.visible = true;
                inVehicle = null;
                showGameToast('Saiu do veículo');
            } else {
                for (let v of vehicles) {
                    if (playerChar.mesh.position.distanceTo(v.mesh.position) < 4.5) {
                        v.doorOpenTimer = 28;
                        inVehicle = v;
                        playerChar.mesh.visible = false;
                        triggerDynamicDialogue('car_theft', 1.15, 1.1);
                        if (v.isCopCar && wantedStars < 2) { wantedStars = 2; spawnCopCar(); }
                        showGameToast(`Dirigindo: ${v.name}`);
                        break;
                    }
                }
            }
        }

        // Interação Contextual [E]: Entrar/Assaltar Lojas, Comprar Casas e Missões
        if (k === 'e' && !inVehicle) {
            // A) Se já estiver DENTRO de uma loja
            if (activeStoreInterior) {
                // Sair pela porta da loja
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, 7.0)) < 3.0) {
                    playerChar.mesh.position.set(activeStoreInterior.x, 0, activeStoreInterior.z + 13.5);
                    activeStoreInterior = null;
                    clerkSurrendered = false;
                    showGameToast('Saiu da loja');
                    return;
                }

                // Assaltar o caixa registrador da loja por dentro!
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -3.2)) < 3.5 && !activeStoreInterior.robbed) {
                    activeStoreInterior.robbed = true;
                    activeStoreInterior.marker.material.color.setHex(0x52525b);
                    clerkSurrendered = true;
                    playerCash += activeStoreInterior.cash;
                    wantedStars = Math.min(6, wantedStars + 2);
                    spawnCopCar(); spawnCopCar();
                    VCSoundFX.playCash();
                    triggerDynamicDialogue('shop_robbery', 1.3, 1.15);
                    notifySiteDiscount(0.10, `Assalto em ${activeStoreInterior.name}`);
                    showGameToast(`💰 ASSALTO CONCLUÍDO! +$${activeStoreInterior.cash} (Saia pela porta azul!)`);
                    updateHUD();
                    return;
                }
                return;
            }

            // B) Entrar na porta de uma Loja (Mundo Aberto)
            for (let st of stores) {
                if (playerChar.mesh.position.distanceTo(st.marker.position) < 4.5) {
                    activeStoreInterior = st;
                    clerkSurrendered = st.robbed;
                    playerChar.mesh.position.set(0, -40, 5.2);
                    camYaw = 0;
                    showGameToast(`🏪 Entrou em: ${st.name}`);
                    return;
                }
            }

            // C) Comprar ou Usar Casa (Safehouse)
            for (let hs of houses) {
                if (playerChar.mesh.position.distanceTo(hs.marker.position) < 4.5) {
                    if (!hs.owned) {
                        if (playerCash >= hs.price) {
                            playerCash -= hs.price;
                            hs.owned = true;
                            hs.marker.material.color.setHex(0x38bdf8); // Muda marcador para azul (Sua Propriedade)
                            VCSoundFX.playCash();
                            speakVC("Property purchased! This place is yours now.", "Propriedade comprada! Este lugar agora é seu.", 0.95, 1.0);
                            showGameToast(`🏠 VOCÊ COMPROU: ${hs.name}!`);
                            updateHUD();
                        } else {
                            showGameToast(`⚠️ Dinheiro insuficiente! Custa $${hs.price}`);
                        }
                    } else {
                        // Casa já comprada: Recupera vida/colete e limpa polícia!
                        playerHealth = 100;
                        playerArmor = 100;
                        wantedStars = 0;
                        VCSoundFX.playSynthChord();
                        showGameToast(`🏠 Descansou em ${hs.name}: Vida/Colete 100% e Polícia despistada!`);
                        updateHUD();
                    }
                    return;
                }
            }

            // D) Missão [V]
            if (playerChar.mesh.position.distanceTo(missionMarker.position) < 4.5) {
                if (missionStage === 1) {
                    missionStage = 2;
                    missionMarker.position.set(-120, 0.12, 126);
                    gpsWaypoint = { x: -120, z: 126 }; // Marca automaticamente no GPS!
                    wantedStars = Math.min(6, wantedStars + 2);
                    spawnCopCar();
                    document.getElementById('vc-mission-text').textContent = "Siga a linha rosa do GPS até Downtown e despiste a VCPD!";
                    triggerDynamicDialogue('police_dispatch', 0.85, 1.05);
                } else {
                    missionStage = 1;
                    missionMarker.position.set(45, 0.12, -42);
                    gpsWaypoint = null;
                    playerCash += 4500;
                    wantedStars = 0;
                    VCSoundFX.playSynthChord();
                    notifySiteDiscount(0.15, "Missão Vice City Concluída");
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
        if (e.key === 'Tab') document.getElementById('vc-weapon-wheel').classList.add('hidden');
    };

    mount.onmousedown = (e) => {
        if (e.button === 2) { isAiming = true; document.getElementById('vc-crosshair').classList.remove('hidden'); }
        if (e.button === 0 && !inVehicle) performAttack();
    };
    window.onmouseup = (e) => {
        if (e.button === 2) { isAiming = false; document.getElementById('vc-crosshair').classList.add('hidden'); }
    };
    window.onmousemove = (e) => {
        if (document.pointerLockElement === mount) {
            camYaw -= e.movementX * 0.004;
            camPitch = Math.max(0.08, Math.min(0.65, camPitch + e.movementY * 0.003));
        }
    };

    function performAttack() {
        const wpn = weapons[currentWeaponIdx];

        if (wpn.type === 'melee') {
            playerChar.punchTimer = 14;
            peds.forEach(p => {
                if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 2.8) {
                    p.alive = false;
                    p.char.state = 'dead';
                    playerCash += 55;
                    VCSoundFX.playScream(p.isFemale);
                    triggerDynamicDialogue('pedestrian_panic', p.isFemale ? 1.35 : 0.95, 1.15);
                    updateHUD();
                }
            });
            return;
        }

        if (wpn.ammo <= 0) return;
        wpn.ammo--;
        document.getElementById('vc-ammo').textContent = wpn.ammo;
        playerChar.recoilOffset = 0.28;
        VCSoundFX.playGunshot(wpn.type);

        // Se atirar dentro de uma loja, o atendente rende-se imediatamente!
        if (activeStoreInterior && !activeStoreInterior.robbed) {
            clerkSurrendered = true;
            triggerDynamicDialogue('shop_robbery', 1.35, 1.2);
        }

        const activeModel = weaponModels3D[wpn.type];
        if (activeModel && activeModel.userData.flash) {
            activeModel.userData.flash.visible = true;
            setTimeout(() => { activeModel.userData.flash.visible = false; }, 65);
        }

        const bulletCount = wpn.type === 'shotgun' ? 4 : 1;
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
            bullets.push({ mesh: bMesh, angle: camYaw + spread, life: 45 });
        }

        peds.forEach(p => { if (p.alive && playerChar.mesh.position.distanceTo(p.char.mesh.position) < 28) p.panic = true; });
        if (wantedStars === 0 && Math.random() < 0.4) {
            wantedStars = 1; spawnCopCar();
            triggerDynamicDialogue('police_dispatch', 0.85, 1.1);
            updateHUD();
        }
    }

    function moveWithSlide(pos, dx, dz, radius) {
        // Se estiver dentro de uma loja, limita às paredes do interior
        if (activeStoreInterior) {
            const nx = pos.x + dx;
            const nz = pos.z + dz;
            if (Math.abs(nx) < 8.0) pos.x = nx;
            if (nz > -3.5 && nz < 8.0) pos.z = nz;
            return;
        }

        // Impede cair no canal de água fora das 3 pontes (-140, 0, +140)
        const onBridge = Math.abs(pos.z) < 9.5 || Math.abs(pos.z - 140) < 9.5 || Math.abs(pos.z + 140) < 9.5;
        let nextX = pos.x + dx;
        let blockedX = false;

        if (!onBridge && Math.abs(nextX) < 18.5) blockedX = true;
        for (let b of buildings) {
            if (Math.abs(nextX - b.x) < b.half + radius && Math.abs(pos.z - b.z) < b.half + radius) { blockedX = true; break; }
        }
        if (!blockedX && Math.abs(nextX) < 205) pos.x = nextX;

        let nextZ = pos.z + dz;
        let blockedZ = false;
        for (let b of buildings) {
            if (Math.abs(pos.x - b.x) < b.half + radius && Math.abs(nextZ - b.z) < b.half + radius) { blockedZ = true; break; }
        }
        if (!blockedZ && Math.abs(nextZ) < 235) pos.z = nextZ;
    }

    // =========================================================================
    // RENDERIZAÇÃO DO MINIMAPA CIRCULAR E DO MAPA GRANDE COM RASTRO GPS
    // =========================================================================
    const radarCanvas = document.getElementById('vc-radar');
    const rCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

    function drawRadar() {
        if (!rCtx) return;
        rCtx.clearRect(0, 0, 112, 112);
        rCtx.fillStyle = '#0f172a'; rCtx.fillRect(0, 0, 112, 112);

        const px = inVehicle ? inVehicle.mesh.position.x : playerChar.mesh.position.x;
        const pz = inVehicle ? inVehicle.mesh.position.z : playerChar.mesh.position.z;

        // Canal de água no minimapa
        rCtx.fillStyle = '#0284c7';
        rCtx.fillRect(56 - (px * 0.45) - 8, 0, 16, 112);

        // Rastro Rosa do GPS no Minimapa
        if (gpsWaypoint) {
            const gx = 56 + (gpsWaypoint.x - px) * 0.45;
            const gz = 56 + (gpsWaypoint.z - pz) * 0.45;

            rCtx.strokeStyle = '#ec4899';
            rCtx.lineWidth = 3;
            rCtx.beginPath();
            rCtx.moveTo(56, 56);
            rCtx.lineTo(gx, gz);
            rCtx.stroke();

            // Ponto de destino GPS
            rCtx.fillStyle = '#ec4899';
            rCtx.beginPath(); rCtx.arc(Math.max(10, Math.min(102, gx)), Math.max(10, Math.min(102, gz)), 4.5, 0, Math.PI * 2); rCtx.fill();

            // Remove GPS automaticamente ao chegar no destino
            if (Math.hypot(gpsWaypoint.x - px, gpsWaypoint.z - pz) < 10) {
                gpsWaypoint = null;
                showGameToast('📍 Você chegou ao destino marcado!');
            }
        }

        // Ícone Missão [V]
        const mx = 56 + (missionMarker.position.x - px) * 0.45;
        const mz = 56 + (missionMarker.position.z - pz) * 0.45;
        rCtx.fillStyle = '#f43f5e'; rCtx.font = 'bold 11px sans-serif';
        rCtx.fillText('V', Math.max(10, Math.min(98, mx)), Math.max(14, Math.min(102, mz)));

        // Lojas (Amarelo) e Casas (Verde/Azul)
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

        // Jogador no centro
        rCtx.fillStyle = '#ffffff';
        rCtx.beginPath(); rCtx.arc(56, 56, 3.8, 0, Math.PI * 2); rCtx.fill();
    }

    function drawBigMap() {
        const bc = document.getElementById('vc-bigmap-canvas'); if (!bc) return;
        const ctx = bc.getContext('2d');
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 420, 420);

        // Canal central, Praia Leste e Oceano
        ctx.fillStyle = '#0284c7'; ctx.fillRect(196, 0, 28, 420);
        ctx.fillStyle = '#fde047'; ctx.fillRect(365, 0, 25, 420);
        ctx.fillStyle = '#06b6d4'; ctx.fillRect(390, 0, 30, 420);

        // 3 Pontes
        ctx.fillStyle = '#64748b';
        [-140, 0, 140].forEach(bz => {
            const py = 210 + (bz / 240) * 210;
            ctx.fillRect(194, py - 6, 32, 12);
        });

        const px = inVehicle ? inVehicle.mesh.position.x : playerChar.mesh.position.x;
        const pz = inVehicle ? inVehicle.mesh.position.z : playerChar.mesh.position.z;
        const mapPx = 210 + (px / 240) * 210;
        const mapPz = 210 + (pz / 240) * 210;

        // Rastro GPS Rosa no Mapa Grande
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
            ctx.beginPath(); ctx.arc(gx, gz, 7, 0, Math.PI * 2); ctx.fill();
        }

        // Lojas (Amarelo)
        stores.forEach(st => {
            if (!st.robbed) {
                ctx.fillStyle = '#facc15';
                ctx.fillRect(210 + (st.x / 240) * 210 - 4, 210 + (st.z / 240) * 210 - 4, 8, 8);
            }
        });

        // Casas (Verde = À Venda | Azul = Comprada)
        houses.forEach(hs => {
            ctx.fillStyle = hs.owned ? '#38bdf8' : '#10b981';
            ctx.fillRect(210 + (hs.x / 240) * 210 - 4, 210 + (hs.z / 240) * 210 - 4, 8, 8);
        });

        // Missão [V]
        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('V', 210 + (missionMarker.position.x / 240) * 210 - 4, 210 + (missionMarker.position.z / 240) * 210 + 4);

        // Posição do Jogador
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(mapPx, mapPz, 6, 0, Math.PI * 2); ctx.fill();
    }

    speakVC("Welcome to Vice City! Press M to open the map and set a GPS route.", "Bem-vindo a Vice City! Pressione M para abrir o mapa e marcar uma rota no GPS.", 0.9, 1.0);
    updateHUD();

    let tick = 0;
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        tick++;

        if (tick % 45 === 0) VCSoundFX.playAmbientCityTick();

        if (tick % 60 === 0) {
            gameMinutes = (gameMinutes + 1) % 1440;
            const clk = document.getElementById('vc-clock');
            if (clk) clk.textContent = `${String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:${String(gameMinutes % 60).padStart(2, '0')}`;
        }

        const hasGun = currentWeaponIdx > 0;

        // Animação do Atendente dentro da Loja (Mãos ao alto se rendido)
        if (activeStoreInterior) {
            if (clerkSurrendered) {
                interior.clerkChar.leftArm.rotation.x = -Math.PI * 0.92;
                interior.clerkChar.rightArm.rotation.x = -Math.PI * 0.92;
            } else {
                VCModels.updateHumanAnimation(interior.clerkChar, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
            }
        }

        // Direção Veículo vs Personagem a Pé
        if (inVehicle) {
            let steerInput = 0;
            if (keys['w'] || keys['arrowup']) inVehicle.speed = Math.min(inVehicle.maxSpeed, inVehicle.speed + 0.026);
            else if (keys['s'] || keys['arrowdown']) inVehicle.speed = Math.max(-0.30, inVehicle.speed - 0.026);
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
            moveWithSlide(inVehicle.mesh.position, dx, dz, 1.2);
            inVehicle.mesh.rotation.y = inVehicle.angle;
            VCModels.updateCarAnimation(inVehicle, inVehicle.speed, steerInput);

            playerChar.mesh.position.copy(inVehicle.mesh.position);
            camYaw = inVehicle.angle;
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

                moveWithSlide(playerChar.mesh.position, dirX * moveSpeed, dirZ * moveSpeed, 0.45);
                currentMoveSpeed = moveSpeed;

                if (!isAiming) playerChar.mesh.rotation.y = Math.atan2(-dirX, -dirZ);
            }
            if (isAiming) playerChar.mesh.rotation.y = camYaw;

            VCModels.updateHumanAnimation(playerChar, { speed: currentMoveSpeed, isRunning, isAiming, hasGun });
        }

        // Trânsito Autônomo
        vehicles.forEach(v => {
            if (v !== inVehicle) {
                const aiSpd = 0.16 * v.aiDir;
                v.mesh.position.z += aiSpd;
                VCModels.updateCarAnimation(v, Math.abs(aiSpd), 0);
                if (v.mesh.position.z > 210) { v.aiDir = -1; v.mesh.rotation.y = 0; }
                if (v.mesh.position.z < -210) { v.aiDir = 1; v.mesh.rotation.y = Math.PI; }
            }
        });

        // NPCs
        peds.forEach(p => {
            if (!p.alive) {
                VCModels.updateHumanAnimation(p.char, { speed: 0, isRunning: false, isAiming: false, hasGun: false });
                return;
            }
            const spd = p.panic ? 0.22 : 0.055;
            p.char.mesh.position.x -= Math.sin(p.angle) * spd;
            p.char.mesh.position.z -= Math.cos(p.angle) * spd;
            p.char.mesh.rotation.y = p.angle;
            VCModels.updateHumanAnimation(p.char, { speed: spd, isRunning: p.panic, isAiming: false, hasGun: false });
            if (Math.abs(p.char.mesh.position.x) > 180 || Math.abs(p.char.mesh.position.z) > 210) p.angle += Math.PI;
        });

        // Projéteis
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.mesh.position.x -= Math.sin(b.angle) * 1.65;
            b.mesh.position.z -= Math.cos(b.angle) * 1.65;
            b.life--;

            peds.forEach(p => {
                if (p.alive && b.mesh.position.distanceTo(p.char.mesh.position) < 1.3) {
                    p.alive = false; p.char.state = 'dead';
                    playerCash += 75; wantedStars = Math.min(6, wantedStars + 1);
                    VCSoundFX.playScream(p.isFemale); spawnCopCar(); updateHUD(); b.life = 0;
                }
            });
            if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); }
        }

        // Polícia
        const targetPos = inVehicle ? inVehicle.mesh.position : playerChar.mesh.position;
        if (wantedStars > 0 && !activeStoreInterior && tick % 18 === 0) {
            VCSoundFX.playPoliceSirenStep(Math.floor(tick / 18) % 2 === 0);
        }

        copUnits.forEach(cop => {
            if (wantedStars > 0 && !activeStoreInterior) {
                const dx = targetPos.x - cop.mesh.position.x;
                const dz = targetPos.z - cop.mesh.position.z;
                const cAng = Math.atan2(-dx, -dz);
                cop.mesh.rotation.y = cAng;
                const cSpd = 0.25 + (wantedStars * 0.03);
                cop.mesh.position.x -= Math.sin(cAng) * cSpd;
                cop.mesh.position.z -= Math.cos(cAng) * cSpd;
                VCModels.updateCarAnimation(cop, cSpd, 0);

                const flash = Math.floor(tick / 8) % 2 === 0;
                cop.sR.visible = flash; cop.sB.visible = !flash;

                if (cop.mesh.position.distanceTo(targetPos) < 2.6 && tick % 30 === 0) {
                    if (playerArmor > 0) playerArmor = Math.max(0, playerArmor - 10);
                    else playerHealth = Math.max(0, playerHealth - 15);
                    updateHUD();
                    if (playerHealth <= 0) {
                        wantedStars = 0; playerHealth = 100; playerCash = Math.max(0, playerCash - 200);
                        playerChar.mesh.position.set(45, 0, -15); inVehicle = null; playerChar.mesh.visible = true;
                        speakVC("Busted! You are under arrest!", "Preso! Você está detido!", 0.85, 1.0);
                        showGameToast('🚓 PRESO (BUSTED)! -$200'); updateHUD();
                    }
                }
            }
        });

        // Prompts de Interação (Lojas, Casas, Carros, Missão)
        const promptEl = document.getElementById('vc-action-prompt');
        if (promptEl) {
            let msg = "";
            if (activeStoreInterior) {
                if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, 7.0)) < 3.0) {
                    msg = "Pressione [E] para SAIR DA LOJA";
                } else if (playerChar.mesh.position.distanceTo(new THREE.Vector3(0, -40, -3.2)) < 3.5 && !activeStoreInterior.robbed) {
                    msg = `Pressione [E] para ROUBAR O CAIXA ($${activeStoreInterior.cash})`;
                }
            } else {
                if (!inVehicle) {
                    for (let v of vehicles) {
                        if (playerChar.mesh.position.distanceTo(v.mesh.position) < 4.5) { msg = `Pressione [F] para roubar ${v.name}`; break; }
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

        // Câmera
        const distCam = activeStoreInterior ? 4.2 : (isAiming ? 3.5 : (inVehicle ? 9.8 : 6.4));
        const heightCam = activeStoreInterior ? 2.2 : (isAiming ? 2.1 : (inVehicle ? 4.4 : 2.9));
        const sideOffset = isAiming ? 0.95 : 0;

        const desiredCamPos = new THREE.Vector3(
            targetPos.x + Math.sin(camYaw) * distCam + Math.cos(camYaw) * sideOffset,
            targetPos.y + heightCam + Math.sin(camPitch) * 1.8,
            targetPos.z + Math.cos(camYaw) * distCam - Math.sin(camYaw) * sideOffset
        );
        camera.position.lerp(desiredCamPos, 0.22);
        camera.lookAt(
            targetPos.x - Math.sin(camYaw) * 5 + Math.cos(camYaw) * sideOffset,
            targetPos.y + 1.55,
            targetPos.z - Math.cos(camYaw) * 5 - Math.sin(camYaw) * sideOffset
        );

        drawRadar();
        renderer.render(scene, camera);
    }

    gameLoop();
}
