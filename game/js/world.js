// game/js/world.js - Mapa Urbano Denso, Hitboxes Reais, Interiores de Lojas com Balcão, Caixa, Prateleiras e Alarme

window.VCWorld = {
    buildCity(scene) {
        const colliders = []; // Sistema de Hitbox 3D (minX, maxX, minZ, maxZ, tag)
        const stores = [];
        const houses = [];
        const vehicles = [];
        const peds = [];

        // 1. Malha Viária, Rio, Ponte e Praia Dourada
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

        // Pontes de ligação entre Ilha Leste e Ilha Oeste
        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
        [-140, 0, 140].forEach(bz => {
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(42, 0.6, 18), bridgeMat);
            bridge.position.set(0, 0.25, bz);
            scene.add(bridge);
        });

        // 2. Quarteirões Densos de Prédios, Lojas e Casas com Hitboxes Exatas
        const palettes = [
            ['#f472b6', '#22d3ee'], ['#38bdf8', '#facc15'], ['#a855f7', '#ec4899'],
            ['#fb923c', '#38bdf8'], ['#34d399', '#f472b6'], ['#f8fafc', '#06b6d4']
        ];

        const xCoords = [-168, -134, -100, -64, 42, 76, 110, 142];
        const zCoords = [-192, -158, -112, -76, -36, 36, 76, 112, 158, 192];

        const storeNames = [
            "Vice 24/7 Market", "Neon Liquor & Guns", "Ocean Beach Pharmacy",
            "Downtown Pawn Shop", "Starlight Electronics", "Malibu Convenience"
        ];

        let seedCounter = 1;
        xCoords.forEach(bx => {
            zCoords.forEach(bz => {
                // Preserva avenidas principais, pontes e área inicial do jogador
                if (Math.abs(bz) < 22 || Math.abs(bz - 140) < 22 || Math.abs(bz + 140) < 22) return;
                if (Math.abs(bx - 45) < 16 && Math.abs(bz + 15) < 16) return;

                const width = 19 + (seedCounter % 6);
                const depth = 19 + ((seedCounter * 3) % 6);
                const isDowntown = bx < 0;
                const height = isDowntown ? (28 + (seedCounter % 34)) : (15 + (seedCounter % 18));

                const [c1, c2] = palettes[seedCounter % palettes.length];
                const isShop = (seedCounter % 5 === 0 && stores.length < storeNames.length);
                const tex = VCTextures.createBuildingTexture(c1, c2, isShop, seedCounter);

                const bMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(width, height, depth),
                    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
                );
                bMesh.position.set(bx, height / 2, bz);
                scene.add(bMesh);

                // Calçada elevada ao redor do quarteirão
                const sw = new THREE.Mesh(
                    new THREE.BoxGeometry(width + 4.4, 0.16, depth + 4.4),
                    new THREE.MeshStandardMaterial({ map: VCTextures.createSidewalkTexture(seedCounter) })
                );
                sw.position.set(bx, 0.08, bz);
                scene.add(sw);

                // Registra Hitbox exata do prédio
                colliders.push({
                    minX: bx - width / 2,
                    maxX: bx + width / 2,
                    minZ: bz - depth / 2,
                    maxZ: bz + depth / 2,
                    tag: 'building'
                });

                // Postes de luz nas esquinas
                if (seedCounter % 2 === 0 && window.VCModels) {
                    scene.add(VCModels.createStreetLight3D(bx + width / 2 + 1.8, bz + depth / 2 + 1.8));
                }

                // Lojas Entráveis e Assaltáveis (Marcador Dourado na Porta)
                if (isShop) {
                    const doorZ = bz + depth / 2 + 2.4;
                    const m = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.2, 1.2, 0.25, 20),
                        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
                    );
                    m.position.set(bx, 0.2, doorZ);
                    scene.add(m);

                    // Letreiro 3D acima da porta da loja
                    const signBoard = new THREE.Mesh(
                        new THREE.BoxGeometry(6.5, 1.2, 0.4),
                        new THREE.MeshBasicMaterial({ color: 0xec4899 })
                    );
                    signBoard.position.set(bx, 4.2, bz + depth / 2 + 0.25);
                    scene.add(signBoard);

                    stores.push({
                        name: storeNames[stores.length],
                        x: bx,
                        z: bz,
                        exitX: bx,
                        exitZ: doorZ + 1.8,
                        cash: 1500 + stores.length * 500,
                        robbed: false,
                        reported: false,
                        marker: m
                    });
                }

                // Casas e Coberturas Compráveis (Marcador Verde na Porta)
                if (!isShop && seedCounter % 9 === 0 && houses.length < 5) {
                    const doorZ = bz + depth / 2 + 2.4;
                    const hm = new THREE.Mesh(
                        new THREE.CylinderGeometry(1.2, 1.2, 0.25, 20),
                        new THREE.MeshBasicMaterial({ color: 0x10b981 })
                    );
                    hm.position.set(bx, 0.2, doorZ);
                    scene.add(hm);
                    houses.push({
                        name: isDowntown ? `Cobertura Downtown #${houses.length + 1}` : `Villa Ocean Beach #${houses.length + 1}`,
                        x: bx,
                        z: bz,
                        price: isDowntown ? 5500 : 3500,
                        owned: false,
                        marker: hm
                    });
                }

                seedCounter++;
            });
        });

        // 3. Palmeiras na Orla da Praia
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

        // 4. Marcador de Missão [V]
        const missionMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.3, 0.3, 20),
            new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        missionMarker.position.set(45, 0.15, -42);
        scene.add(missionMarker);

        // 5. Frota de Veículos nas Avenidas (Com Hitbox Dinâmica)
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
                hitboxHalfW: 1.15,
                hitboxHalfL: 2.25
            });
        }

        // 6. População de Pedestres (+5.000 variações com HP e Hitbox)
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
                isFemale: i % 2 === 1,
                radius: 0.45
            });
        }

        // 7. INTERIOR DETALHADO DAS LOJAS (Subterrâneo Y = -40)
        const intGroup = new THREE.Group();
        intGroup.position.set(0, -40, 0);

        // Piso quadriculado da loja
        const intFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
        );
        intFloor.rotation.x = -Math.PI / 2;
        intGroup.add(intFloor);

        // Paredes Neon da Loja
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x311042, roughness: 0.6 });
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 6.5, 0.5), wallMat);
        backWall.position.set(0, 3.25, -8.5);
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.5, 20), wallMat);
        leftWall.position.set(-9.5, 3.25, 0);
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.5, 20), wallMat);
        rightWall.position.set(9.5, 3.25, 0);
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(20, 6.5, 0.5), wallMat);
        frontWall.position.set(0, 3.25, 9.2);
        intGroup.add(backWall, leftWall, rightWall, frontWall);

        // Prateleiras com produtos coloridos nas laterais
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const prodColors = [0xfacc15, 0x06b6d4, 0xec4899, 0x10b981];
        [-6.5, 6.5].forEach(sx => {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 8.0), shelfMat);
            shelf.position.set(sx, 1.6, 0.5);
            intGroup.add(shelf);

            for (let py = 0.8; py <= 2.8; py += 1.0) {
                for (let pz = -2.8; pz <= 3.8; pz += 1.1) {
                    const box = new THREE.Mesh(
                        new THREE.BoxGeometry(0.5, 0.45, 0.5),
                        new THREE.MeshStandardMaterial({ color: prodColors[Math.abs(Math.floor(pz + py)) % prodColors.length] })
                    );
                    box.position.set(sx + (sx < 0 ? 0.55 : -0.55), py, pz);
                    intGroup.add(box);
                }
            }
        });

        // Balcão Principal + Caixa Registradora + Botão de Alarme Silencioso
        const counter = new THREE.Mesh(
            new THREE.BoxGeometry(8.5, 1.15, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3 })
        );
        counter.position.set(0, 0.58, -3.5);
        intGroup.add(counter);

        const cashRegister = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.65, 0.7),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6 })
        );
        cashRegister.position.set(0, 1.45, -3.5);
        intGroup.add(cashRegister);

        // Luz de Alarme Silencioso na Parede (Pisca em vermelho quando a loja denuncia o roubo!)
        const alarmLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x334155 })
        );
        alarmLight.position.set(0, 5.2, -8.1);
        intGroup.add(alarmLight);

        // Porta de Saída Azul Neon
        const exitDoor = new THREE.Mesh(
            new THREE.BoxGeometry(2.8, 3.4, 0.35),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        exitDoor.position.set(0, 1.7, 8.85);
        intGroup.add(exitDoor);

        scene.add(intGroup);

        // Hitboxes internas da loja (Balcão e Prateleiras para ninguém atravessar)
        const interiorColliders = [
            { minX: -4.4, maxX: 4.4, minZ: -4.4, maxZ: -2.6, tag: 'counter' },
            { minX: -7.4, maxX: -5.6, minZ: -3.6, maxZ: 4.6, tag: 'shelf' },
            { minX: 5.6, maxX: 7.4, minZ: -3.6, maxZ: 4.6, tag: 'shelf' }
        ];

        // Atendente da Loja Articulado atrás do balcão
        const clerkChar = VCModels.createHuman3D({ seed: 999 });
        clerkChar.mesh.position.set(0, -40, -5.2);
        scene.add(clerkChar.mesh);

        return {
            colliders,
            interiorColliders,
            stores,
            houses,
            missionMarker,
            vehicles,
            peds,
            interior: {
                clerkChar,
                alarmLight,
                cashRegister
            }
        };
    }
};
