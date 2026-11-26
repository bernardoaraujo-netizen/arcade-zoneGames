// game/js/world.js - Metrópole Capital Gigante (4800x4800m):
// Centro Financeiro com Arranha-Céus, Avenidas Principais, Bairros, Bancos, Escolas,
// Lanchonetes, Mercados, Delegacias, Aeroporto Internacional, Marina e Praças

window.VCWorld = {
    buildCity(scene) {
        const colliders = [];
        const interiorColliders = {};
        const enterableDoors = [];
        const garages = [];
        const streetLamps = [];
        const vehicles = [];
        const peds = [];
        const animals = [];
        const clouds = [];

        // =====================================================================
        // 1. TERRENO METROPOLITANO (4800x4800m), RIO CENTRAL, ORLA E 9 PONTES
        // =====================================================================
        const roadTex = VCTextures.createRoadTexture(1);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(16, 16);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(4800, 4800),
            new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 })
        );
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        // Rio Metropolitano cortando a Capital no eixo X = 0
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.18,
            metalness: 0.65
        });
        const river = new THREE.Mesh(new THREE.PlaneGeometry(68, 4800, 8, 64), waterMat);
        river.rotation.x = -Math.PI / 2;
        river.position.set(0, 0.08, 0);
        scene.add(river);

        // Praia Dourada e Oceano a Leste (X > 1100)
        const beach = new THREE.Mesh(
            new THREE.PlaneGeometry(140, 4800),
            new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 })
        );
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(1120, 0.03, 0);
        scene.add(beach);

        const oceanGeo = new THREE.PlaneGeometry(1200, 4800, 36, 96);
        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            roughness: 0.14,
            metalness: 0.78
        });
        const ocean = new THREE.Mesh(oceanGeo, oceanMat);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.set(1790, 0.18, 0);
        scene.add(ocean);

        const surfFoam = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 4800),
            new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65 })
        );
        surfFoam.rotation.x = -Math.PI / 2;
        surfFoam.position.set(1190, 0.12, 0);
        scene.add(surfFoam);

        // 9 Grandes Pontes Metropolitanas conectando Zona Oeste e Zona Leste
        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
        const bridgeZs = [-1600, -1200, -800, -400, 0, 400, 800, 1200, 1600];
        bridgeZs.forEach(bz => {
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(78, 0.7, 26), bridgeMat);
            bridge.position.set(0, 0.35, bz);
            scene.add(bridge);
        });

        // =====================================================================
        // 2. MALHA URBANA DE CAPITAL: DISTRITO FINANCEIRO, BAIRROS E AVENIDAS
        // =====================================================================
        const palettes = [
            ['#f472b6', '#22d3ee'], ['#38bdf8', '#facc15'], ['#a855f7', '#ec4899'],
            ['#fb923c', '#38bdf8'], ['#34d399', '#f472b6'], ['#f8fafc', '#06b6d4']
        ];

        // Grade de quarteirões cobrindo toda a metrópole (-1020 a +1020 em X, -1750 a +1750 em Z)
        const xCoords = [
            -1020, -920, -820, -720, -620, -520, -420, -320, -220, -120,
            110, 210, 310, 410, 510, 610, 710, 810, 910, 1010
        ];
        const zCoords = [
            -1720, -1500, -1320, -1100, -920, -700, -520, -300, -140,
            140, 300, 520, 700, 920, 1100, 1320, 1500, 1720
        ];

        let seedCounter = 1;
        let storeIdx = 0;
        let dinerIdx = 0;
        let schoolIdx = 0;
        let houseIdx = 0;

        xCoords.forEach(bx => {
            zCoords.forEach(bz => {
                // Preserva avenidas das pontes, Praça Cívica (110, -20), Banco Central (-120, 60) e Aeroporto
                if (bridgeZs.some(brZ => Math.abs(bz - brZ) < 34)) return;
                if (Math.abs(bx - 110) < 55 && Math.abs(bz + 20) < 55) return;
                if (Math.abs(bx + 120) < 48 && Math.abs(bz - 60) < 48) return;
                if (bx < -780 && Math.abs(bz) < 420) return; // Área do Aeroporto Internacional

                const isFinancialCenter = (Math.abs(bx) < 360 && Math.abs(bz) < 560);
                const width = isFinancialCenter ? (34 + (seedCounter % 10)) : (28 + (seedCounter % 8));
                const depth = isFinancialCenter ? (34 + ((seedCounter * 3) % 10)) : (28 + ((seedCounter * 3) % 8));
                const height = isFinancialCenter
                    ? (55 + (seedCounter % 65))  // Arranha-céus altos no centro da Capital
                    : (18 + (seedCounter % 28)); // Prédios médios e residenciais nos bairros

                const [c1, c2] = palettes[seedCounter % palettes.length];
                const mod = seedCounter % 13;
                const isDiner = (mod === 1 && dinerIdx < 10);
                const isSchool = (mod === 2 && schoolIdx < 6);
                const isShop = (mod === 3 && storeIdx < 14);
                const isHouse = (mod === 4 && houseIdx < 18);

                const tex = VCTextures.createBuildingTexture(c1, c2, isShop || isDiner, seedCounter);
                const bMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(width, height, depth),
                    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
                );
                bMesh.position.set(bx, height / 2, bz);
                scene.add(bMesh);

                // Calçada larga da Capital
                const sw = new THREE.Mesh(
                    new THREE.BoxGeometry(width + 9, 0.16, depth + 9),
                    new THREE.MeshStandardMaterial({ map: VCTextures.createSidewalkTexture(seedCounter) })
                );
                sw.position.set(bx, 0.08, bz);
                scene.add(sw);

                colliders.push({
                    minX: bx - width / 2,
                    maxX: bx + width / 2,
                    minZ: bz - depth / 2,
                    maxZ: bz + depth / 2,
                    tag: 'building'
                });

                if (window.VCModels) {
                    if (seedCounter % 3 === 0) {
                        const post = VCModels.createStreetLight3D(bx + width / 2 + 3.0, bz + depth / 2 + 3.0);
                        scene.add(post);
                        if (post.children[1]) streetLamps.push(post.children[1]);
                    }
                    if (seedCounter % 2 === 0) {
                        const tree = VCModels.createTree3D(bx - width / 2 - 3.0, bz + depth / 2 + 2.8, seedCounter);
                        scene.add(tree);
                    }
                }

                const doorZ = bz + depth / 2 + 3.2;

                if (isDiner) {
                    dinerIdx++;
                    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 20), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
                    m.position.set(bx, 0.2, doorZ);
                    const sign = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
                    sign.position.set(bx, 4.8, bz + depth / 2 + 0.3);
                    scene.add(m, sign);

                    enterableDoors.push({
                        id: `diner_${dinerIdx}`,
                        type: 'diner',
                        name: `Lanchonete ArcadeZone Burger #${dinerIdx}`,
                        extX: bx,
                        extZ: doorZ + 2.2,
                        marker: m
                    });
                } else if (isSchool) {
                    schoolIdx++;
                    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 20), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
                    m.position.set(bx, 0.2, doorZ);
                    const sign = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
                    sign.position.set(bx, 5.0, bz + depth / 2 + 0.3);
                    scene.add(m, sign);

                    enterableDoors.push({
                        id: `school_${schoolIdx}`,
                        type: 'school',
                        name: `Colégio Estadual da Capital #${schoolIdx}`,
                        extX: bx,
                        extZ: doorZ + 2.2,
                        marker: m
                    });
                } else if (isShop) {
                    storeIdx++;
                    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 20), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
                    m.position.set(bx, 0.2, doorZ);
                    scene.add(m);

                    enterableDoors.push({
                        id: `store_${storeIdx}`,
                        type: 'store',
                        name: `Supermercado Capital 24h #${storeIdx}`,
                        extX: bx,
                        extZ: doorZ + 2.2,
                        marker: m,
                        cash: 2500 + storeIdx * 450,
                        robbed: false,
                        reported: false
                    });
                } else if (isHouse) {
                    houseIdx++;
                    const hm = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 20), new THREE.MeshBasicMaterial({ color: houseIdx === 1 ? 0x38bdf8 : 0x10b981 }));
                    hm.position.set(bx, 0.2, doorZ);
                    scene.add(hm);

                    enterableDoors.push({
                        id: `house_${houseIdx}`,
                        type: 'house',
                        name: isFinancialCenter ? `Cobertura Paulista #${houseIdx}` : `Mansão Jardim Europa #${houseIdx}`,
                        extX: bx,
                        extZ: doorZ + 2.2,
                        marker: hm,
                        price: isFinancialCenter ? 6500 : 3500,
                        owned: houseIdx === 1
                    });
                }

                seedCounter++;
            });
        });

        // =====================================================================
        // 3. MONUMENTOS E CENTROS DA CAPITAL:
        //    PRAÇA CÍVICA COM CHAFARIZ, BANCO CENTRAL, AMMU-NATION, DELEGACIAS E AEROPORTO
        // =====================================================================
        const plazaFloor = new THREE.Mesh(
            new THREE.CylinderGeometry(28, 28, 0.16, 36),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
        );
        plazaFloor.position.set(110, 0.08, -20);
        scene.add(plazaFloor);
        const fountain = VCModels.createFountain3D(110, -20);
        scene.add(fountain.mesh);

        for (let a = 0; a < 12; a++) {
            const ang = (a / 12) * Math.PI * 2;
            scene.add(VCModels.createTree3D(110 + Math.cos(ang) * 23, -20 + Math.sin(ang) * 23, a));
        }

        // Banco Central da Capital (X = -120, Z = 60)
        const bankX = -120, bankZ = 60;
        const bankBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(30, 18, 24),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.35 })
        );
        bankBuilding.position.set(bankX, 9, bankZ);
        const bankSign = new THREE.Mesh(
            new THREE.BoxGeometry(22, 2.0, 0.7),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        bankSign.position.set(bankX, 15.5, bankZ + 12.2);
        scene.add(bankBuilding, bankSign);
        colliders.push({ minX: bankX - 15, maxX: bankX + 15, minZ: bankZ - 12, maxZ: bankZ + 12, tag: 'bank' });

        const bankMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 24), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        bankMarker.position.set(bankX, 0.2, bankZ + 14.5);
        scene.add(bankMarker);
        enterableDoors.push({
            id: 'central_bank',
            type: 'bank',
            name: 'Banco Central da Capital',
            extX: bankX,
            extZ: bankZ + 17.0,
            marker: bankMarker,
            robbed: false
        });

        // Lojas Ammu-Nation
        [
            { name: "Ammu-Nation Zona Leste", x: 160, z: 60 },
            { name: "Ammu-Nation Centro", x: -160, z: -60 },
            { name: "Ammu-Nation Zona Norte", x: 310, z: -620 }
        ].forEach((aSpot, idx) => {
            const bld = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 14), new THREE.MeshStandardMaterial({ color: 0x450a0a }));
            bld.position.set(aSpot.x, 3.25, aSpot.z);
            const sign = new THREE.Mesh(new THREE.BoxGeometry(11, 1.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            sign.position.set(aSpot.x, 5.6, aSpot.z + 7.1);
            scene.add(bld, sign);
            colliders.push({ minX: aSpot.x - 7, maxX: aSpot.x + 7, minZ: aSpot.z - 7, maxZ: aSpot.z + 7, tag: 'gunshop' });

            const am = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 20), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            am.position.set(aSpot.x, 0.2, aSpot.z + 8.8);
            scene.add(am);
            enterableDoors.push({
                id: `gunshop_${idx}`,
                type: 'gunshop',
                name: aSpot.name,
                extX: aSpot.x,
                extZ: aSpot.z + 11.0,
                marker: am
            });
        });

        // Delegacias VCPD
        [
            { name: 'Quartel General VCPD Centro', x: -160, z: 160 },
            { name: 'Delegacia VCPD Zona Leste', x: 260, z: 220 }
        ].forEach((pd, idx) => {
            const pdBld = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 15), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
            pdBld.position.set(pd.x, 4.5, pd.z);
            const pdSign = new THREE.Mesh(new THREE.BoxGeometry(15, 1.4, 0.5), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
            pdSign.position.set(pd.x, 7.8, pd.z + 7.6);
            scene.add(pdBld, pdSign);
            colliders.push({ minX: pd.x - 9, maxX: pd.x + 9, minZ: pd.z - 7.5, maxZ: pd.z + 7.5, tag: 'police_hq' });

            const pdMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 20), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
            pdMarker.position.set(pd.x, 0.2, pd.z + 9.6);
            scene.add(pdMarker);
            enterableDoors.push({
                id: `police_hq_${idx}`,
                type: 'police',
                name: pd.name,
                extX: pd.x,
                extZ: pd.z + 11.8,
                marker: pdMarker
            });
        });

        // Garagens Pay 'n' Spray
        [
            { name: "Pay 'n' Spray Zona Leste", x: 160, z: -60 },
            { name: "Pay 'n' Spray Centro", x: -240, z: 60 },
            { name: "Pay 'n' Spray Zona Sul", x: 310, z: 620 }
        ].forEach(gSpot => {
            const bay = new THREE.Mesh(new THREE.BoxGeometry(11, 5.5, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
            bay.position.set(gSpot.x, 2.75, gSpot.z);
            const arch = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.8, 0.6), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
            arch.position.set(gSpot.x, 5.6, gSpot.z + 6.1);
            scene.add(bay, arch);
            colliders.push({ minX: gSpot.x - 5.5, maxX: gSpot.x + 5.5, minZ: gSpot.z - 6, maxZ: gSpot.z + 6, tag: 'garage' });

            const gm = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
            gm.position.set(gSpot.x, 0.16, gSpot.z + 8.8);
            scene.add(gm);
            garages.push({ name: gSpot.name, x: gSpot.x, z: gSpot.z + 8.8, marker: gm });
        });

        // Aeroporto Internacional da Capital (Zona Oeste: X = -920, Z = -380 a +380)
        const runway = new THREE.Mesh(
            new THREE.PlaneGeometry(48, 760),
            new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
        );
        runway.rotation.x = -Math.PI / 2;
        runway.position.set(-920, 0.08, 0);
        scene.add(runway);

        const terminal = new THREE.Mesh(
            new THREE.BoxGeometry(28, 14, 90),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 })
        );
        terminal.position.set(-975, 7, 0);
        scene.add(terminal);
        colliders.push({ minX: -989, maxX: -961, minZ: -45, maxZ: 45, tag: 'airport' });

        // =====================================================================
        // 4. INTERIORES COMPLETOS NO SUBSOLO (Y = -40)
        // =====================================================================
        function buildRoomShell(cx, cz, w, d, wallHex, floorHex) {
            const g = new THREE.Group();
            g.position.set(cx, -40, cz);
            const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: floorHex, roughness: 0.4 }));
            fl.rotation.x = -Math.PI / 2;
            const wm = new THREE.MeshStandardMaterial({ color: wallHex, roughness: 0.6 });
            const bw = new THREE.Mesh(new THREE.BoxGeometry(w, 6, 0.5), wm); bw.position.set(0, 3, -d / 2);
            const fw = new THREE.Mesh(new THREE.BoxGeometry(w, 6, 0.5), wm); fw.position.set(0, 3, d / 2);
            const lw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, d), wm); lw.position.set(-w / 2, 3, 0);
            const rw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, d), wm); rw.position.set(w / 2, 3, 0);
            const exitDoor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 0.35), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            exitDoor.position.set(0, 1.7, d / 2 - 0.3);
            g.add(fl, bw, fw, lw, rw, exitDoor);
            scene.add(g);
            return g;
        }

        // [1] Supermercado 24/7
        const storeShell = buildRoomShell(0, 0, 20, 20, 0x311042, 0x1e293b);
        [-6.5, 6.5].forEach(sx => {
            const sh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
            sh.position.set(sx, 1.6, 0.5);
            storeShell.add(sh);
        });
        const storeCounter = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.15, 1.5), new THREE.MeshStandardMaterial({ color: 0x090d16 }));
        storeCounter.position.set(0, 0.58, -3.5);
        const alarmLight = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshBasicMaterial({ color: 0x334155 }));
        alarmLight.position.set(0, 5.2, -9.5);
        storeShell.add(storeCounter, alarmLight);
        const clerkChar = VCModels.createHuman3D({ seed: 999 });
        clerkChar.mesh.position.set(0, -40, -5.2);
        scene.add(clerkChar.mesh);
        interiorColliders.store = [
            { minX: -4.4, maxX: 4.4, minZ: -4.4, maxZ: -2.6 },
            { minX: -7.4, maxX: -5.6, minZ: -3.6, maxZ: 4.6 },
            { minX: 5.6, maxX: 7.4, minZ: -3.6, maxZ: 4.6 }
        ];

        // [2] Casa / Cobertura
        const houseShell = buildRoomShell(60, 0, 22, 22, 0x1e1b4b, 0x27272a);
        const sofa = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.1, 2.0), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        sofa.position.set(-4.5, 0.55, -2.5);
        const bed = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 5.0), new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
        bed.position.set(5.5, 0.45, -5.5);
        const savePad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 20), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        savePad.position.set(5.5, 0.1, -1.5);
        houseShell.add(sofa, bed, savePad);
        interiorColliders.house = [
            { minX: 52.5, maxX: 58.5, minZ: -3.6, maxZ: -1.4 },
            { minX: 63.3, maxX: 67.7, minZ: -8.2, maxZ: -2.8 }
        ];

        // [3] Ammu-Nation
        const gunShell = buildRoomShell(120, 0, 20, 20, 0x450a0a, 0x18181b);
        const gunCounter = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        gunCounter.position.set(0, 0.6, -2.5);
        const buyPad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.15, 20), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        buyPad.position.set(0, 0.1, -0.5);
        gunShell.add(gunCounter, buyPad);
        const gunDealerChar = VCModels.createHuman3D({ seed: 888 });
        gunDealerChar.mesh.position.set(120, -40, -4.4);
        scene.add(gunDealerChar.mesh);
        interiorColliders.gunshop = [{ minX: 115.0, maxX: 125.0, minZ: -3.5, maxZ: -1.5 }];

        // [4] Delegacia VCPD
        const pdShell = buildRoomShell(180, 0, 22, 22, 0x0f172a, 0x1e293b);
        const pdDesk = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.5), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
        pdDesk.position.set(0, 0.6, -3.5);
        const copArmoryPad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        copArmoryPad.position.set(5.5, 0.1, -6.5);
        pdShell.add(pdDesk, copArmoryPad);
        const deskCopChar = VCModels.createHuman3D({ isCop: true, seed: 777 });
        deskCopChar.mesh.position.set(180, -40, -5.2);
        scene.add(deskCopChar.mesh);
        interiorColliders.police = [{ minX: 175.8, maxX: 184.2, minZ: -4.4, maxZ: -2.6 }];

        // [5] Banco Central da Capital
        const bankShell = buildRoomShell(240, 0, 26, 26, 0x1e293b, 0x0f172a);
        const bankTellerDesk = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: 0x334155 }));
        bankTellerDesk.position.set(0, 0.6, 1.5);
        const vaultDoor = new THREE.Mesh(
            new THREE.CylinderGeometry(2.6, 2.6, 0.6, 24),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 })
        );
        vaultDoor.rotation.x = Math.PI / 2;
        vaultDoor.position.set(0, 2.6, -12.4);
        const vaultPad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        vaultPad.position.set(0, 0.1, -9.8);
        bankShell.add(bankTellerDesk, vaultDoor, vaultPad);

        const bankStaff = [];
        [[-3.8, -0.2], [0, -0.2], [3.8, -0.2]].forEach(([bx, bz], idx) => {
            const bStaff = VCModels.createHuman3D({ role: 'banker', seed: 600 + idx });
            bStaff.mesh.position.set(240 + bx, -40, bz);
            scene.add(bStaff.mesh);
            bankStaff.push({ char: bStaff, alive: true });
        });

        const bankGuards = [];
        [[-7, -5], [7, -5], [0, -8.2]].forEach(([gx, gz], idx) => {
            const gChar = VCModels.createHuman3D({ isGuard: true, seed: 500 + idx });
            const gGun = VCModels.createWeapon3D('uzi');
            gChar.handWeaponSocket.add(gGun);
            gChar.mesh.position.set(240 + gx, -40, gz);
            scene.add(gChar.mesh);
            bankGuards.push({ char: gChar, alive: true, hp: 95, shootCooldown: 30 + idx * 10 });
        });
        interiorColliders.bank = [{ minX: 234.0, maxX: 246.0, minZ: 0.7, maxZ: 2.3 }];

        // [6] Lanchonete ArcadeZone Burger
        const dinerShell = buildRoomShell(300, 0, 22, 22, 0x4c0519, 0x18181b);
        const dinerCounter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.15, 1.5), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        dinerCounter.position.set(0, 0.58, -4.5);
        const foodPad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 20), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        foodPad.position.set(0, 0.1, -2.5);
        dinerShell.add(dinerCounter, foodPad);

        const dinerWorker = VCModels.createHuman3D({ seed: 444 });
        dinerWorker.mesh.position.set(300, -40, -6.2);
        scene.add(dinerWorker.mesh);

        const tableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4 });
        [[-5.5, 1.5], [5.5, 1.5], [-5.5, 5.5], [5.5, 5.5]].forEach(([tx, tz]) => {
            const tbl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.9, 16), tableMat);
            tbl.position.set(tx, 0.45, tz);
            const ch1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), chairMat);
            ch1.position.set(tx - 1.4, 0.3, tz);
            const ch2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), chairMat);
            ch2.position.set(tx + 1.4, 0.3, tz);
            dinerShell.add(tbl, ch1, ch2);
        });
        interiorColliders.diner = [{ minX: 294.8, maxX: 305.2, minZ: -5.4, maxZ: -3.6 }];

        // [7] Escola / Colégio Estadual
        const schoolShell = buildRoomShell(360, 0, 24, 24, 0x1e3a8a, 0x334155);
        const blackboard = new THREE.Mesh(new THREE.BoxGeometry(9, 2.8, 0.25), new THREE.MeshStandardMaterial({ color: 0x064e3b }));
        blackboard.position.set(0, 2.8, -11.6);
        schoolShell.add(blackboard);

        const teacherChar = VCModels.createHuman3D({ role: 'teacher', seed: 301 });
        teacherChar.mesh.position.set(360, -40, -9.2);
        scene.add(teacherChar.mesh);

        const schoolStudents = [];
        [-5, 0, 5].forEach((dx, cIdx) => {
            [-4, 1, 6].forEach((dz, rIdx) => {
                const desk = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 1.2), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
                desk.position.set(dx, 0.42, dz);
                schoolShell.add(desk);

                const stu = VCModels.createHuman3D({ role: 'student', seed: 310 + cIdx * 3 + rIdx });
                stu.mesh.position.set(360 + dx, -40, dz + 1.1);
                scene.add(stu.mesh);
                schoolStudents.push({ char: stu, alive: true });
            });
        });
        interiorColliders.school = [];

        const interiorRooms = {
            store:   { cx: 0,   cz: 0, spawnZ: 7.2,  exitZ: 8.6,  actionX: 0,     actionZ: -1.8 },
            house:   { cx: 60,  cz: 0, spawnZ: 7.8,  exitZ: 9.4,  actionX: 65.5,  actionZ: -1.5 },
            gunshop: { cx: 120, cz: 0, spawnZ: 7.2,  exitZ: 8.6,  actionX: 120,   actionZ: -0.5 },
            police:  { cx: 180, cz: 0, spawnZ: 7.8,  exitZ: 9.4,  actionX: 185.5, actionZ: -6.5 },
            bank:    { cx: 240, cz: 0, spawnZ: 9.5,  exitZ: 11.4, actionX: 240,   actionZ: -9.8 },
            diner:   { cx: 300, cz: 0, spawnZ: 7.8,  exitZ: 9.4,  actionX: 300,   actionZ: -2.5 },
            school:  { cx: 360, cz: 0, spawnZ: 8.5,  exitZ: 10.4, actionX: 360,   actionZ: -8.0 }
        };

        // =====================================================================
        // 5. FROTA METROPOLITANA: CARROS, ÔNIBUS, BICICLETAS, JET-SKIS, AVIÕES E JATOS
        // =====================================================================
        const carColors = [0xec4899, 0x06b6d4, 0xfacc15, 0xa855f7, 0xf8fafc, 0xef4444];
        const carNames = ['Infernus Neon', 'Cheetah V8', 'Banshee Turbo', 'Comet GT', 'Stinger Cabrio'];

        for (let i = 0; i < 36; i++) {
            const isCop = (i % 6 === 5);
            const built = VCModels.createCar3D(carColors[i % carColors.length], isCop);
            const laneX = i % 2 === 0 ? 60 : -75;
            const laneZ = -1400 + i * 78;
            built.mesh.position.set(laneX, 0, laneZ);

            const driver = VCModels.createHuman3D({ isCop, seed: 800 + i });
            driver.mesh.scale.setScalar(0.75);
            driver.mesh.position.set(-0.35, 0.35, 0.1);
            built.mesh.add(driver.mesh);

            scene.add(built.mesh);
            vehicles.push({
                ...built,
                driverChar: driver,
                name: isCop ? 'Viatura VCPD' : carNames[i % carNames.length],
                isCopCar: isCop,
                speed: 0,
                maxSpeed: isCop ? 0.76 : 0.88,
                angle: i % 2 === 0 ? 0 : Math.PI,
                aiDir: i % 2 === 0 ? -1 : 1,
                hp: 100,
                hasNitro: false,
                burningTimer: 0,
                destroyed: false
            });
        }

        for (let i = 0; i < 10; i++) {
            const bus = VCModels.createBus3D(i % 2 === 0 ? 0xf59e0b : 0x0284c7);
            const bx = i % 2 === 0 ? 160 : -170;
            const bz = -1100 + i * 240;
            bus.mesh.position.set(bx, 0, bz);

            const busDriver = VCModels.createHuman3D({ seed: 900 + i });
            busDriver.mesh.scale.setScalar(0.85);
            busDriver.mesh.position.set(-0.6, 1.1, -3.5);
            bus.mesh.add(busDriver.mesh);

            scene.add(bus.mesh);
            vehicles.push({
                ...bus,
                driverChar: busDriver,
                name: 'Ônibus Metropolitano Capital',
                speed: 0,
                maxSpeed: 0.62,
                angle: 0,
                aiDir: -1,
                hp: 220,
                hasNitro: false,
                burningTimer: 0,
                destroyed: false
            });
        }

        [
            [65, -12], [95, -25], [125, -15], [160, 45], [-95, 35], [-145, -45], [260, -220], [-360, 220], [510, 120]
        ].forEach(([bx, bz], idx) => {
            const bike = VCModels.createBike3D(idx % 2 === 0 ? 0x22d3ee : 0xfacc15);
            bike.mesh.position.set(bx, 0, bz);
            scene.add(bike.mesh);
            vehicles.push({
                ...bike,
                name: 'Bicicleta BMX Pro (Segure [Q] ou [Ctrl] para Dar Grau)',
                speed: 0,
                maxSpeed: 0.52,
                angle: Math.random() * 6.28,
                aiDir: 0,
                hp: 80,
                hasNitro: false,
                burningTimer: 0,
                destroyed: false
            });
        });

        [
            [1195, -240], [1195, -80], [1195, 80], [1195, 260], [22, -40], [-22, 60]
        ].forEach(([jx, jz], idx) => {
            const js = VCModels.createJetSki3D(idx % 2 === 0 ? 0xec4899 : 0x06b6d4);
            js.mesh.position.set(jx, 0.25, jz);
            scene.add(js.mesh);
            vehicles.push({
                ...js,
                name: 'Jet-Ski Turbo Wave',
                speed: 0,
                maxSpeed: 0.96,
                angle: 0,
                aiDir: 0,
                hp: 110,
                hasNitro: true,
                burningTimer: 0,
                destroyed: false
            });
        });

        // Aviões e Jatos no Aeroporto Internacional (X = -920)
        [
            { isJet: false, x: -920, z: -220, name: 'Avião Bimotor Dodo' },
            { isJet: false, x: -920, z: -70,  name: 'Avião Executivo CapitalAir' },
            { isJet: true,  x: -920, z: 90,   name: 'Caça Jato Hydra V-22' },
            { isJet: true,  x: -920, z: 240,  name: 'Jato Supersônico ArcadeJet' }
        ].forEach(ap => {
            const plane = VCModels.createAircraft3D(ap.isJet);
            plane.mesh.position.set(ap.x, 0, ap.z);
            scene.add(plane.mesh);
            vehicles.push({
                ...plane,
                name: ap.name,
                speed: 0,
                maxSpeed: ap.isJet ? 1.65 : 1.15,
                angle: 0,
                aiDir: 0,
                hp: 250,
                hasNitro: ap.isJet,
                burningTimer: 0,
                destroyed: false
            });
        });

        // =====================================================================
        // 6. POPULAÇÃO METROPOLITANA: CIDADÃOS, GANGUES, LADRÕES, ANIMAIS E NUVENS
        // =====================================================================
        for (let i = 0; i < 64; i++) {
            const char = VCModels.createHuman3D({ seed: i * 37 + 11 });
            const blockX = xCoords[i % xCoords.length];
            const blockZ = zCoords[(i * 3) % zCoords.length];
            const px = blockX + (i % 2 === 0 ? 19.5 : -19.5);
            const pz = blockZ + 19.5;
            char.mesh.position.set(px, 0, pz);
            scene.add(char.mesh);

            peds.push({
                char,
                role: 'citizen',
                angle: (i % 4) * (Math.PI / 2),
                alive: true,
                hp: 55,
                aggroTarget: null,
                panic: false,
                talkTimer: 0,
                isFemale: i % 2 === 1
            });
        }

        for (let g = 0; g < 20; g++) {
            const isPurple = g < 10;
            const role = isPurple ? 'gang_purple' : 'gang_green';
            const char = VCModels.createHuman3D({ role, seed: 200 + g });
            const weapon = VCModels.createWeapon3D(g % 2 === 0 ? 'bat' : 'pistol');
            char.handWeaponSocket.add(weapon);

            const gx = isPurple ? (135 + (g % 5) * 18) : (-180 - (g % 5) * 18);
            const gz = isPurple ? (-40 + (g % 4) * 22) : (85 + (g % 4) * 22);
            char.mesh.position.set(gx, 0, gz);
            scene.add(char.mesh);

            peds.push({
                char,
                role,
                hasBat: g % 2 === 0,
                hasGun: g % 2 === 1,
                angle: Math.random() * 6.28,
                alive: true,
                hp: 85,
                aggroTarget: null,
                panic: false,
                talkTimer: 0,
                shootCooldown: 40
            });
        }

        for (let t = 0; t < 12; t++) {
            const char = VCModels.createHuman3D({ role: 'thief', seed: 400 + t });
            const knife = VCModels.createWeapon3D('knife');
            char.handWeaponSocket.add(knife);

            const tx = (t % 2 === 0 ? 85 : -115) + t * 18;
            const tz = -350 + t * 65;
            char.mesh.position.set(tx, 0, tz);
            scene.add(char.mesh);

            peds.push({
                char,
                role: 'thief',
                hasKnife: true,
                angle: Math.random() * 6.28,
                alive: true,
                hp: 70,
                aggroTarget: null,
                panic: false,
                stealCooldown: 180 + t * 40,
                talkTimer: 0
            });
        }

        const animalColors = [0x92400e, 0xf8fafc, 0x18181b, 0xd97706, 0x64748b];
        for (let i = 0; i < 36; i++) {
            const species = i < 12 ? 'dog' : (i < 22 ? 'cat' : 'bird');
            const anim = VCModels.createAnimal3D(species, animalColors[i % animalColors.length]);
            const ax = -650 + (i * 67) % 1400;
            const az = -950 + (i * 83) % 1900;
            const ay = species === 'bird' ? (18 + (i % 14)) : 0;
            anim.mesh.position.set(ax, ay, az);
            scene.add(anim.mesh);
            animals.push({
                ...anim,
                angle: Math.random() * 6.28,
                speed: species === 'bird' ? 0.18 : (species === 'dog' ? 0.065 : 0.045),
                baseY: ay
            });
        }

        for (let i = 0; i < 48; i++) {
            const cx = -1500 + (i * 293) % 3100;
            const cz = -1500 + (i * 351) % 3100;
            const cy = 85 + (i % 4) * 14;
            const cl = VCModels.createCloud3D(cx, cy, cz);
            scene.add(cl);
            clouds.push(cl);
        }

        const missionMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 0.3, 20),
            new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        missionMarker.position.set(60, 0.15, -45);
        scene.add(missionMarker);

        return {
            colliders,
            interiorColliders,
            interiorRooms,
            enterableDoors,
            garages,
            streetLamps,
            missionMarker,
            vehicles,
            peds,
            animals,
            clouds,
            fountain,
            river,
            ocean,
            surfFoam,
            interior: {
                clerkChar,
                alarmLight,
                gunDealerChar,
                deskCopChar,
                bankStaff,
                bankGuards,
                dinerWorker,
                teacherChar,
                schoolStudents
            }
        };
    }
};
