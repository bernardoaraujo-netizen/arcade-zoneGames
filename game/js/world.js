// game/js/world.js - Metrópole Otimizada (60 FPS), Ruas 12m, Calçadas Elevadas, NPCs Interativos e Interiores

window.VCWorld = {
    buildCity(scene) {
        const colliders = [];
        const sidewalkZones = [];
        const interiorColliders = {};
        const enterableDoors = [];
        const garages = [];
        const streetLamps = [];
        const vehicles = [];
        const peds = [];
        const animals = [];
        const clouds = [];
        const stuntRamps = [];

        const roadTex = VCTextures.createRoadTexture(1);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(160, 160);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(3200, 3200),
            new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 })
        );
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.18, metalness: 0.65 });
        const river = new THREE.Mesh(new THREE.PlaneGeometry(36, 3200, 4, 32), waterMat);
        river.rotation.x = -Math.PI / 2;
        river.position.set(0, 0.08, 0);
        scene.add(river);

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
        [-19, 19].forEach(rx => {
            const curb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 3200), wallMat);
            curb.position.set(rx, 0.35, 0);
            scene.add(curb);
        });

        const beach = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 3200),
            new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 })
        );
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(610, 0.03, 0);
        scene.add(beach);

        const oceanGeo = new THREE.PlaneGeometry(900, 3200, 24, 48);
        const ocean = new THREE.Mesh(oceanGeo, new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.14, metalness: 0.78 }));
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.set(1100, 0.18, 0);
        scene.add(ocean);

        const surfFoam = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 3200),
            new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65 })
        );
        surfFoam.rotation.x = -Math.PI / 2;
        surfFoam.position.set(650, 0.12, 0);
        scene.add(surfFoam);

        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
        const bridgeZs = [-660, -440, -220, 0, 220, 440, 660];
        bridgeZs.forEach(bz => {
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(44, 0.65, 14), bridgeMat);
            bridge.position.set(0, 0.35, bz);
            scene.add(bridge);
        });

        const palettes = [
            ['#f472b6', '#22d3ee'], ['#38bdf8', '#facc15'], ['#a855f7', '#ec4899'],
            ['#fb923c', '#38bdf8'], ['#34d399', '#f472b6'], ['#f8fafc', '#06b6d4']
        ];

        // Grade otimizada (leve e compacta): ruas de 12m, sem excesso de draw calls
        const xCoords = [];
        for (let x = -528; x <= -44; x += 44) xCoords.push(x);
        for (let x = 44; x <= 528; x += 44) xCoords.push(x);

        const zCoords = [];
        for (let z = -704; z <= 704; z += 44) zCoords.push(z);

        let seedCounter = 1;
        let storeIdx = 0, dinerIdx = 0, schoolIdx = 0, houseIdx = 0;

        const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 });
        const parkGeo = new THREE.BoxGeometry(32, 0.24, 32);
        const parkMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

        xCoords.forEach(bx => {
            zCoords.forEach(bz => {
                if (bridgeZs.some(brZ => Math.abs(bz - brZ) < 20)) return;
                if (Math.abs(bx - 88) < 38 && Math.abs(bz + 22) < 38) return;
                if (Math.abs(bx + 88) < 34 && Math.abs(bz - 44) < 34) return;
                if (bx < -420 && Math.abs(bz) < 260) return; // Aeroporto

                if (seedCounter % 14 === 0) {
                    const park = new THREE.Mesh(parkGeo, parkMat);
                    park.position.set(bx, 0.12, bz);
                    scene.add(park);
                    sidewalkZones.push({ minX: bx - 16, maxX: bx + 16, minZ: bz - 16, maxZ: bz + 16 });
                    if (window.VCModels) {
                        scene.add(VCModels.createTree3D(bx - 8, bz - 8, seedCounter));
                        scene.add(VCModels.createTree3D(bx + 8, bz + 8, seedCounter + 1));
                    }
                    seedCounter++;
                    return;
                }

                const isCenter = (Math.abs(bx) < 220 && Math.abs(bz) < 300);
                const width = 26;
                const depth = 26;
                const height = isCenter ? (38 + (seedCounter % 52)) : (15 + (seedCounter % 20));

                const [c1, c2] = palettes[seedCounter % palettes.length];
                const mod = seedCounter % 11;
                const isDiner = (mod === 1 && dinerIdx < 10);
                const isSchool = (mod === 2 && schoolIdx < 6);
                const isShop = (mod === 3 && storeIdx < 12);
                const isHouse = (mod === 4 && houseIdx < 14);

                const tex = VCTextures.createBuildingTexture(c1, c2, isShop || isDiner, seedCounter);
                const bMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(width, height, depth),
                    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
                );
                bMesh.position.set(bx, height / 2, bz);
                scene.add(bMesh);

                const sw = new THREE.Mesh(new THREE.BoxGeometry(32, 0.24, 32), sidewalkMat);
                sw.position.set(bx, 0.12, bz);
                scene.add(sw);

                sidewalkZones.push(
                    { minX: bx - 15.8, maxX: bx + 15.8, minZ: bz + 13.2, maxZ: bz + 15.8 },
                    { minX: bx - 15.8, maxX: bx + 15.8, minZ: bz - 15.8, maxZ: bz - 13.2 },
                    { minX: bx - 15.8, maxX: bx - 13.2, minZ: bz - 15.8, maxZ: bz + 15.8 },
                    { minX: bx + 13.2, maxX: bx + 15.8, minZ: bz - 15.8, maxZ: bz + 15.8 }
                );

                colliders.push({
                    minX: bx - width / 2,
                    maxX: bx + width / 2,
                    minZ: bz - depth / 2,
                    maxZ: bz + depth / 2,
                    tag: 'building'
                });

                if (window.VCModels) {
                    if (seedCounter % 8 === 0) {
                        const post = VCModels.createStreetLight3D(bx + 14.8, bz + 14.8);
                        scene.add(post);
                        if (post.children[1]) streetLamps.push(post.children[1]);
                    }
                    if (seedCounter % 6 === 0) {
                        scene.add(VCModels.createTree3D(bx - 14.8, bz + 14.8, seedCounter));
                    }
                }

                const doorZ = bz + depth / 2 + 1.8;

                if (isDiner) {
                    dinerIdx++;
                    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.28, 16), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
                    m.position.set(bx, 0.26, doorZ);
                    const sign = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.2, 0.45), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
                    sign.position.set(bx, 4.4, bz + depth / 2 + 0.3);
                    scene.add(m, sign);
                    enterableDoors.push({ id: `diner_${dinerIdx}`, type: 'diner', name: `Lanchonete ArcadeZone Burger #${dinerIdx}`, extX: bx, extZ: doorZ + 1.6, marker: m });
                } else if (isSchool) {
                    schoolIdx++;
                    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.28, 16), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
                    m.position.set(bx, 0.26, doorZ);
                    const sign = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.2, 0.45), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
                    sign.position.set(bx, 4.6, bz + depth / 2 + 0.3);
                    scene.add(m, sign);
                    enterableDoors.push({ id: `school_${schoolIdx}`, type: 'school', name: `Colégio Estadual da Capital #${schoolIdx}`, extX: bx, extZ: doorZ + 1.6, marker: m });
                } else if (isShop) {
                    storeIdx++;
                    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.28, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
                    m.position.set(bx, 0.26, doorZ);
                    scene.add(m);
                    enterableDoors.push({ id: `store_${storeIdx}`, type: 'store', name: `Supermercado Capital 24h #${storeIdx}`, extX: bx, extZ: doorZ + 1.6, marker: m, cash: 2500 + storeIdx * 450, robbed: false, reported: false });
                } else if (isHouse) {
                    houseIdx++;
                    const hm = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.28, 16), new THREE.MeshBasicMaterial({ color: houseIdx === 1 ? 0x38bdf8 : 0x10b981 }));
                    hm.position.set(bx, 0.26, doorZ);
                    scene.add(hm);
                    enterableDoors.push({ id: `house_${houseIdx}`, type: 'house', name: isCenter ? `Cobertura Paulista #${houseIdx}` : `Mansão Jardim Europa #${houseIdx}`, extX: bx, extZ: doorZ + 1.6, marker: hm, price: isCenter ? 6500 : 3500, owned: houseIdx === 1 });
                }

                seedCounter++;
            });
        });

        // Praça Central, Rampas Stunt, Banco Central, Ammu-Nation, Delegacia, Oficinas e Aeroporto
        const plazaFloor = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 0.24, 28), sidewalkMat);
        plazaFloor.position.set(88, 0.12, -22);
        scene.add(plazaFloor);
        const fountain = VCModels.createFountain3D(88, -22);
        scene.add(fountain.mesh);

        const rampMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
        [
            { x: 66, z: -154, rotY: 0 },
            { x: -66, z: 154, rotY: Math.PI },
            { x: 580, z: -88, rotY: -Math.PI / 2 }
        ].forEach(rp => {
            const ramp = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.6, 11), rampMat);
            ramp.position.set(rp.x, 1.2, rp.z);
            ramp.rotation.y = rp.rotY;
            ramp.rotation.x = 0.24;
            scene.add(ramp);
            stuntRamps.push({ x: rp.x, z: rp.z, radius: 6.0 });
        });

        // Banco Central (-88, 44)
        const bankX = -88, bankZ = 44;
        const bankBuilding = new THREE.Mesh(new THREE.BoxGeometry(24, 16, 20), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.35 }));
        bankBuilding.position.set(bankX, 8, bankZ);
        const bankSign = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 0.6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        bankSign.position.set(bankX, 14, bankZ + 10.2);
        scene.add(bankBuilding, bankSign);
        colliders.push({ minX: bankX - 12, maxX: bankX + 12, minZ: bankZ - 10, maxZ: bankZ + 10, tag: 'bank' });

        const bankMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 20), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        bankMarker.position.set(bankX, 0.24, bankZ + 12.2);
        scene.add(bankMarker);
        enterableDoors.push({ id: 'central_bank', type: 'bank', name: 'Banco Central da Capital', extX: bankX, extZ: bankZ + 14.5, marker: bankMarker, robbed: false });

        // Ammu-Nation
        [
            { name: "Ammu-Nation Zona Leste", x: 132, z: 44 },
            { name: "Ammu-Nation Centro", x: -132, z: -44 }
        ].forEach((aSpot, idx) => {
            const bld = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 12), new THREE.MeshStandardMaterial({ color: 0x450a0a }));
            bld.position.set(aSpot.x, 3, aSpot.z);
            const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 0.5), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            sign.position.set(aSpot.x, 5.2, aSpot.z + 6.1);
            scene.add(bld, sign);
            colliders.push({ minX: aSpot.x - 6, maxX: aSpot.x + 6, minZ: aSpot.z - 6, maxZ: aSpot.z + 6, tag: 'gunshop' });
            const am = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 16), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            am.position.set(aSpot.x, 0.2, aSpot.z + 7.8);
            scene.add(am);
            enterableDoors.push({ id: `gunshop_${idx}`, type: 'gunshop', name: aSpot.name, extX: aSpot.x, extZ: aSpot.z + 9.8, marker: am });
        });

        // Delegacia VCPD
        const pdX = -132, pdZ = 132;
        const pdBld = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 14), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        pdBld.position.set(pdX, 4, pdZ);
        const pdSign = new THREE.Mesh(new THREE.BoxGeometry(14, 1.3, 0.5), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        pdSign.position.set(pdX, 7.0, pdZ + 7.1);
        scene.add(pdBld, pdSign);
        colliders.push({ minX: pdX - 8, maxX: pdX + 8, minZ: pdZ - 7, maxZ: pdZ + 7, tag: 'police_hq' });
        const pdMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        pdMarker.position.set(pdX, 0.2, pdZ + 9.0);
        scene.add(pdMarker);
        enterableDoors.push({ id: 'police_hq_0', type: 'police', name: 'Quartel General VCPD', extX: pdX, extZ: pdZ + 11.0, marker: pdMarker });

        // Garagens Pay 'n' Spray
        [
            { name: "Pay 'n' Spray Zona Leste", x: 132, z: -44 },
            { name: "Pay 'n' Spray Centro", x: -176, z: 44 }
        ].forEach(gSpot => {
            const bay = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 11), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
            bay.position.set(gSpot.x, 2.5, gSpot.z);
            const arch = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.7, 0.6), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
            arch.position.set(gSpot.x, 5.1, gSpot.z + 5.6);
            scene.add(bay, arch);
            colliders.push({ minX: gSpot.x - 5, maxX: gSpot.x + 5, minZ: gSpot.z - 5.5, maxZ: gSpot.z + 5.5, tag: 'garage' });
            const gm = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.2, 20), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
            gm.position.set(gSpot.x, 0.16, gSpot.z + 8.0);
            scene.add(gm);
            garages.push({ name: gSpot.name, x: gSpot.x, z: gSpot.z + 8.0, marker: gm });
        });

        // Aeroporto Internacional (-520)
        const runway = new THREE.Mesh(new THREE.PlaneGeometry(40, 460), new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 }));
        runway.rotation.x = -Math.PI / 2;
        runway.position.set(-520, 0.08, 0);
        scene.add(runway);
        const terminal = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 60), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 }));
        terminal.position.set(-560, 6, 0);
        scene.add(terminal);
        colliders.push({ minX: -571, maxX: -549, minZ: -30, maxZ: 30, tag: 'airport' });

        // Interiores no Subsolo (Y = -40)
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

        const storeShell = buildRoomShell(0, 0, 20, 20, 0x311042, 0x1e293b);
        const storeCounter = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.15, 1.5), new THREE.MeshStandardMaterial({ color: 0x090d16 }));
        storeCounter.position.set(0, 0.58, -3.5);
        const alarmLight = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshBasicMaterial({ color: 0x334155 }));
        alarmLight.position.set(0, 5.2, -9.5);
        storeShell.add(storeCounter, alarmLight);
        const clerkChar = VCModels.createHuman3D({ seed: 999 });
        clerkChar.mesh.position.set(0, -40, -5.2);
        scene.add(clerkChar.mesh);
        interiorColliders.store = [{ minX: -4.4, maxX: 4.4, minZ: -4.4, maxZ: -2.6 }];

        const houseShell = buildRoomShell(60, 0, 22, 22, 0x1e1b4b, 0x27272a);
        const bed = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 5.0), new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
        bed.position.set(5.5, 0.45, -5.5);
        const savePad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 16), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        savePad.position.set(5.5, 0.1, -1.5);
        houseShell.add(bed, savePad);
        interiorColliders.house = [{ minX: 63.3, maxX: 67.7, minZ: -8.2, maxZ: -2.8 }];

        const gunShell = buildRoomShell(120, 0, 20, 20, 0x450a0a, 0x18181b);
        const gunCounter = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        gunCounter.position.set(0, 0.6, -2.5);
        const buyPad = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.15, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        buyPad.position.set(0, 0.1, -0.5);
        gunShell.add(gunCounter, buyPad);
        const gunDealerChar = VCModels.createHuman3D({ seed: 888 });
        gunDealerChar.mesh.position.set(120, -40, -4.4);
        scene.add(gunDealerChar.mesh);
        interiorColliders.gunshop = [{ minX: 115.0, maxX: 125.0, minZ: -3.5, maxZ: -1.5 }];

        const pdShell = buildRoomShell(180, 0, 22, 22, 0x0f172a, 0x1e293b);
        const pdDesk = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.5), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }));
        pdDesk.position.set(0, 0.6, -3.5);
        const copArmoryPad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.15, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        copArmoryPad.position.set(5.5, 0.1, -6.5);
        pdShell.add(pdDesk, copArmoryPad);
        const deskCopChar = VCModels.createHuman3D({ isCop: true, seed: 777 });
        deskCopChar.mesh.position.set(180, -40, -5.2);
        scene.add(deskCopChar.mesh);
        interiorColliders.police = [{ minX: 175.8, maxX: 184.2, minZ: -4.4, maxZ: -2.6 }];

        const bankShell = buildRoomShell(240, 0, 26, 26, 0x1e293b, 0x0f172a);
        const bankTellerDesk = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: 0x334155 }));
        bankTellerDesk.position.set(0, 0.6, 1.5);
        const vaultDoor = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.6, 20), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 }));
        vaultDoor.rotation.x = Math.PI / 2;
        vaultDoor.position.set(0, 2.6, -12.4);
        const vaultPad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 20), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
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
            gChar.handWeaponSocket.add(VCModels.createWeapon3D('uzi'));
            gChar.mesh.position.set(240 + gx, -40, gz);
            scene.add(gChar.mesh);
            bankGuards.push({ char: gChar, alive: true, hp: 95, shootCooldown: 30 + idx * 10 });
        });
        interiorColliders.bank = [{ minX: 234.0, maxX: 246.0, minZ: 0.7, maxZ: 2.3 }];

        const dinerShell = buildRoomShell(300, 0, 22, 22, 0x4c0519, 0x18181b);
        const dinerCounter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.15, 1.5), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        dinerCounter.position.set(0, 0.58, -4.5);
        const foodPad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        foodPad.position.set(0, 0.1, -2.5);
        dinerShell.add(dinerCounter, foodPad);
        const dinerWorker = VCModels.createHuman3D({ seed: 444 });
        dinerWorker.mesh.position.set(300, -40, -6.2);
        scene.add(dinerWorker.mesh);
        interiorColliders.diner = [{ minX: 294.8, maxX: 305.2, minZ: -5.4, maxZ: -3.6 }];

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

        // Frota de Veículos
        const carColors = [0xec4899, 0x06b6d4, 0xfacc15, 0xa855f7, 0xf8fafc, 0xef4444];
        const carNames = ['Infernus Neon', 'Cheetah V8', 'Banshee Turbo', 'Comet GT', 'Stinger Cabrio'];

        for (let i = 0; i < 24; i++) {
            const isCop = (i % 6 === 5);
            const built = VCModels.createCar3D(carColors[i % carColors.length], isCop);
            const laneX = i % 2 === 0 ? 66 : -66;
            const laneZ = -600 + i * 52;
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

        [
            [64, -14], [76, -24], [104, -18], [116, 28], [-66, 24], [-110, -28]
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
            [655, -160], [655, -40], [655, 60], [655, 180], [10, -35], [-10, 45]
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

        [
            { isJet: false, x: -520, z: -140, name: 'Avião Bimotor Dodo' },
            { isJet: true,  x: -520, z: 70,   name: 'Caça Jato Hydra V-22' }
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

        // 72 NPCs Cidadãos concentrados nas calçadas da cidade e perto do Aeroporto/Centro
        const citizenLines = [
            "Olá! Bem-vindo a Arcade City!",
            "O Banco Central fica ali no Centro, mas é cheio de seguranças.",
            "Cuidado com os ladrões nas esquinas!",
            "Se bater o carro, passa na Pay 'n' Spray que fica novo.",
            "Que calor hoje em Arcade City!",
            "A polícia anda fazendo blitz perto da praça."
        ];

        for (let i = 0; i < 72; i++) {
            const char = VCModels.createHuman3D({ seed: i * 37 + 11 });
            // Garante que os primeiros NPCs fiquem perto do Centro e do Aeroporto para serem vistos na hora!
            let px, pz;
            if (i < 12) {
                px = 60 + (i % 4) * 14;
                pz = -30 + Math.floor(i / 4) * 18;
            } else if (i < 22) {
                px = -490 + (i % 5) * 12;
                pz = -20 + (i % 3) * 16;
            } else {
                const zone = sidewalkZones[(i * 3) % sidewalkZones.length] || { minX: 58, maxX: 60, minZ: -30, maxZ: -28 };
                px = (zone.minX + zone.maxX) * 0.5;
                pz = (zone.minZ + zone.maxZ) * 0.5;
            }
            char.mesh.position.set(px, 0.24, pz);
            scene.add(char.mesh);
            peds.push({
                char,
                role: 'citizen',
                speechLine: citizenLines[i % citizenLines.length],
                angle: (i % 4) * (Math.PI / 2),
                alive: true,
                hp: 55,
                aggroTarget: null,
                panic: false,
                talkTimer: 0,
                isFemale: i % 2 === 1
            });
        }

        // Gangues
        for (let g = 0; g < 16; g++) {
            const isPurple = g < 8;
            const role = isPurple ? 'gang_purple' : 'gang_green';
            const char = VCModels.createHuman3D({ role, seed: 200 + g });
            char.handWeaponSocket.add(VCModels.createWeapon3D(g % 2 === 0 ? 'bat' : 'pistol'));
            const gx = isPurple ? (102 + (g % 4) * 3) : (-148 - (g % 4) * 3);
            const gz = isPurple ? (-28 + (g % 4) * 12) : (58 + (g % 4) * 12);
            char.mesh.position.set(gx, 0.24, gz);
            scene.add(char.mesh);
            peds.push({ char, role, speechLine: "Sai da nossa área, mané!", hasBat: g % 2 === 0, hasGun: g % 2 === 1, angle: Math.random() * 6.28, alive: true, hp: 85, aggroTarget: null, panic: false, talkTimer: 0 });
        }

        // Ladrões
        for (let t = 0; t < 10; t++) {
            const char = VCModels.createHuman3D({ role: 'thief', seed: 400 + t });
            char.handWeaponSocket.add(VCModels.createWeapon3D('knife'));
            const zone = sidewalkZones[(t * 5 + 2) % sidewalkZones.length] || { minX: 58, maxX: 60, minZ: 14, maxZ: 16 };
            char.mesh.position.set((zone.minX + zone.maxX) * 0.5, 0.24, (zone.minZ + zone.maxZ) * 0.5);
            scene.add(char.mesh);
            peds.push({ char, role: 'thief', speechLine: "Passa a grana agora!", hasKnife: true, angle: Math.random() * 6.28, alive: true, hp: 70, aggroTarget: null, panic: false, stealCooldown: 180 + t * 40, talkTimer: 0 });
        }

        const animalColors = [0x92400e, 0xf8fafc, 0x18181b, 0xd97706, 0x64748b];
        for (let i = 0; i < 24; i++) {
            const species = i < 8 ? 'dog' : (i < 16 ? 'cat' : 'bird');
            const anim = VCModels.createAnimal3D(species, animalColors[i % animalColors.length]);
            const ay = species === 'bird' ? (18 + (i % 12)) : 0.24;
            anim.mesh.position.set(-250 + (i * 47) % 500, ay, -300 + (i * 61) % 600);
            scene.add(anim.mesh);
            animals.push({ ...anim, angle: Math.random() * 6.28, speed: species === 'bird' ? 0.18 : 0.055, baseY: ay });
        }

        for (let i = 0; i < 24; i++) {
            const cl = VCModels.createCloud3D(-800 + (i * 293) % 1600, 80 + (i % 4) * 14, -800 + (i * 351) % 1600);
            scene.add(cl);
            clouds.push(cl);
        }

        const missionMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
        missionMarker.position.set(66, 0.15, -32);
        scene.add(missionMarker);

        return {
            colliders, sidewalkZones, stuntRamps, interiorColliders, interiorRooms,
            enterableDoors, garages, streetLamps, missionMarker, vehicles, peds,
            animals, clouds, fountain, river, ocean, surfFoam,
            interior: { clerkChar, alarmLight, gunDealerChar, deskCopChar, bankStaff, bankGuards, dinerWorker, teacherChar, schoolStudents }
        };
    }
};
