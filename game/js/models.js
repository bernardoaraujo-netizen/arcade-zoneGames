// game/js/models.js - Modelos 3D Completos: Humanos Articulados, Armas Brancas (Faca, Bastão) e de Fogo,
// Deformação/Amassado de Lataria nos Carros, Árvores Urbanas, Animais, Bicicletas, Aeronaves e Nuvens

window.VCModels = {
    CharacterGenes: {
        skinTones: ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3818', '#3b2219'],
        hairColors: ['#09090b', '#1c1917', '#451a03', '#78350f', '#ca8a04', '#eab308', '#dc2626', '#94a3b8'],
        hairStyles: ['short', 'fade', 'afro', 'ponytail', 'mohawk', 'bald'],
        shirtColors: [
            '#06b6d4', '#ec4899', '#a855f7', '#f43f5e', '#10b981', '#f59e0b',
            '#3b82f6', '#ef4444', '#f8fafc', '#18181b', '#84cc16', '#14b8a6'
        ],
        shirtStyles: ['hawaiian', 'stripes', 'tanktop', 'jacket', 'plain'],
        pantsColors: [0x1e3a8a, 0x0f172a, 0xf8fafc, 0x3f3f46, 0x78350f, 0x064e3b, 0x831843, 0xd97706],
        shoeColors: [0xf8fafc, 0x111827, 0xdc2626, 0x2563eb, 0xfacc15],
        builds: [
            { scaleX: 0.92, scaleZ: 0.90, height: 0.96 },
            { scaleX: 1.00, scaleZ: 1.00, height: 1.00 },
            { scaleX: 1.14, scaleZ: 1.12, height: 1.03 },
            { scaleX: 1.24, scaleZ: 1.25, height: 0.98 },
            { scaleX: 0.88, scaleZ: 0.88, height: 1.04 }
        ]
    },

    generateRandomNPCGene(seedIndex = null) {
        const G = this.CharacterGenes;
        const pick = (arr, offset = 0) => seedIndex !== null
            ? arr[(seedIndex + offset) % arr.length]
            : arr[Math.floor(Math.random() * arr.length)];

        return {
            skinHex: pick(G.skinTones, 1),
            hairColor: pick(G.hairColors, 2),
            hairStyle: pick(G.hairStyles, 3),
            shirtHex: pick(G.shirtColors, 4),
            shirtStyle: pick(G.shirtStyles, 5),
            pantsColor: pick(G.pantsColors, 6),
            shoeColor: pick(G.shoeColors, 7),
            build: pick(G.builds, 8),
            hasBeard: Math.random() > 0.65,
            hasGlasses: Math.random() > 0.72,
            gaitFrequency: 0.85 + Math.random() * 0.35,
            armSwingAmp: 0.55 + Math.random() * 0.35
        };
    },

    // =========================================================================
    // 1. PERSONAGEM HUMANO ARTICULADO (COM PAPÉIS: GANGUE, LADRÃO, ALUNO, PROFESSOR, BANCÁRIO)
    // =========================================================================
    createHuman3D(options = {}) {
        let gene;
        if (options.customDna) {
            gene = {
                skinHex: options.customDna.skinHex || '#f1c27d',
                hairColor: options.customDna.hairColor || 0x1c1917,
                hairStyle: options.customDna.hairStyle || 'short',
                shirtHex: options.customDna.shirtHex || '#06b6d4',
                shirtStyle: options.customDna.shirtStyle || 'hawaiian',
                pantsColor: options.customDna.pantsColor || 0x1e3a8a,
                shoeColor: options.customDna.shoeColor || 0xf8fafc,
                build: {
                    scaleX: options.customDna.buildScale || 1.0,
                    scaleZ: options.customDna.buildScale || 1.0,
                    height: options.customDna.buildScale || 1.0
                },
                hasBeard: !!options.customDna.hasBeard,
                hasGlasses: options.customDna.accessory === 'glasses',
                gaitFrequency: options.customDna.strideFreq || 1.0,
                armSwingAmp: options.customDna.armSwingAmp || 0.75
            };
        } else if (options.isPlayer) {
            gene = {
                skinHex: '#f1c27d', hairColor: 0x1c1917, hairStyle: 'short',
                shirtHex: '#06b6d4', shirtStyle: 'hawaiian', pantsColor: 0x1e3a8a, shoeColor: 0xf8fafc,
                build: { scaleX: 1.02, scaleZ: 1.0, height: 1.02 },
                hasBeard: false, hasGlasses: false, gaitFrequency: 1.0, armSwingAmp: 0.68
            };
        } else if (options.role === 'banker') {
            gene = {
                skinHex: '#f1c27d', hairColor: 0x1c1917, hairStyle: 'fade',
                shirtHex: '#f8fafc', shirtStyle: 'plain', pantsColor: 0x0f172a, shoeColor: 0x09090b,
                build: { scaleX: 0.98, scaleZ: 0.98, height: 1.0 },
                hasBeard: false, hasGlasses: true, gaitFrequency: 1.0, armSwingAmp: 0.6
            };
        } else if (options.role === 'teacher') {
            gene = {
                skinHex: '#e0ac69', hairColor: 0x78350f, hairStyle: 'ponytail',
                shirtHex: '#3b82f6', shirtStyle: 'plain', pantsColor: 0x1e293b, shoeColor: 0x111827,
                build: { scaleX: 0.96, scaleZ: 0.96, height: 1.01 },
                hasBeard: false, hasGlasses: true, gaitFrequency: 1.0, armSwingAmp: 0.65
            };
        } else if (options.role === 'student') {
            gene = {
                skinHex: '#ffdbac', hairColor: 0x451a03, hairStyle: 'short',
                shirtHex: '#a855f7', shirtStyle: 'stripes', pantsColor: 0x1e3a8a, shoeColor: 0xf8fafc,
                build: { scaleX: 0.85, scaleZ: 0.85, height: 0.86 },
                hasBeard: false, hasGlasses: false, gaitFrequency: 1.15, armSwingAmp: 0.75
            };
        } else if (options.role === 'gang_purple') {
            gene = {
                skinHex: '#c68642', hairColor: 0x09090b, hairStyle: 'fade',
                shirtHex: '#9333ea', shirtStyle: 'tanktop', pantsColor: 0x18181b, shoeColor: 0xa855f7,
                build: { scaleX: 1.12, scaleZ: 1.10, height: 1.03 },
                hasBeard: true, hasGlasses: true, gaitFrequency: 1.05, armSwingAmp: 0.82
            };
        } else if (options.role === 'gang_green') {
            gene = {
                skinHex: '#8d5524', hairColor: 0x09090b, hairStyle: 'mohawk',
                shirtHex: '#16a34a', shirtStyle: 'jacket', pantsColor: 0x0f172a, shoeColor: 0x22c55e,
                build: { scaleX: 1.12, scaleZ: 1.10, height: 1.03 },
                hasBeard: true, hasGlasses: false, gaitFrequency: 1.05, armSwingAmp: 0.82
            };
        } else if (options.role === 'thief') {
            gene = {
                skinHex: '#e0ac69', hairColor: 0x09090b, hairStyle: 'bald',
                shirtHex: '#18181b', shirtStyle: 'stripes', pantsColor: 0x09090b, shoeColor: 0xdc2626,
                build: { scaleX: 0.94, scaleZ: 0.94, height: 0.98 },
                hasBeard: true, hasGlasses: true, gaitFrequency: 1.22, armSwingAmp: 0.85
            };
        } else if (options.isGuard) {
            gene = {
                skinHex: '#c68642', hairColor: 0x09090b, hairStyle: 'short',
                shirtHex: '#18181b', shirtStyle: 'jacket', pantsColor: 0x09090b, shoeColor: 0x09090b,
                build: { scaleX: 1.15, scaleZ: 1.12, height: 1.04 },
                hasBeard: true, hasGlasses: true, gaitFrequency: 1.0, armSwingAmp: 0.65
            };
        } else if (options.isCop) {
            gene = {
                skinHex: options.skinHex || '#e0ac69', hairColor: 0x09090b, hairStyle: 'cop',
                shirtHex: '#1e3a8a', shirtStyle: 'cop', pantsColor: 0x0f172a, shoeColor: 0x09090b,
                build: { scaleX: 1.06, scaleZ: 1.04, height: 1.02 },
                hasBeard: Math.random() > 0.5, hasGlasses: true, gaitFrequency: 1.05, armSwingAmp: 0.70
            };
        } else {
            gene = this.generateRandomNPCGene(options.seed);
        }

        const root = new THREE.Group();
        const bodyContainer = new THREE.Group();
        bodyContainer.scale.set(gene.build.scaleX, gene.build.height, gene.build.scaleZ);
        root.add(bodyContainer);

        let faceTex = null;
        let shirtTex = null;
        try {
            if (window.VCTextures) {
                faceTex = VCTextures.createFaceTexture(gene.skinHex, gene.hasBeard);
                shirtTex = VCTextures.createShirtTexture(gene.shirtHex, gene.shirtStyle);
            }
        } catch (e) {}

        const skinMat = new THREE.MeshStandardMaterial({ color: gene.skinHex, roughness: 0.6 });
        const faceMat = faceTex ? new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 }) : skinMat;
        const hairMat = new THREE.MeshStandardMaterial({ color: gene.hairColor, roughness: 0.8 });
        const shirtMat = shirtTex
            ? new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.7 })
            : new THREE.MeshStandardMaterial({ color: gene.shirtHex, roughness: 0.7 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: gene.pantsColor, roughness: 0.8 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: gene.shoeColor, roughness: 0.5 });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.30), shirtMat);
        torso.position.y = 1.12;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.14, 10), skinMat);
        neck.position.y = 1.50;
        bodyContainer.add(torso, neck);

        const headGroup = new THREE.Group();
        headGroup.position.y = 1.72;
        const headMats = [skinMat, skinMat, hairMat, skinMat, skinMat, faceMat];
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.36), headMats);
        headGroup.add(head);

        if (gene.hairStyle !== 'bald') {
            const hairH = gene.hairStyle === 'afro' ? 0.22 : (gene.hairStyle === 'mohawk' ? 0.20 : 0.10);
            const hairW = gene.hairStyle === 'mohawk' ? 0.12 : (gene.hairStyle === 'afro' ? 0.44 : 0.38);
            const hairTop = new THREE.Mesh(new THREE.BoxGeometry(hairW, hairH, 0.38), hairMat);
            hairTop.position.y = 0.18 + (hairH * 0.3);
            headGroup.add(hairTop);
        }

        if (gene.hasGlasses) {
            const glasses = new THREE.Mesh(
                new THREE.BoxGeometry(0.34, 0.08, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.1 })
            );
            glasses.position.set(0, 0.03, -0.19);
            headGroup.add(glasses);
        }
        bodyContainer.add(headGroup);

        // Indicador visual flutuante quando o NPC está conversando com outro
        const chatBubble = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.20, 0.08),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        chatBubble.position.set(0, 2.22, 0);
        chatBubble.visible = false;
        bodyContainer.add(chatBubble);

        const leftArm = new THREE.Group();
        leftArm.position.set(-0.38, 1.42, 0);
        const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.16), shirtMat);
        lUpper.position.y = -0.14;
        const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), skinMat);
        lForearm.position.y = -0.44;
        leftArm.add(lUpper, lForearm);
        bodyContainer.add(leftArm);

        const rightArm = new THREE.Group();
        rightArm.position.set(0.38, 1.42, 0);
        const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.16), shirtMat);
        rUpper.position.y = -0.14;
        const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), skinMat);
        rForearm.position.y = -0.44;
        const handWeaponSocket = new THREE.Group();
        handWeaponSocket.position.set(0, -0.56, -0.16);
        rightArm.add(rUpper, rForearm, handWeaponSocket);
        bodyContainer.add(rightArm);

        const createLeg = (xOff) => {
            const legGroup = new THREE.Group();
            legGroup.position.set(xOff, 0.76, 0);
            const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.36, 0.22), pantsMat);
            thigh.position.y = -0.18;
            const shin = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.34, 0.20), pantsMat);
            shin.position.y = -0.52;
            const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.11, 0.30), shoeMat);
            shoe.position.set(0, -0.71, -0.04);
            legGroup.add(thigh, shin, shoe);
            bodyContainer.add(legGroup);
            return legGroup;
        };
        const leftLeg = createLeg(-0.15);
        const rightLeg = createLeg(0.15);

        return {
            mesh: root,
            bodyContainer,
            torso,
            headGroup,
            chatBubble,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            handWeaponSocket,
            gene,
            state: 'alive',
            animPhase: Math.random() * Math.PI * 2,
            yPos: 0,
            vy: 0,
            punchTimer: 0,
            recoilOffset: 0
        };
    },

    updateHumanAnimation(charObj, params = {}) {
        if (!charObj || !charObj.mesh) return;
        const { speed = 0, isRunning = false, isAiming = false, hasGun = false, isSwimming = false, isTalking = false } = params;

        if (charObj.chatBubble) {
            charObj.chatBubble.visible = !!isTalking && charObj.state !== 'dead';
            if (isTalking) {
                charObj.chatBubble.rotation.y += 0.05;
                charObj.chatBubble.position.y = 2.22 + Math.sin(charObj.animPhase * 2) * 0.05;
            }
        }

        if (charObj.state === 'dead') {
            charObj.bodyContainer.rotation.x = 0;
            charObj.mesh.rotation.x = THREE.MathUtils.lerp(charObj.mesh.rotation.x, -Math.PI / 2, 0.15);
            charObj.mesh.position.y = 0.22;
            return;
        }

        if (isSwimming) {
            charObj.bodyContainer.rotation.x = THREE.MathUtils.lerp(charObj.bodyContainer.rotation.x, -Math.PI * 0.42, 0.18);
            charObj.mesh.position.y = -0.35 + Math.sin(charObj.animPhase * 0.5) * 0.06;
            charObj.animPhase += speed > 0.005 ? 0.22 : 0.06;
            const stroke = Math.sin(charObj.animPhase);
            charObj.leftArm.rotation.x = -Math.PI * 0.8 + stroke * 0.9;
            charObj.rightArm.rotation.x = -Math.PI * 0.8 - stroke * 0.9;
            charObj.leftLeg.rotation.x = -stroke * 0.45;
            charObj.rightLeg.rotation.x = stroke * 0.45;
            return;
        } else {
            charObj.bodyContainer.rotation.x = THREE.MathUtils.lerp(charObj.bodyContainer.rotation.x, 0, 0.25);
        }

        if (charObj.yPos > 0 || charObj.vy !== 0) {
            charObj.yPos += charObj.vy;
            charObj.vy -= 0.018;
            if (charObj.yPos <= 0) {
                charObj.yPos = 0;
                charObj.vy = 0;
            }
            charObj.mesh.position.y = charObj.yPos;
        } else if (charObj.mesh.position.y > -20) {
            charObj.mesh.position.y = THREE.MathUtils.lerp(charObj.mesh.position.y, 0, 0.25);
        }

        const freqMult = (charObj.gene && charObj.gene.gaitFrequency) || 1.0;
        const ampMult = (charObj.gene && charObj.gene.armSwingAmp) || 0.75;

        if (isTalking && speed <= 0.005) {
            charObj.animPhase += 0.12;
            charObj.rightArm.rotation.x = -0.45 + Math.sin(charObj.animPhase * 1.8) * 0.35;
            charObj.leftArm.rotation.x = -0.25 + Math.cos(charObj.animPhase * 1.5) * 0.25;
            charObj.headGroup.rotation.y = Math.sin(charObj.animPhase) * 0.22;
            return;
        } else {
            charObj.headGroup.rotation.y *= 0.8;
        }

        if (speed > 0.005) {
            const freq = (isRunning ? 0.28 : 0.16) * freqMult;
            charObj.animPhase += freq;
            const swing = Math.sin(charObj.animPhase) * (isRunning ? 0.85 : 0.52);
            charObj.leftLeg.rotation.x = swing;
            charObj.rightLeg.rotation.x = -swing;
            charObj.leftArm.rotation.x = -swing * ampMult;
            if (!isAiming && !hasGun) {
                charObj.rightArm.rotation.x = swing * ampMult;
            }
        } else {
            charObj.leftLeg.rotation.x *= 0.8;
            charObj.rightLeg.rotation.x *= 0.8;
            charObj.leftArm.rotation.x *= 0.8;
            if (!isAiming && !hasGun) charObj.rightArm.rotation.x *= 0.8;
        }

        if (charObj.punchTimer > 0) {
            charObj.punchTimer--;
            charObj.rightArm.rotation.x = -Math.PI * 0.55;
        } else if (isAiming && hasGun) {
            charObj.rightArm.rotation.x = -Math.PI * 0.5 + (charObj.recoilOffset || 0);
        } else if (hasGun) {
            charObj.rightArm.rotation.x = -0.35 + (charObj.recoilOffset || 0);
        }
        charObj.recoilOffset = (charObj.recoilOffset || 0) * 0.75;
    },

    // =========================================================================
    // 2. ARMAS BRANCAS (FACA, BASTÃO) E ARMAS DE FOGO 3D
    // =========================================================================
    createWeapon3D(type = 'pistol') {
        const g = new THREE.Group();

        if (type === 'knife') {
            const handle = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.06, 0.16),
                new THREE.MeshStandardMaterial({ color: 0x18181b })
            );
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.05, 0.28),
                new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
            );
            blade.position.set(0, 0, -0.20);
            g.add(handle, blade);
            return g;
        }

        if (type === 'bat') {
            const batGeo = new THREE.CylinderGeometry(0.045, 0.025, 0.82, 10);
            batGeo.rotateX(Math.PI / 2);
            const bat = new THREE.Mesh(
                batGeo,
                new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5 })
            );
            bat.position.set(0, 0, -0.36);
            g.add(bat);
            return g;
        }

        const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
        const barrelLen = type === 'shotgun' ? 0.65 : (type === 'uzi' ? 0.34 : 0.26);
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, barrelLen), metalMat);
        barrel.position.set(0, 0, -barrelLen / 2);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), metalMat);
        grip.position.set(0, -0.07, 0);

        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        flash.position.set(0, 0, -barrelLen - 0.05);
        flash.visible = false;

        g.add(barrel, grip, flash);
        g.userData.flash = flash;
        return g;
    },

    // =========================================================================
    // 3. VEÍCULOS + DEFORMAÇÃO REALISTA DE LATARIA (AMASSADOS AO BATER)
    // =========================================================================
    createCar3D(colorHex = 0xec4899, isCopCar = false) {
        const car = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({
            color: isCopCar ? 0x0f172a : colorHex,
            metalness: 0.55,
            roughness: 0.3
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x020617,
            metalness: 0.9,
            roughness: 0.1
        });

        // Chassi subdividido (4x2x6) para permitir amassados reais nos vértices ao colidir
        const chassisGeo = new THREE.BoxGeometry(2.1, 0.68, 4.4, 4, 2, 6);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.56;
        car.add(chassis);

        // Para-choques dianteiro e traseiro que amassam e entortam nas batidas
        const frontBumper = new THREE.Mesh(
            new THREE.BoxGeometry(2.14, 0.26, 0.24),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
        );
        frontBumper.position.set(0, 0.42, -2.22);

        const rearBumper = new THREE.Mesh(
            new THREE.BoxGeometry(2.14, 0.26, 0.24),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
        );
        rearBumper.position.set(0, 0.42, 2.22);
        car.add(frontBumper, rearBumper);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.54, 2.2), glassMat);
        cabin.position.set(0, 1.12, 0.1);
        car.add(cabin);

        const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 1.2), bodyMat);
        leftDoor.position.set(-1.05, 0.58, -0.1);
        const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 1.2), bodyMat);
        rightDoor.position.set(1.05, 0.58, -0.1);
        car.add(leftDoor, rightDoor);

        const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        [-0.7, 0.7].forEach(lx => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), headLightMat);
            hl.position.set(lx, 0.58, -2.21);
            car.add(hl);
        });

        let sR = null, sB = null;
        if (isCopCar) {
            sR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.22), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
            sR.position.set(-0.32, 1.44, 0.1);
            sB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.22), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
            sB.position.set(0.32, 1.44, 0.1);
            car.add(sR, sB);
        }

        const wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 14);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
        [[-1.08, -1.35], [1.08, -1.35], [-1.08, 1.35], [1.08, 1.35]].forEach(([wx, wz]) => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(wx, 0.38, wz);
            car.add(w);
            wheels.push(w);
        });

        // Salva posições originais dos vértices para poder restaurar na oficina Pay 'n' Spray
        const origPos = chassisGeo.attributes.position.array.slice();

        return {
            mesh: car,
            vehicleType: 'car',
            chassis,
            origChassisVerts: origPos,
            frontBumper,
            rearBumper,
            leftDoor,
            rightDoor,
            wheels,
            sR,
            sB,
            hopY: 0,
            hopVy: 0,
            doorOpenTimer: 0
        };
    },

    // Aplica amassado físico na malha do carro no ponto da batida
    applyCarDent(carObj, impactStrength = 0.5, isFront = true) {
        if (!carObj || !carObj.chassis || !carObj.chassis.geometry) return;
        const posAttr = carObj.chassis.geometry.attributes.position;
        const amt = Math.min(0.45, impactStrength * 0.28);

        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);

            if (isFront && vz < -1.2) {
                posAttr.setZ(i, vz + amt * (0.6 + Math.random() * 0.5));
                posAttr.setY(i, vy + (Math.random() - 0.4) * amt * 0.5);
            } else if (!isFront && vz > 1.2) {
                posAttr.setZ(i, vz - amt * (0.6 + Math.random() * 0.5));
                posAttr.setY(i, vy + (Math.random() - 0.4) * amt * 0.5);
            }
        }
        posAttr.needsUpdate = true;

        if (carObj.frontBumper && isFront) {
            carObj.frontBumper.position.z = Math.min(-1.95, carObj.frontBumper.position.z + amt * 0.7);
            carObj.frontBumper.rotation.z = (Math.random() - 0.5) * 0.16;
        }
        if (carObj.rearBumper && !isFront) {
            carObj.rearBumper.position.z = Math.max(1.95, carObj.rearBumper.position.z - amt * 0.7);
            carObj.rearBumper.rotation.z = (Math.random() - 0.5) * 0.16;
        }
    },

    // Restaura a lataria amassada na oficina Pay 'n' Spray
    repairCarDent(carObj) {
        if (!carObj || !carObj.chassis || !carObj.origChassisVerts) return;
        const posAttr = carObj.chassis.geometry.attributes.position;
        posAttr.array.set(carObj.origChassisVerts);
        posAttr.needsUpdate = true;
        if (carObj.frontBumper) {
            carObj.frontBumper.position.set(0, 0.42, -2.22);
            carObj.frontBumper.rotation.set(0, 0, 0);
        }
        if (carObj.rearBumper) {
            carObj.rearBumper.position.set(0, 0.42, 2.22);
            carObj.rearBumper.rotation.set(0, 0, 0);
        }
    },

    createBus3D(colorHex = 0xf59e0b) {
        const bus = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.35, roughness: 0.45 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.15 });

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.3, 9.2), bodyMat);
        chassis.position.y = 1.65;
        const windows = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.95, 8.2), glassMat);
        windows.position.set(0, 2.05, -0.1);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 8.8), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
        roof.position.y = 2.85;
        bus.add(chassis, windows, roof);

        const wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.32, 14);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
        [[-1.32, -2.9], [1.32, -2.9], [-1.32, 2.8], [1.32, 2.8]].forEach(([wx, wz]) => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(wx, 0.52, wz);
            bus.add(w);
            wheels.push(w);
        });

        return { mesh: bus, vehicleType: 'bus', chassis, wheels, hopY: 0, hopVy: 0, doorOpenTimer: 0 };
    },

    createBike3D(colorHex = 0x22d3ee) {
        const root = new THREE.Group();
        const pivotGroup = new THREE.Group();
        pivotGroup.position.set(0, 0.36, 0.62);
        root.add(pivotGroup);

        const frameMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.7, roughness: 0.25 });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

        const wheelGeo = new THREE.TorusGeometry(0.34, 0.05, 8, 18);
        wheelGeo.rotateY(Math.PI / 2);

        const rearWheel = new THREE.Mesh(wheelGeo, tireMat);
        const frontWheel = new THREE.Mesh(wheelGeo, tireMat);
        frontWheel.position.set(0, 0, -1.24);

        const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.15), frameMat);
        bar1.position.set(0, 0.34, -0.58);
        const seatPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.06), frameMat);
        seatPost.position.set(0, 0.28, -0.22);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.28), tireMat);
        seat.position.set(0, 0.54, -0.20);
        const fork = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.06), frameMat);
        fork.position.set(0, 0.30, -1.16);
        fork.rotation.x = 0.22;
        const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.05, 0.05), frameMat);
        handlebar.position.set(0, 0.62, -1.08);

        pivotGroup.add(rearWheel, frontWheel, bar1, seatPost, seat, fork, handlebar);

        return {
            mesh: root,
            pivotGroup,
            vehicleType: 'bike',
            chassis: bar1,
            wheels: [rearWheel, frontWheel],
            wheelieAngle: 0,
            hopY: 0,
            hopVy: 0,
            doorOpenTimer: 0
        };
    },

    createJetSki3D(colorHex = 0xec4899) {
        const js = new THREE.Group();
        const hullMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.6, roughness: 0.2 });
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });

        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.48, 2.8), hullMat);
        hull.position.y = 0.24;
        const bow = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.1, 4), hullMat);
        bow.rotation.x = -Math.PI / 2;
        bow.rotation.y = Math.PI / 4;
        bow.position.set(0, 0.28, -1.85);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 1.3), seatMat);
        seat.position.set(0, 0.58, 0.25);
        const steer = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.15), seatMat);
        steer.position.set(0, 0.78, -0.65);

        js.add(hull, bow, seat, steer);
        return { mesh: js, vehicleType: 'jetski', chassis: hull, wheels: [], hopY: 0, hopVy: 0, doorOpenTimer: 0 };
    },

    createAircraft3D(isJet = false) {
        const plane = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({
            color: isJet ? 0x334155 : 0xf8fafc,
            metalness: isJet ? 0.85 : 0.4,
            roughness: 0.25
        });
        const accentMat = new THREE.MeshBasicMaterial({ color: isJet ? 0x06b6d4 : 0xec4899 });

        const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, isJet ? 10.5 : 8.5), bodyMat);
        fuselage.position.y = 1.4;

        const nose = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.8, 8), accentMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, 1.4, isJet ? -6.5 : -5.5);

        const wings = new THREE.Mesh(new THREE.BoxGeometry(isJet ? 11.5 : 13.5, 0.18, isJet ? 3.2 : 2.2), bodyMat);
        wings.position.set(0, 1.45, -0.5);

        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 1.8), accentMat);
        tailFin.position.set(0, 2.7, isJet ? 4.4 : 3.5);

        const propeller = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 0.12), accentMat);
        propeller.position.set(0, 1.4, -7.0);
        propeller.visible = !isJet;

        plane.add(fuselage, nose, wings, tailFin, propeller);
        return {
            mesh: plane,
            vehicleType: isJet ? 'jet' : 'plane',
            isJet,
            chassis: fuselage,
            propeller,
            wheels: [],
            altitude: 0,
            pitchAngle: 0,
            rollAngle: 0,
            hopY: 0,
            hopVy: 0,
            doorOpenTimer: 0
        };
    },

    updateCarAnimation(carObj, speed = 0, steerInput = 0, isWheelie = false) {
        if (!carObj) return;
        if (carObj.wheels) {
            carObj.wheels.forEach(w => { w.rotation.x -= speed * 0.45; });
        }

        if (carObj.vehicleType === 'bike' && carObj.pivotGroup) {
            const targetPitch = (isWheelie && Math.abs(speed) > 0.05) ? 0.62 : 0;
            carObj.wheelieAngle = THREE.MathUtils.lerp(carObj.wheelieAngle || 0, targetPitch, 0.15);
            carObj.pivotGroup.rotation.x = carObj.wheelieAngle;
        }

        if (carObj.propeller && carObj.propeller.visible) {
            carObj.propeller.rotation.z += 0.45;
        }

        if (carObj.hopY > 0 || carObj.hopVy !== 0) {
            carObj.hopY += carObj.hopVy;
            carObj.hopVy -= 0.02;
            if (carObj.hopY <= 0) { carObj.hopY = 0; carObj.hopVy = 0; }
            carObj.mesh.position.y = carObj.hopY;
        }

        if (carObj.doorOpenTimer > 0) {
            carObj.doorOpenTimer--;
            if (carObj.leftDoor) carObj.leftDoor.rotation.y = 0.85;
            if (carObj.rightDoor) carObj.rightDoor.rotation.y = -0.85;
        } else {
            if (carObj.leftDoor) carObj.leftDoor.rotation.y *= 0.8;
            if (carObj.rightDoor) carObj.rightDoor.rotation.y *= 0.8;
        }
    },

    // =========================================================================
    // 4. ÁRVORES URBANAS VARIADAS, ANIMAIS, CHAFARIZ E NUVENS
    // =========================================================================
    createTree3D(x, z, style = 0) {
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.36, 3.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
        );
        trunk.position.y = 1.8;
        tree.add(trunk);

        const foliageColors = [0x16a34a, 0x15803d, 0x22c55e, 0xf472b6, 0xfacc15];
        const fColor = foliageColors[style % foliageColors.length];
        const leafMat = new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.75 });

        if (style % 3 === 1) {
            // Pinheiro / Cipreste
            const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.2, 10), leafMat);
            c1.position.y = 4.2;
            const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 10), leafMat);
            c2.position.y = 5.8;
            tree.add(c1, c2);
        } else {
            // Copa frondosa / Ipê colorido
            const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), leafMat);
            crown.position.y = 4.5;
            tree.add(crown);
        }
        return tree;
    },

    createAnimal3D(species = 'dog', colorHex = 0x92400e) {
        const root = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.75 });

        if (species === 'bird') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.36), mat);
            const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.22), mat);
            leftWing.position.set(-0.24, 0.04, 0);
            const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.22), mat);
            rightWing.position.set(0.24, 0.04, 0);
            root.add(body, leftWing, rightWing);
            return { mesh: root, species: 'bird', leftWing, rightWing, phase: Math.random() * 6.28 };
        }

        const isCat = (species === 'cat');
        const scale = isCat ? 0.68 : 1.0;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.32 * scale, 0.68 * scale), mat);
        body.position.y = 0.36 * scale;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.28 * scale, 0.26 * scale, 0.28 * scale), mat);
        head.position.set(0, 0.52 * scale, -0.40 * scale);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.08 * scale, 0.36 * scale), mat);
        tail.position.set(0, 0.48 * scale, 0.42 * scale);
        tail.rotation.x = isCat ? 0.7 : 0.3;

        const legs = [];
        [[-0.11, -0.22], [0.11, -0.22], [-0.11, 0.22], [0.11, 0.22]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09 * scale, 0.26 * scale, 0.09 * scale), mat);
            leg.position.set(lx * scale, 0.13 * scale, lz * scale);
            root.add(leg);
            legs.push(leg);
        });

        root.add(body, head, tail);
        return { mesh: root, species, legs, tail, phase: Math.random() * 6.28 };
    },

    updateAnimalAnimation(animObj, speed = 0.05) {
        if (!animObj) return;
        animObj.phase += speed * 2.5 + 0.08;

        if (animObj.species === 'bird') {
            const flap = Math.sin(animObj.phase * 2.2) * 0.65;
            animObj.leftWing.rotation.z = flap;
            animObj.rightWing.rotation.z = -flap;
            return;
        }

        if (animObj.legs && animObj.legs.length === 4) {
            const swing = Math.sin(animObj.phase) * 0.45;
            animObj.legs[0].rotation.x = swing;
            animObj.legs[1].rotation.x = -swing;
            animObj.legs[2].rotation.x = -swing;
            animObj.legs[3].rotation.x = swing;
        }
        if (animObj.tail) {
            animObj.tail.rotation.y = Math.sin(animObj.phase * 1.5) * 0.4;
        }
    },

    createFountain3D(x, z) {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6 });
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.7 });

        const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 0.85, 24), stoneMat);
        basin.position.y = 0.42;
        const pool = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.15, 24), waterMat);
        pool.position.y = 0.78;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 2.8, 16), stoneMat);
        pillar.position.y = 1.6;
        const spout = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
        spout.position.y = 3.1;

        g.add(basin, pool, pillar, spout);
        return { mesh: g, spout, pool };
    },

    createCloud3D(x, y, z) {
        const cloud = new THREE.Group();
        cloud.position.set(x, y, z);
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.82 });
        [[0, 0, 0, 14, 4, 9], [-9, -0.8, 2, 10, 3.2, 7], [10, -0.6, -2, 11, 3.5, 8]].forEach(([px, py, pz, w, h, d]) => {
            const puff = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cloudMat);
            puff.position.set(px, py, pz);
            cloud.add(puff);
        });
        return cloud;
    },

    createStreetLight3D(x, z) {
        const post = new THREE.Group();
        post.position.set(x, 0, z);
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 5.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
        );
        pole.position.y = 2.6;
        const lamp = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        lamp.position.set(0, 5.25, 0);
        post.add(pole, lamp);
        return post;
    }
};
