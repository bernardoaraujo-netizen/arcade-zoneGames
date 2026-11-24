// game/js/models.js - Anatomia Humana Articulada, +5.000 Variações de NPCs,
// Motor de Animação Procedural (+100k variações), Armas 3D, Projéteis e Veículos Mecânicos

window.VCModels = {
    // =========================================================================
    // 1. BANCO COMBINATÓRIO DE +5.000 VARIAÇÕES DE PERSONAGENS & NPCs
    // =========================================================================
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
            { scaleX: 0.92, scaleZ: 0.90, height: 0.96 }, // Atlético / Esguio
            { scaleX: 1.00, scaleZ: 1.00, height: 1.00 }, // Padrão
            { scaleX: 1.14, scaleZ: 1.12, height: 1.03 }, // Musculoso / Forte
            { scaleX: 1.24, scaleZ: 1.25, height: 0.98 }, // Robusto
            { scaleX: 0.88, scaleZ: 0.88, height: 1.04 }  // Alto
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
            gaitFrequency: 0.85 + Math.random() * 0.35, // Variação única de passada
            armSwingAmp: 0.55 + Math.random() * 0.35    // Variação única de balanço de braço
        };
    },

    // =========================================================================
    // 2. CONSTRUÇÃO DE PERSONAGEM HUMANO ARTICULADO (ROSTO, PESCOÇO, TRONCO,
    //    OMBROS, BRAÇOS, ANTEBRAÇOS, MÃOS, QUADRIL, COXAS, PERNAS E PÉS)
    // =========================================================================
    createHuman3D(options = {}) {
        const gene = options.isPlayer ? {
            skinHex: '#f1c27d',
            hairColor: 0x1c1917,
            hairStyle: 'short',
            shirtHex: '#06b6d4',
            shirtStyle: 'hawaiian',
            pantsColor: 0x1e3a8a,
            shoeColor: 0xf8fafc,
            build: { scaleX: 1.02, scaleZ: 1.0, height: 1.02 },
            hasBeard: false,
            hasGlasses: false,
            gaitFrequency: 1.0,
            armSwingAmp: 0.68
        } : (options.isCop ? {
            skinHex: options.skinHex || '#e0ac69',
            hairColor: 0x09090b,
            hairStyle: 'cop',
            shirtHex: '#1e3a8a',
            shirtStyle: 'cop',
            pantsColor: 0x0f172a,
            shoeColor: 0x09090b,
            build: { scaleX: 1.06, scaleZ: 1.04, height: 1.02 },
            hasBeard: Math.random() > 0.5,
            hasGlasses: true,
            gaitFrequency: 1.05,
            armSwingAmp: 0.70
        } : this.generateRandomNPCGene(options.seed));

        const root = new THREE.Group();
        const bodyContainer = new THREE.Group();
        bodyContainer.scale.set(gene.build.scaleX, gene.build.height, gene.build.scaleZ);
        root.add(bodyContainer);

        const faceTex = VCTextures.createFaceTexture(gene.skinHex, gene.hasBeard);
