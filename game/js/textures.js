// game/js/textures.js - Motor Procedural de Texturas (+450.000 Combinações Únicas com Cache de VRAM)

window.VCTextures = {
    _cache: new Map(),
    _maxCacheSize: 240,

    _getCached(key, generatorFn) {
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }
        const tex = generatorFn();
        if (this._cache.size >= this._maxCacheSize) {
            const firstKey = this._cache.keys().next().value;
            const oldTex = this._cache.get(firstKey);
            if (oldTex && oldTex.dispose) oldTex.dispose();
            this._cache.delete(firstKey);
        }
        this._cache.set(key, tex);
        return tex;
    },

    // Gerador pseudo-aleatório determinístico (permite centenas de milhares de seeds únicas)
    _seededRand(seed) {
        let s = (seed % 2147483647);
        if (s <= 0) s += 2147483646;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    },

    // =========================================================================
    // 1. ASFALTO & MALHA VIÁRIA (+10.000 Variações de Desgaste, Faixas e Rachaduras)
    // =========================================================================
    createRoadTexture(variantSeed = 1) {
        return this._getCached(`road_${variantSeed}`, () => {
            const rand = this._seededRand(variantSeed * 7919);
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Base de asfalto com tonalidade variável
            const shade = 24 + Math.floor(rand() * 14);
            ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 10})`;
            ctx.fillRect(0, 0, 512, 512);

            // Granulação mineral + manchas de óleo e pneus
            for (let i = 0; i < 16000; i++) {
                const v = rand();
                ctx.fillStyle = v > 0.65 ? 'rgba(255,255,255,0.06)' : (v < 0.35 ? 'rgba(0,0,0,0.22)' : 'rgba(15,23,42,0.15)');
                ctx.fillRect(rand() * 512, rand() * 512, 2, 2);
            }

            // Marcas de frenagem / derrapagem
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            for (let m = 0; m < 4; m++) {
                const mx = 60 + rand() * 380;
                ctx.fillRect(mx, rand() * 200, 4, 80 + rand() * 140);
                ctx.fillRect(mx + 14, rand() * 200, 4, 80 + rand() * 140);
            }

            // Faixas duplas amarelas centrais
            ctx.fillStyle = '#facc15';
            ctx.fillRect(248, 0, 5, 512);
            ctx.fillRect(259, 0, 5, 512);

            // Faixas tracejadas brancas
            ctx.fillStyle = '#e2e8f0';
            for (let y = 16; y < 512; y += 64) {
                ctx.fillRect(128, y, 4, 32);
                ctx.fillRect(380, y, 4, 32);
            }

            // Faixa de pedestres (Crosswalk) nas bordas
            ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
            for (let x = 24; x < 488; x += 36) {
                if (Math.abs(x - 252) > 18) {
                    ctx.fillRect(x, 8, 20, 28);
                }
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(22, 22);
            return tex;
        });
    },

    // =========================================================================
    // 2. CALÇADAS & PAVIMENTAÇÃO (+5.000 Variações de Pedras, Lajotas e Meio-Fio)
    // =========================================================================
    createSidewalkTexture(variantSeed = 1) {
        return this._getCached(`sidewalk_${variantSeed}`, () => {
            const rand = this._seededRand(variantSeed * 3571);
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(0, 0, 256, 256);

            // Variação individual por placa de concreto
            for (let gx = 0; gx < 256; gx += 64) {
                for (let gy = 0; gy < 256; gy += 64) {
                    const tone = 138 + Math.floor(rand() * 24);
                    ctx.fillStyle = `rgb(${tone}, ${tone + 6}, ${tone + 14})`;
                    ctx.fillRect(gx + 2, gy + 2, 60, 60);
                }
            }

            // Granulação fina
            for (let i = 0; i < 3500; i++) {
                ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
                ctx.fillRect(rand() * 256, rand() * 256, 2, 2);
            }

            // Meio-fio pintado estilo Vice City
            ctx.fillStyle = '#facc15';
            ctx.fillRect(0, 0, 256, 8);
            ctx.fillRect(0, 248, 256, 8);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(3, 3);
            return tex;
        });
    },

    // =========================================================================
    // 3. FACHADAS DE PRÉDIOS, HOTÉIS, CASAS E LOJAS (+150.000 Combinações)
    // =========================================================================
    createBuildingTexture(baseHex, accentHex, isShop = false, buildingSeed = null) {
        const seed = buildingSeed !== null ? buildingSeed : Math.floor(Math.random() * 150000);
        return this._getCached(`bld_${baseHex}_${accentHex}_${isShop}_${seed}`, () => {
            const rand = this._seededRand(seed + 101);
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Parede Principal com gradiente sutil
            const wallGrad = ctx.createLinearGradient(0, 0, 0, 512);
            wallGrad.addColorStop(0, baseHex);
            wallGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = wallGrad;
            ctx.fillRect(0, 0, 256, 512);

            // Textura de reboco/concreto na fachada
            for (let i = 0; i < 4000; i++) {
                ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
                ctx.fillRect(rand() * 256, rand() * 512, 2, 2);
            }

            // Pilastras Verticais Art Deco & Frisos Neon
            ctx.fillStyle = accentHex;
            ctx.fillRect(8, 0, 12, 512);
            ctx.fillRect(236, 0, 12, 512);
            ctx.fillRect(0, 18, 256, 8);

            // Estilo de Janelas (Panorâmicas, Gradeadas ou Varandas)
            const winStyle = Math.floor(rand() * 3);
            for (let y = 38; y < 405; y += 44) {
                for (let x = 32; x < 212; x += 48) {
                    const litRoll = rand();
                    ctx.fillStyle = litRoll > 0.62 ? '#fef08a' : (litRoll > 0.45 ? '#38bdf8' : '#0f172a');

                    if (winStyle === 0) {
                        ctx.fillRect(x, y, 34, 28);
                        ctx.strokeStyle = '#1e293b';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, 34, 28);
                        // Divisória da janela
                        ctx.beginPath(); ctx.moveTo(x + 17, y); ctx.lineTo(x + 17, y + 28); ctx.stroke();
                    } else if (winStyle === 1) {
                        // Janela panorâmica contínua
                        ctx.fillRect(x - 4, y + 4, 42, 22);
                    } else {
                        // Janela com sacada Art Deco
                        ctx.fillRect(x + 2, y, 30, 26);
                        ctx.fillStyle = accentHex;
                        ctx.fillRect(x - 2, y + 22, 38, 6);
                    }
                }
            }

            // Térreo: Vitrine de Loja Iluminada ou Entrada Residencial
            ctx.fillStyle = '#090d16';
            ctx.fillRect(20, 430, 216, 78);

            if (isShop) {
                ctx.fillStyle = '#facc15';
                ctx.fillRect(28, 442, 200, 60);
                // Prateleiras visíveis pela vitrine
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(36, 460, 184, 4);
                ctx.fillRect(36, 480, 184, 4);
                // Letreiro Neon Piscante
                ctx.fillStyle = '#ec4899';
                ctx.fillRect(16, 412, 224, 16);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('OPEN 24/7 • VICE STORE', 128, 424);
            } else {
                ctx.fillStyle = '#22d3ee';
                ctx.fillRect(30, 444, 196, 58);
                // Porta dupla de vidro no centro
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(104, 444, 48, 64);
                ctx.strokeStyle = '#f8fafc';
                ctx.lineWidth = 2;
                ctx.strokeRect(106, 446, 21, 60);
                ctx.strokeRect(129, 446, 21, 60);
                // Marquise Neon
                ctx.fillStyle = accentHex;
                ctx.fillRect(18, 415, 220, 14);
            }

            return new THREE.CanvasTexture(canvas);
        });
    },

    // =========================================================================
    // 4. ROSTOS HUMANOS (+50.000 Variações de Olhos, Sobrancelhas, Barba, Cicatriz e Expressão)
    // =========================================================================
    createFaceTexture(skinHex, hasBeard = false, faceSeed = null) {
        const seed = faceSeed !== null ? faceSeed : Math.floor(Math.random() * 50000);
        return this._getCached(`face_${skinHex}_${hasBeard}_${seed}`, () => {
            const rand = this._seededRand(seed + 307);
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = skinHex;
            ctx.fillRect(0, 0, 128, 128);

            // Sombreamento facial natural
            ctx.fillStyle = 'rgba(0,0,0,0.07)';
            ctx.fillRect(0, 92, 128, 36);

            // Cor dos olhos variada
            const eyeColors = ['#0f172a', '#1e3a8a', '#14532d', '#451a03', '#334155'];
            const irisColor = eyeColors[Math.floor(rand() * eyeColors.length)];

            // Sobrancelhas (expressão neutra, séria ou arqueada)
            const browTilt = (rand() - 0.5) * 3;
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(41, 47 + browTilt, 15, 3);
            ctx.fillRect(72, 47 - browTilt, 15, 3);

            // Olhos detalhados
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(43, 53, 11, 6);
            ctx.fillRect(74, 53, 11, 6);
            ctx.fillStyle = irisColor;
            ctx.fillRect(46, 53, 5, 6);
            ctx.fillRect(77, 53, 5, 6);

            // Sombra do nariz
            ctx.fillStyle = 'rgba(0,0,0,0.20)';
            ctx.fillRect(62, 58, 4, 14);

            // Barba / Bigode / Cavanhaque
            if (hasBeard) {
                const beardStyle = Math.floor(rand() * 3);
                ctx.fillStyle = 'rgba(24, 24, 27, 0.55)';
                if (beardStyle === 0) {
                    // Barba cheia
                    ctx.fillRect(40, 72, 48, 26);
                } else if (beardStyle === 1) {
                    // Bigode estilo anos 80
                    ctx.fillRect(48, 73, 32, 6);
                } else {
                    // Cavanhaque
                    ctx.fillRect(50, 73, 28, 22);
                }
            }

            // Cicatriz ou marca facial rara
            if (rand() > 0.85) {
                ctx.strokeStyle = 'rgba(153, 27, 27, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(76, 46); ctx.lineTo(84, 66); ctx.stroke();
            }

            // Boca
            ctx.fillStyle = '#881337';
            ctx.fillRect(54, 81, 20, 4);

            return new THREE.CanvasTexture(canvas);
        });
    },

    // =========================================================================
    // 5. ROUPAS, ESTAMPAS TROPICAIS, JAQUETAS E FARDAS (+100.000 Variações)
    // =========================================================================
    createShirtTexture(shirtHex, style = 'hawaiian', shirtSeed = null) {
        const seed = shirtSeed !== null ? shirtSeed : Math.floor(Math.random() * 100000);
        return this._getCached(`shirt_${shirtHex}_${style}_${seed}`, () => {
            const rand = this._seededRand(seed + 509);
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = shirtHex;
            ctx.fillRect(0, 0, 256, 256);

            // Textura de trama do tecido
            for (let i = 0; i < 3000; i++) {
                ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
                ctx.fillRect(rand() * 256, rand() * 256, 2, 2);
            }

            if (style === 'hawaiian') {
                // Estampa tropical de folhas e flores de Vice City
                const leafColors = ['#083344', '#fef08a', '#f43f5e', '#10b981'];
                for (let i = 0; i < 24; i++) {
                    ctx.fillStyle = leafColors[i % leafColors.length];
                    const px = rand() * 240;
                    const py = rand() * 240;
                    ctx.beginPath();
                    ctx.arc(px, py, 8 + rand() * 8, 0, Math.PI * 1.3);
                    ctx.fill();
                }
                // Botões frontais
                ctx.fillStyle = '#ffffff';
                for (let y = 28; y < 235; y += 42) {
                    ctx.beginPath(); ctx.arc(128, y, 4, 0, Math.PI * 2); ctx.fill();
                }
            } else if (style === 'cop') {
                // Farda Policial VCPD
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(42, 68, 48, 48);
                ctx.fillRect(166, 68, 48, 48);
                ctx.fillRect(0, 210, 256, 22); // Cinturão tático
                ctx.fillStyle = '#facc15';
                ctx.beginPath(); ctx.arc(180, 52, 11, 0, Math.PI * 2); ctx.fill();
                ctx.fillRect(116, 210, 24, 22); // Fivela dourada
            } else if (style === 'suit' || style === 'jacket') {
                // Paletó / Jaqueta aberta com camiseta interna
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(92, 0); ctx.lineTo(164, 0); ctx.lineTo(128, 135);
                ctx.fill();
                if (style === 'suit') {
                    ctx.fillStyle = '#dc2626';
                    ctx.fillRect(123, 14, 10, 115);
                }
            } else {
                // Estampas geométricas urbanas anos 80
                ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
                ctx.fillRect(0, 72, 256, 22);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
                ctx.fillRect(0, 102, 256, 12);
                ctx.fillRect(0, 145, 256, 16);
            }

            return new THREE.CanvasTexture(canvas);
        });
    },

    // =========================================================================
    // 6. ILUSTRAÇÃO DA TELA DE CARREGAMENTO ESTILO VICE CITY
    // =========================================================================
    renderLoadingArt(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#be185d');
        grad.addColorStop(1, '#f97316');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Sol Neon Retrô
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(w * 0.72, h * 0.45, 78, 0, Math.PI * 2);
        ctx.fill();

        // Silhueta dos Prédios e Palmeiras
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, h * 0.65, w, h * 0.35);
        ctx.fillRect(w * 0.55, h * 0.38, 45, h * 0.3);
        ctx.fillRect(w * 0.63, h * 0.30, 55, h * 0.38);
        ctx.fillRect(w * 0.74, h * 0.42, 40, h * 0.26);
    }
};
