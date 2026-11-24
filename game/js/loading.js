// game/js/loading.js - Tela de Carregamento Oficial "GTA ArcadeCity" (Artes GTA + Suporte a Imagens Próprias)

window.VCLoadingScreen = {
    // Caso você suba imagens reais no GitHub (ex: game/img/tela1.jpg), elas terão prioridade automática!
    customImageUrls: [
        './img/tela1.jpg',
        './img/tela2.jpg',
        './img/tela3.jpg',
        './img/tela4.jpg'
    ],

    slideCaptions: [
        { title: "BEM-VINDO A ARCADECITY", sub: "Sol, praias neon, carros esportivos e dinheiro fácil na costa leste." },
        { title: "RESPEITO NAS RUAS", sub: "Use [TAB] para abrir a roleta de armas ou [F] para roubar qualquer veículo." },
        { title: "IMPÉRIO IMOBILIÁRIO", sub: "Compre apartamentos e mansões pelo mapa para recuperar vida e despistar a polícia." },
        { title: "ASSALTOS & GPS", sub: "Aperte [M] para traçar rotas no GPS e entre nas lojas com [E] para limpar o caixa." }
    ],

    // Gera 4 ilustrações estilo pintura digital clássica de GTA (Art Deco / Vice City / San Andreas)
    generateGTAArtwork(sceneIndex, width = 1280, height = 720) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Céu Dramático estilo Capa de GTA
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        if (sceneIndex === 0) {
            // Pôr do Sol Clássico Vice City
            sky.addColorStop(0, '#1e1b4b');
            sky.addColorStop(0.45, '#be185d');
            sky.addColorStop(0.8, '#f97316');
            sky.addColorStop(1, '#fde047');
        } else if (sceneIndex === 1) {
            // Perseguição Noturna VCPD
            sky.addColorStop(0, '#020617');
            sky.addColorStop(0.5, '#1e3a8a');
            sky.addColorStop(1, '#dc2626');
        } else if (sceneIndex === 2) {
            // Noite Neon Clube Malibu
            sky.addColorStop(0, '#090d16');
            sky.addColorStop(0.5, '#581c87');
            sky.addColorStop(1, '#06b6d4');
        } else {
            // Entardecer Dourado San Andreas / ArcadeCity
            sky.addColorStop(0, '#451a03');
            sky.addColorStop(0.5, '#d97706');
            sky.addColorStop(1, '#fef08a');
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // 2. Sol / Lua Gigante
        ctx.fillStyle = sceneIndex === 1 ? '#ef4444' : '#fef08a';
        ctx.beginPath();
        ctx.arc(width * 0.68, height * 0.38, 135, 0, Math.PI * 2);
        ctx.fill();

        // 3. Horizonte de Arranha-Céus e Prédios Art Deco
        ctx.fillStyle = '#090d16';
        const buildings = [
            [0.05, 0.32, 95], [0.14, 0.25, 110], [0.24, 0.38, 85],
            [0.52, 0.28, 105], [0.62, 0.18, 125], [0.73, 0.26, 95], [0.83, 0.34, 115]
        ];
        buildings.forEach(([rx, ry, bw]) => {
            const bx = width * rx;
            const by = height * ry;
            ctx.fillRect(bx, by, bw, height - by);

            // Janelas iluminadas estilo ilustração
            ctx.fillStyle = sceneIndex === 2 ? '#22d3ee' : '#facc15';
            for (let wy = by + 18; wy < height * 0.72; wy += 24) {
                for (let wx = bx + 14; wx < bx + bw - 18; wx += 22) {
                    if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 10, 12);
                }
            }
            ctx.fillStyle = '#090d16';
        });

        // 4. Helicóptero Policial no Céu com Holofote
        const hx = width * 0.36, hy = height * 0.22;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.ellipse(hx, hy, 42, 16, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(hx - 85, hy - 5, 55, 7); // Cauda
        ctx.fillRect(hx - 55, hy - 22, 115, 4); // Hélice principal

        // Feixe de Holofote
        const beam = ctx.createLinearGradient(hx, hy, hx + 120, height * 0.75);
        beam.addColorStop(0, 'rgba(255,255,255,0.38)');
        beam.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 60, height * 0.75);
        ctx.lineTo(hx + 210, height * 0.75);
        ctx.closePath();
        ctx.fill();

        // 5. Palmeiras Tropicais em Silhueta
        const drawPalm = (px, py, scale) => {
            ctx.strokeStyle = '#05070c';
            ctx.lineWidth = 12 * scale;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo(px + 25 * scale, py - 140 * scale, px - 10 * scale, py - 270 * scale);
            ctx.stroke();

            const topX = px - 10 * scale, topY = py - 270 * scale;
            ctx.fillStyle = '#05070c';
            for (let a = 0; a < 6; a++) {
                const ang = (a / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(topX + Math.cos(ang) * 55 * scale, topY + Math.sin(ang) * 28 * scale, 60 * scale, 14 * scale, ang, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        drawPalm(width * 0.12, height * 0.85, 1.15);
        drawPalm(width * 0.90, height * 0.85, 1.25);

        // 6. Asfalto Inferior + Carro Esportivo em Destaque
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, height * 0.76, width, height * 0.24);

        const cx = width * 0.32, cy = height * 0.74;
        // Carroceria estilizada
        ctx.fillStyle = sceneIndex === 1 ? '#1e293b' : '#ec4899';
        ctx.beginPath();
        ctx.moveTo(cx - 140, cy + 25);
        ctx.lineTo(cx - 125, cy - 12);
        ctx.lineTo(cx - 45, cy - 45);
        ctx.lineTo(cx + 65, cy - 45);
        ctx.lineTo(cx + 145, cy - 8);
        ctx.lineTo(cx + 150, cy + 25);
        ctx.closePath();
        ctx.fill();

        // Vidros escuros
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cx - 38, cy - 38);
        ctx.lineTo(cx + 55, cy - 38);
        ctx.lineTo(cx + 95, cy - 10);
        ctx.lineTo(cx - 65, cy - 10);
        ctx.closePath();
        ctx.fill();

        // Faróis acesos com brilho
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(cx + 142, cy + 6, 10, 0, Math.PI * 2); ctx.fill();

        // Rodas cromadas
        [-85, 90].forEach(wx => {
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(cx + wx, cy + 26, 28, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(cx + wx, cy + 26, 15, 0, Math.PI * 2); ctx.fill();
        });

        // 7. Moldura de Revista / HQ Clássica do GTA (Bordas pretas estilizadas)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 18;
        ctx.strokeRect(0, 0, width, height);

        return canvas.toDataURL('image/jpeg', 0.9);
    },

    // Inicia o Carrossel Visual + Barra de Progresso
    start(onCompleteCallback) {
        const loadScreen = document.getElementById('vc-loading-screen');
        const artImg = document.getElementById('vc-loading-slide');
        const titleEl = document.getElementById('vc-slide-title');
        const subEl = document.getElementById('vc-slide-sub');
        const bar = document.getElementById('vc-load-bar');
        const pctText = document.getElementById('vc-load-pct');
        const statusText = document.getElementById('vc-load-status');

        loadScreen.classList.remove('hidden');

        // Pré-gera as 4 artes estilo GTA
        const generatedSlides = [0, 1, 2, 3].map(idx => this.generateGTAArtwork(idx));
        let currentSlide = 0;

        const applySlide = (idx) => {
            const info = this.slideCaptions[idx % this.slideCaptions.length];
            if (titleEl) titleEl.textContent = info.title;
            if (subEl) subEl.textContent = info.sub;

            if (artImg) {
                // Tenta carregar imagem personalizada em game/img/telaX.jpg; se não existir, usa a arte GTA gerada!
                const testImg = new Image();
                testImg.onload = () => { artImg.src = this.customImageUrls[idx]; };
                testImg.onerror = () => { artImg.src = generatedSlides[idx]; };
                testImg.src = this.customImageUrls[idx];
            }
        };

        applySlide(0);

        const loadingSteps = [
            "Carregando texturas urbanas de ArcadeCity (+450.000 variações)...",
            "Gerando população 3D, NPCs e frota de carros esportivos...",
            "Sincronizando arsenal, interiors de lojas e sistema de GPS...",
            "Conectando rádio Flash FM 80s e polícia VCPD..."
        ];

        let pct = 0;
        const progressTimer = setInterval(() => {
            pct += 5;
            if (bar) bar.style.width = `${pct}%`;
            if (pctText) pctText.textContent = `${pct}%`;

            // Troca a arte estilo GTA a cada 25% do carregamento
            const stage = Math.min(3, Math.floor(pct / 25));
            if (stage !== currentSlide && pct < 100) {
                currentSlide = stage;
                applySlide(currentSlide);
            }
            if (statusText && loadingSteps[stage]) {
                statusText.textContent = loadingSteps[stage];
            }

            if (pct >= 100) {
                clearInterval(progressTimer);
                setTimeout(() => {
                    loadScreen.classList.add('hidden');
                    if (typeof onCompleteCallback === 'function') onCompleteCallback();
                }, 450);
            }
        }, 240);
    }
};
