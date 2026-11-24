// game/js/world.js - Mundo Aberto Denso Estilo GTA V/VI com Interiores Entráveis para Tudo:
// Mercados 24/7, Casas/Coberturas de Luxo, Ammu-Nation, Delegacia VCPD e Garagens Pay 'n' Spray

window.VCWorld = {
    buildCity(scene) {
        const colliders = [];         // Hitboxes da cidade externa
        const interiorColliders = {}; // Hitboxes separadas por tipo de interior ('store', 'house', 'gunshop', 'police')
        const enterableDoors = [];    // Todas as portas entráveis do mapa
        const garages = [];           // Oficinas Pay 'n' Spray
        const streetLamps = [];       // Postes ligados ao ciclo Dia/Noite
        const vehicles = [];
        const peds = [];

        // =====================================================================
        // 1. TERRENO URBANO, RIO, PONTES, PRAIA E OCEANO
        // =====================================================================
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(520, 520),
            new THREE.MeshStandardMaterial({ map: VCTextures.createRoadTexture(1), roughness: 0.85 })
        );
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        const river = new THREE.Mesh(
            new THREE.PlaneGeometry(36, 520),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.6 })
        );
        river.rotation.x = -Math.PI / 2;
        river.position.y = 0.04;
        scene.add(river);

        const beach = new THREE.Mesh(
            new THREE.PlaneGeometry(45, 520),
            new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 })
        );
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(172, 0.03, 0);
        scene.add(beach);

        const ocean = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 520),
            new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.15, metalness: 0.7 })
        );
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.set(225, 0.04, 0);
        scene.add(ocean);

        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
        [-140, 0, 140].forEach(bz => {
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(42, 0.6, 18), bridgeMat);
            bridge.position.set(0, 0.25, bz);
            scene.add(bridge);
        });

        // =====================================================================
        // 2. QUARTEIRÕES DENSOS COM PORTAS ENTRÁVEIS EM TODOS OS TIPOS DE PRÉDIO
        // =====================================================================
        const palettes = [
            ['#f472b6', '#22d3ee'], ['#38bdf8', '#facc15'], ['#a855f7', '#ec4899'],
            ['#fb923c', '#38bdf8'], ['#34d399', '#f472b6'], ['#f8fafc', '#06b6d4']
        ];

        const xCoords = [-168, -134, -100, -64, 42, 76, 110, 142];
        const zCoords = [-192, -158, -112, -76, -36, 36, 76, 112, 158, 192];

        const storeNames = [
            "Vice 24/7 Market", "Neon Liquor & Goods", "Ocean Beach Pharmacy",
            "Downtown Pawn Shop", "Starlight Electronics", "Malibu Convenience"
        ];

        let seedCounter = 1;
        let storeIdx = 0;
        let houseIdx = 0;

        xCoords.forEach(bx => {
            zCoords.forEach(bz => {
                if (Math.abs(bz) < 22 || Math.abs(bz - 140) < 22 || Math.abs(bz + 140) < 22) return;
                if (Math.abs(bx - 45) < 16 && Math.abs(bz + 15) < 16) return;
                if (Math.abs(Math.abs(bx) - 58) < 14 && Math.abs(Math.abs(bz) - 18) < 14) return;

                const width = 19 + (seedCounter % 6);
                const depth = 19 + ((seedCounter * 3) % 6);
                const isDowntown = bx < 0;
                const height = isDowntown ? (28 + (seedCounter % 34)) : (15 + (seedCounter % 18));

                const [c1, c2] = palettes[seedCounter % palettes.length];
                const isShop = (seedCounter % 4 === 0 && storeIdx < storeNames.length);
                const tex = VCTextures.createBuildingTexture(c1, c2, isShop, seedCounter);

                const bMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(width, height, depth),
                    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
                );
                bMesh.position.set(bx, height / 2, bz);
                scene.add(bMesh);

                const sw = new THREE.Mesh(
                    new THREE.BoxGeometry(width + 4.4, 0.16, depth + 4.4),
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

                if (seedCounter % 2 === 0 && window.VCModels) {
                    const post = VCModels.createStreetLight3D(bx + width / 2 + 1.8, bz + depth / 2 + 1.8);
                    scene.add(post);
                    if (post.children[1]) streetLamps.push(post.children[1]);
                }

                const doorZ = bz + depth / 2 + 2.3;

                if (isShop) {
                    // Porta de Mercado / Loja Assaltável (Amarelo)
                    const m = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.2, 1.2, 0.25, 20),
                        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
                    );
                    m.position.set(bx, 0.2, doorZ);
                    scene.add(m);

                    const sign = new THREE.Mesh(
                        new THREE.BoxGeometry(6.8, 1.1, 0.4),
                        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
                    );
                    sign.position.set(bx, 4.2, bz + depth / 2 + 0.25);
                    scene.add(sign);

                    enterableDoors.push({
                        id: `store_${storeIdx}`,
                        type: 'store',
                        name: storeNames[storeIdx],
                        extX: bx,
                        extZ: doorZ + 1.8,
                        marker: m,
                        cash: 1800 + storeIdx * 550,
                        robbed: false,
                        reported: false
                    });
                    storeIdx++;
                } else if (seedCounter % 3 === 0 && houseIdx < 10) {
                    // Porta de Casa / Cobertura Entrável e Comprável (Verde Esmeralda)
                    houseIdx++;
                    const hm = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.2, 1.2, 0.25, 20),
                        new THREE.MeshBasicMaterial({ color: 0x10b981 })
                    );
                    hm.position.set(bx, 0.2, doorZ);
                    scene.add(hm);

                    enterableDoors.push({
                        id: `house_${houseIdx}`,
                        type: 'house',
                        name: isDowntown ? `Cobertura Eclipse #${houseIdx}` : `Mansão Ocean View #${houseIdx}`,
                        extX: bx,
                        extZ: doorZ + 1.8,
                        marker: hm,
                        price: isDowntown ? 5500 : 3200,
                        owned: houseIdx === 1 // Casa #1 já começa como seu apartamento inicial!
                    });
                    if (houseIdx === 1) hm.material.color.setHex(0x38bdf8);
                }

                seedCounter++;
            });
        });

        // =====================================================================
        // 3. EDIFÍCIOS ESPECIAIS ENTRÁVEIS: AMMU-NATION, DELEGACIA VCPD E PAY 'N' SPRAY
        // =====================================================================
        // Lojas de Armas Ammu-Nation (Laranja)
        [
            { name: "Ammu-Nation Ocean Beach", x: 58, z: 18 },
            { name: "Ammu-Nation Downtown", x: -58, z: -18 }
        ].forEach((aSpot, idx) => {
            const bld = new THREE.Mesh(
                new THREE.BoxGeometry(10, 5.4, 10),
                new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.45 })
            );
            bld.position.set(aSpot.x, 2.7, aSpot.z);
            const sign = new THREE.Mesh(
                new THREE.BoxGeometry(9.2, 1.1, 0.45),
                new THREE.MeshBasicMaterial({ color: 0xf97316 })
            );
            sign.position.set(aSpot.x, 4.8, aSpot.z + 5.1);
            scene.add(bld, sign);

            colliders.push({ minX: aSpot.x - 5, maxX: aSpot.x + 5, minZ: aSpot.z - 5, maxZ: aSpot.z + 5, tag: 'gunshop' });

            const am = new THREE.Mesh(
                new THREE.CylinderGeometry(1.3, 1.3, 0.25, 20),
                new THREE.MeshBasicMaterial({ color: 0xf97316 })
            );
            am.position.set(aSpot.x, 0.2, aSpot.z + 6.8);
            scene.add(am);

            enterableDoors.push({
                id: `gunshop_${idx}`,
                type: 'gunshop',
                name: aSpot.name,
                extX: aSpot.x,
                extZ: aSpot.z + 8.6,
                marker: am
            });
        });

        // Delegacia Central VCPD (Azul Polícia - Entrável!)
        const pdX = -58, pdZ = 56;
        const pdBld = new THREE.Mesh(
            new THREE.BoxGeometry(14, 7.5, 12),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
        );
        pdBld.position.set(pdX, 3.75, pdZ);
        const pdSign = new THREE.Mesh(
            new THREE.BoxGeometry(12, 1.2, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        );
        pdSign.position.set(pdX, 6.6, pdZ + 6.1);
        scene.add(pdBld, pdSign);
        colliders.push({ minX: pdX - 7, maxX: pdX + 7, minZ: pdZ - 6, maxZ: pdZ + 6, tag: 'police_hq' });

        const pdMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.3, 0.25, 20),
            new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        );
        pdMarker.position.set(pdX, 0.2, pdZ + 7.8);
        scene.add(pdMarker);
        enterableDoors.push({
            id: 'police_hq_0',
            type: 'police',
            name: 'Delegacia Central VCPD',
            extX: pdX,
            extZ: pdZ + 9.6,
            marker: pdMarker
        });

        // Garagens Pay 'n' Spray (Oficina de Reparo, Pintura Neon e Nitro)
        [
            { name: "Pay 'n' Spray Ocean Beach", x: 58, z: -18 },
            { name: "Pay 'n' Spray Downtown", x: -58, z: 18 }
        ].forEach(gSpot => {
            const bay = new THREE.Mesh(
                new THREE.BoxGeometry(9.5, 4.8, 10),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
            );
            bay.position.set(gSpot.x, 2.4, gSpot.z);
            const arch = new THREE.Mesh(
                new THREE.BoxGeometry(9.8, 0.7, 0.6),
                new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
            );
            arch.position.set(gSpot.x, 4.9, gSpot.z + 5.1);
            scene.add(bay, arch);

            colliders.push({ minX: gSpot.x - 4.75, maxX: gSpot.x + 4.75, minZ: gSpot.z - 5, maxZ: gSpot.z + 5, tag: 'garage' });

            const gm = new THREE.Mesh(
                new THREE.CylinderGeometry(2.7, 2.7, 0.2, 24),
                new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
            );
            gm.position.set(gSpot.x, 0.16, gSpot.z + 7.4);
            scene.add(gm);
            garages.push({ name: gSpot.name, x: gSpot.x, z: gSpot.z + 7.4, marker: gm });
        });

        // Palmeiras na Orla
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
        for (let pz = -210; pz <= 210; pz += 20) {
            const palm = new THREE.Group();
            palm.position.set(158, 0, pz);
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 8.5, 7), trunkMat);
            trunk.position.y = 4.25;
            palm.add(trunk);
            for (let a = 0; a < 5; a++) {
                const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 3.2), leafMat);
                leaf.position.set(Math.cos(a * 1.25) * 1.3, 8.4, Math.sin(a * 1.25) * 1.3);
                leaf.rotation.y = a * 1.25;
                leaf.rotation.x = 0.35;
                palm.add(leaf);
            }
            scene.add(palm);
        }

        const missionMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.3, 0.3, 20),
            new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        missionMarker.position.set(45, 0.15, -42);
        scene.add(missionMarker);

        // =====================================================================
        // 4. CONSTRUÇÃO DOS 4 INTERIORES COMPLETOS NO SUBSOLO (Y = -40)
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

        // [A] INTERIOR 1: MERCADO / LOJA 24/7 (Centro: X = 0, Z = 0, Y = -40)
        const storeShell = buildRoomShell(0, 0, 20, 20, 0x311042, 0x1e293b);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        [-6.5, 6.5].forEach(sx => {
            const sh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 8), shelfMat);
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

        // [B] INTERIOR 2: CASA / COBERTURA DE LUXO (Centro: X = 60, Z = 0, Y = -40)
        const houseShell = buildRoomShell(60, 0, 22, 22, 0x1e1b4b, 0x27272a);
        const sofa = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.1, 2.0), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        sofa.position.set(-4.5, 0.55, -2.5);
        const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.2), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
        tvScreen.position.set(-4.5, 2.4, -10.5);
        const bed = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 5.0), new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
        bed.position.set(5.5, 0.45, -5.5);
        const savePad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 20), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        savePad.position.set(5.5, 0.1, -1.5);
        houseShell.add(sofa, tvScreen, bed, savePad);

        interiorColliders.house = [
            { minX: 52.5, maxX: 58.5, minZ: -3.6, maxZ: -1.4 },
            { minX: 63.3, maxX: 67.7, minZ: -8.2, maxZ: -2.8 }
        ];

        // [C] INTERIOR 3: AMMU-NATION LOJA DE ARMAS (Centro: X = 120, Z = 0, Y = -40)
        const gunShell = buildRoomShell(120, 0, 20, 20, 0x450a0a, 0x18181b);
        const gunCounter = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        gunCounter.position.set(0, 0.6, -2.5);
        const weaponWall = new THREE.Mesh(new THREE.BoxGeometry(11, 3.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        weaponWall.position.set(0, 3.0, -9.5);
        const buyPad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.15, 20), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        buyPad.position.set(0, 0.1, -0.5);
        gunShell.add(gunCounter, weaponWall, buyPad);

        const gunDealerChar = VCModels.createHuman3D({ seed: 888 });
        gunDealerChar.mesh.position.set(120, -40, -4.4);
        scene.add(gunDealerChar.mesh);

        interiorColliders.gunshop = [
            { minX: 115.0, maxX: 125.0, minZ: -3.5, maxZ: -1.5 }
        ];

        // [D] INTERIOR 4: DELEGACIA CENTRAL VCPD (Centro: X = 180, Z = 0, Y = -40)
        const pdShell = buildRoomShell(180, 0, 22, 22, 0x0f172a, 0x1e293b);
        const pdDesk = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.5), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
        pdDesk.position.set(0, 0.6, -3.5);
        const jailBars = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: true }));
        jailBars.position.set(-5.5, 2.25, -7.5);
        const copArmoryPad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        copArmoryPad.position.set(5.5, 0.1, -6.5);
        pdShell.add(pdDesk, jailBars, copArmoryPad);

        const deskCopChar = VCModels.createHuman3D({ isCop: true, seed: 777 });
        deskCopChar.mesh.position.set(180, -40, -5.2);
        scene.add(deskCopChar.mesh);

        interiorColliders.police = [
            { minX: 175.8, maxX: 184.2, minZ: -4.4, maxZ: -2.6 }
        ];

        const interiorRooms = {
            store:   { cx: 0,   cz: 0, spawnZ: 7.2, exitZ: 8.6, actionZ: -1.8 },
            house:   { cx: 60,  cz: 0, spawnZ: 7.8, exitZ: 9.4, actionX: 65.5, actionZ: -1.5 },
            gunshop: { cx: 120, cz: 0, spawnZ: 7.2, exitZ: 8.6, actionX: 120,  actionZ: -0.5 },
            police:  { cx: 180, cz: 0, spawnZ: 7.8, exitZ: 9.4, actionX: 185.5, actionZ: -6.5 }
        };

        // =====================================================================
        // 5. FROTA DE VEÍCULOS E POPULAÇÃO DE PEDESTRES
        // =====================================================================
        const carColors = [0xec4899, 0x06b6d4, 0xfacc15, 0xa855f7, 0xf8fafc, 0xef4444];
        const carNames = ['Infernus Neon', 'Cheetah V8', 'Banshee Turbo', 'Comet GT', 'Stinger Cabrio', 'VCPD Cruiser'];
        for (let i = 0; i < 18; i++) {
            const isCop = (i % 5 === 4);
            const built = VCModels.createCar3D(carColors[i % carColors.length], isCop);
            const laneX = i % 2 === 0 ? 27 : -44;
            const laneZ = -190 + i * 22;
            built.mesh.position.set(laneX, 0, laneZ);
            scene.add(built.mesh);
            vehicles.push({
                ...built,
                name: isCop ? 'Viatura VCPD' : carNames[i % carNames.length],
                isCopCar: isCop,
                speed: 0,
                maxSpeed: isCop ? 0.68 : 0.76,
                angle: i % 2 === 0 ? 0 : Math.PI,
                aiDir: i % 2 === 0 ? -1 : 1,
                hp: 100,
                hasNitro: false,
                burningTimer: 0,
                destroyed: false
            });
        }

        for (let i = 0; i < 38; i++) {
            const char = VCModels.createHuman3D({ seed: i * 37 + 11 });
            const px = (i % 2 === 0 ? 34 : -50) + ((i % 5) - 2) * 3.5;
            const pz = -180 + i * 9.5;
            char.mesh.position.set(px, 0, pz);
            scene.add(char.mesh);
            peds.push({
                char,
                angle: Math.random() * Math.PI * 2,
                alive: true,
                hp: 50,
                panic: false,
                isFemale: i % 2 === 1
            });
        }

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
            interior: { clerkChar, alarmLight, gunDealerChar, deskCopChar }
        };
    }
};
