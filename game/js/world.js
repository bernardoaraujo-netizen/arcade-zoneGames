// game/js/world.js - Mundo Aberto Gigante (Escala Vice City), Pontes, Lojas Entráveis e Casas Compráveis

window.VCWorld = {
    buildCity(scene) {
        const buildings = [];
        const roadTex = VCTextures.createRoadTexture();
        roadTex.repeat.set(22, 22);
        const sidewalkTex = VCTextures.createSidewalkTexture();

        // 1. Malha Urbana Gigante (600 x 600)
        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(600, 600),
            new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9 })
        );
        road.rotation.x = -Math.PI / 2;
        scene.add(road);

        // Canal de Água Central (Divide Ilha Leste e Ilha Oeste como Vice City)
        const canal = new THREE.Mesh(
            new THREE.PlaneGeometry(36, 600),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.4 })
        );
        canal.rotation.x = -Math.PI / 2;
        canal.position.set(0, 0.03, 0);
        scene.add(canal);

        // 3 Pontes Conectando os Dois Lados da Cidade
        [-140, 0, 140].forEach(bz => {
            const bridge = new THREE.Mesh(
                new THREE.BoxGeometry(40, 0.6, 20),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
            );
            bridge.position.set(0, 0.3, bz);
            scene.add(bridge);

            // Guard-rails da Ponte
            [-9.5, 9.5].forEach(rz => {
                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(40, 1.1, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
                );
                rail.position.set(0, 0.9, bz + rz);
                scene.add(rail);
            });
        });

        // Praia Leste e Oceano Atlântico
        const beach = new THREE.Mesh(
            new THREE.PlaneGeometry(65, 600),
            new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 1 })
        );
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(215, 0.03, 0);
        scene.add(beach);

        const ocean = new THREE.Mesh(
            new THREE.PlaneGeometry(120, 600),
            new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.35 })
        );
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.set(305, 0.02, 0);
        scene.add(ocean);

        // 2. Quarteirões, Arranha-céus Downtown e Hotéis Art Deco
        const palettes = [
            ['#f472b6', '#22d3ee'], ['#38bdf8', '#facc15'],
            ['#c084fc', '#f43f5e'], ['#fbbf24', '#a855f7'],
            ['#1e293b', '#38bdf8']
        ];

        const xBlocks = [-160, -120, -80, -45, 45, 80, 120, 160];
        for (let x of xBlocks) {
            for (let z = -210; z <= 210; z += 42) {
                // Deixa espaço livre nas avenidas das pontes
                if (Math.abs(z) < 18 || Math.abs(z - 140) < 18 || Math.abs(z + 140) < 18) continue;

                const isDowntown = x < -40;
                const bh = isDowntown ? (22 + Math.random() * 34) : (14 + Math.random() * 18);
                const pal = palettes[Math.floor(Math.random() * palettes.length)];

                const bMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(18, bh, 18),
                    new THREE.MeshStandardMaterial({
                        map: VCTextures.createBuildingTexture(pal[0], pal[1], false),
                        roughness: 0.55
                    })
                );
                bMesh.position.set(x, bh / 2, z);
                scene.add(bMesh);

                const sidewalk = new THREE.Mesh(
                    new THREE.BoxGeometry(22, 0.16, 22),
                    new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.85 })
                );
                sidewalk.position.set(x, 0.08, z);
                scene.add(sidewalk);

                scene.add(VCModels.createStreetLight3D(x + 10.2, z + 10.2));
                buildings.push({ x, z, half: 9.4 });
            }
        }

        // Palmeiras na Orla
        for (let z = -240; z <= 240; z += 24) {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.40, 7.0, 10), new THREE.MeshStandardMaterial({ color: 0x78350f }));
            trunk.position.set(188, 3.5, z);
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.0, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
            leaves.position.set(188, 7.0, z);
            scene.add(trunk, leaves);
        }

        // 3. LOJAS COM INTERIOR ENTRÁVEL & ASSALTO REAL
        const stores = [
            { id: 'jewelry', name: "Joalheria Ocean Drive", x: 160, z: -42, robbed: false, cash: 2200 },
            { id: 'mart', name: "Conveniência Vice 24h", x: 80, z: 42, robbed: false, cash: 1100 },
            { id: 'ammu', name: "Ammu-Nation Downtown", x: -80, z: -42, robbed: false, cash: 1800 },
            { id: 'malibu', name: "Clube Malibu VIP", x: 120, z: -126, robbed: false, cash: 3500 }
        ];

        stores.forEach(st => {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(1.5, 2.2, 28),
                new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(st.x, 0.20, st.z + 11.5);
            st.marker = ring;
            scene.add(ring);
        });

        // Constrói uma sala de Interior 3D isolada (em Y = -40) para quando o jogador entrar em qualquer loja
        const interiorGroup = new THREE.Group();
        interiorGroup.position.set(0, -40, 0);
        scene.add(interiorGroup);

        const intFloor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshStandardMaterial({ color: 0x334155 }));
        intFloor.rotation.x = -Math.PI / 2;
        const intWallBack = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 0.5), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        intWallBack.position.set(0, 2.5, -9);
        const intWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 18), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        intWallLeft.position.set(-9, 2.5, 0);
        const intWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 18), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        intWallRight.position.set(9, 2.5, 0);
        const counter = new THREE.Mesh(new THREE.BoxGeometry(8, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
        counter.position.set(0, 0.55, -4.5);

        // Porta de Saída do Interior
        const exitRing = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.8, 24),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
        );
        exitRing.rotation.x = -Math.PI / 2;
        exitRing.position.set(0, 0.05, 7.0);

        // Atendente Humano Articulado atrás do balcão
        const clerkChar = VCModels.createHuman3D({
            customDna: {
                skinHex: '#f1c27d', hairColor: 0x451a03, shirtHex: '#facc15', pantsColor: 0x0f172a,
                shoeColor: 0x000000, shirtStyle: 'stripes', accessory: 'none', hasBeard: true,
                buildScale: 1.0, strideFreq: 1.0, armSwingAmp: 0.8, postureTilt: 0
            }
        });
        clerkChar.mesh.position.set(0, -40, -6.2);
        scene.add(clerkChar.mesh);

        interiorGroup.add(intFloor, intWallBack, intWallLeft, intWallRight, counter, exitRing);

        // 4. CASAS & MANSÕES COMPRÁVEIS (SAFEHOUSES)
        const houses = [
            { id: 'ocean_apt', name: "Apartamento Ocean View", x: 160, z: 42, price: 1500, owned: false },
            { id: 'downtown_loft', name: "Cobertura Downtown", x: -120, z: 42, price: 4000, owned: false },
            { id: 'vercetti_mansion', name: "Mansão Vercetti Estate", x: -160, z: -126, price: 9500, owned: false }
        ];

        houses.forEach(hs => {
            const hRing = new THREE.Mesh(
                new THREE.RingGeometry(1.5, 2.2, 28),
                new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
            );
            hRing.rotation.x = -Math.PI / 2;
            hRing.position.set(hs.x, 0.20, hs.z + 11.5);
            hs.marker = hRing;
            scene.add(hRing);
        });

        // 5. Marcador de Missão [V]
        const missionMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 1.8, 0.25, 28),
            new THREE.MeshBasicMaterial({ color: 0xec4899 })
        );
        missionMarker.position.set(45, 0.12, -42);
        scene.add(missionMarker);

        // 6. Frota de Veículos Espalhados pelos Distritos
        const vehicles = [];
        const carConfigs = [
            { name: "Infernus Neon", color: 0xec4899, x: 32, z: -12, maxSpeed: 0.78 },
            { name: "Cheetah Vice", color: 0xfacc15, x: 100, z: 20, maxSpeed: 0.72 },
            { name: "Banshee Turbo", color: 0x22d3ee, x: -62, z: 18, maxSpeed: 0.70 },
            { name: "Stinger V8", color: 0xa855f7, x: -102, z: -60, maxSpeed: 0.71 },
            { name: "Comet Cabrio", color: 0x10b981, x: 140, z: 80, maxSpeed: 0.68 },
            { name: "Viatura VCPD", color: 0x111827, x: 60, z: -30, maxSpeed: 0.66, isCopCar: true }
        ];
        carConfigs.forEach(cfg => {
            const carBuilt = VCModels.createCar3D(cfg.color, cfg.isCopCar);
            carBuilt.mesh.position.set(cfg.x, 0, cfg.z);
            scene.add(carBuilt.mesh);
            vehicles.push({
                ...carBuilt,
                name: cfg.name,
                maxSpeed: cfg.maxSpeed,
                speed: 0,
                steer: 0,
                angle: 0,
                aiDir: 1,
                isCopCar: cfg.isCopCar || false
            });
        });

        // 7. População de NPCs Humanos Articulados pelo Mapa Aberto
        const peds = [];
        for (let i = 0; i < 34; i++) {
            const pedChar = VCModels.createHuman3D({ seed: Math.floor(Math.random() * 5000) });
            const rx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 145);
            const rz = -190 + Math.random() * 380;
            pedChar.mesh.position.set(rx, 0, rz);
            scene.add(pedChar.mesh);
            peds.push({
                char: pedChar,
                angle: Math.random() * Math.PI * 2,
                panic: false,
                alive: true,
                isFemale: (i % 2 === 0)
            });
        }

        return {
            buildings,
            stores,
            houses,
            missionMarker,
            vehicles,
            peds,
            interior: { clerkChar, exitRing, counter }
        };
    }
};
