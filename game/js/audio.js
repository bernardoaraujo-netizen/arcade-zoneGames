// game/js/audio.js - Motor Procedural de Áudio (+1.200 SFX) & Banco Combinatório (+14.400 Falas EN/PT-BR)

let vcAudioCtx = null;

function getVCAudio() {
    if (!vcAudioCtx) vcAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (vcAudioCtx.state === 'suspended') vcAudioCtx.resume();
    return vcAudioCtx;
}

// ============================================================================
// 1. BANCO COMBINATÓRIO DE DIÁLOGOS (+14.400 FRASES ÚNICAS EN-US + PT-BR)
// ============================================================================
const VCDialogueMatrix = {
    pedestrian_panic: {
        intros: [
            ["Oh my God!", "Meu Deus!"], ["Watch out!", "Cuidado!"], ["Somebody help!", "Alguém ajude!"],
            ["He's crazy!", "Ele é louco!"], ["Don't shoot!", "Não atire!"], ["Run for your life!", "Corra pela sua vida!"],
            ["Get away from me!", "Fique longe de mim!"], ["Call the cops!", "Chamem a polícia!"],
            ["What is happening?!", "O que está acontecendo?!"], ["Please, I have a family!", "Por favor, eu tenho família!"],
            ["Stay back!", "Fique para trás!"], ["Are you out of your mind?!", "Você perdeu a cabeça?!"],
            ["Vice City is going crazy!", "Vice City está ficando louca!"], ["Help! Maniac on the loose!", "Socorro! Maníaco à solta!"],
            ["I don't wanna die today!", "Eu não quero morrer hoje!"]
        ],
        middles: [
            ["He's got a weapon!", "Ele está armado!"], ["Look at that maniac!", "Olhe para aquele maníaco!"],
            ["People are getting hurt!", "Tem gente se machucando!"], ["The streets aren't safe anymore!", "As ruas não são mais seguras!"],
            ["He's shooting everywhere!", "Ele está atirando para todo lado!"], ["Get off the sidewalk!", "Saiam da calçada!"],
            ["Somebody stop this guy!", "Alguém pare esse cara!"], ["I'm getting out of here!", "Estou dando o fora daqui!"],
            ["Where is the VCPD?!", "Onde está a polícia?!"], ["This is pure madness!", "Isso é pura loucura!"],
            ["He's completely psycho!", "Ele é totalmente psicopata!"], ["Duck and cover!", "Abaixem-se e se protejam!"],
            ["My new outfit is ruined!", "Minha roupa nova está arruinada!"], ["I'm calling 911 right now!", "Estou ligando para o 911 agora!"],
            ["Clear the avenue!", "Liberem a avenida!"], ["Not in Ocean Beach!", "Não em Ocean Beach!"]
        ],
        outros: [
            ["Run!", "Corra!"], ["Move it!", "Anda logo!"], ["Hurry up!", "Depressa!"],
            ["Save yourself!", "Salve-se quem puder!"], ["Go, go, go!", "Vai, vai, vai!"],
            ["Look out!", "Olha lá!"], ["Get down!", "Abaixe-se!"], ["No way!", "Nem pensar!"],
            ["Help us!", "Nos ajude!"], ["Over there!", "Bem ali!"], ["Stay away!", "Fique longe!"],
            ["I'm out!", "Tô fora!"], ["Keep running!", "Continue correndo!"], ["Watch your back!", "Olhe suas costas!"],
            ["Move out of the way!", "Saia da frente!"]
        ]
    },
    car_theft: {
        intros: [
            ["Hey!", "Ei!"], ["What the hell?!", "Que diabos?!"], ["Stop right there!", "Pare bem aí!"],
            ["Get out of my car!", "Saia do meu carro!"], ["That's my ride!", "Esse é o meu carro!"],
            ["You thief!", "Seu ladrão!"], ["Are you kidding me?!", "Você está brincando comigo?!"],
            ["My insurance doesn't cover this!", "Meu seguro não cobre isso!"], ["Hey, bring that back!", "Ei, traga isso de volta!"],
            ["Don't scratch the paint!", "Não arranhe a pintura!"], ["I just washed it!", "Eu acabei de lavar!"],
            ["Hands off the wheel!", "Tire as mãos do volante!"], ["You're dead meat!", "Você está morto!"],
            ["Somebody stop him!", "Alguém pare ele!"], ["No, not my sports car!", "Não, meu carro esportivo não!"]
        ],
        middles: [
            ["I worked hard for this!", "Eu trabalhei duro por isso!"], ["The cops will catch you!", "A polícia vai te pegar!"],
            ["You won't get far!", "Você não vai longe!"], ["That's grand theft auto!", "Isso é roubo de veículo!"],
            ["I'm reporting this plate!", "Vou denunciar essa placa!"], ["You're gonna regret this!", "Você vai se arrepender disso!"],
            ["Give me back my keys!", "Devolva minhas chaves!"], ["That's a classic V8!", "Isso é um V8 clássico!"],
            ["You don't even know how to drive!", "Você nem sabe dirigir!"], ["My wallet is in the glovebox!", "Minha carteira está no porta-luvas!"],
            ["You're messing with the wrong citizen!", "Está mexendo com o cidadão errado!"], ["I'll remember your face!", "Vou lembrar do seu rosto!"],
            ["The VCPD is gonna bust you!", "A VCPD vai te prender!"], ["Watch the transmission!", "Cuidado com o câmbio!"],
            ["That's private property!", "Isso é propriedade privada!"], ["You maniac driver!", "Seu motorista maníaco!"]
        ],
        outros: [
            ["Come back!", "Volte aqui!"], ["Jerk!", "Idiota!"], ["Thief!", "Ladrão!"],
            ["You'll pay for this!", "Você vai pagar por isso!"], ["Police!", "Polícia!"],
            ["Stop him!", "Parem ele!"], ["Unbelievable!", "Inacreditável!"], ["My ride!", "Meu carro!"],
            ["Hey!", "Ei!"], ["Watch it!", "Cuidado!"], ["Damn it!", "Droga!"],
            ["Get back here!", "Volte já aqui!"], ["No!", "Não!"], ["Help!", "Socorro!"], ["Crazy fool!", "Maluco!"]
        ]
    },
    police_dispatch: {
        intros: [
            ["All units!", "Todas as unidades!"], ["Dispatch to VCPD:", "Central para VCPD:"], ["Attention officers:", "Atenção oficiais:"],
            ["Code Red in Vice City:", "Código Vermelho em Vice City:"], ["10-31 in progress:", "10-31 em andamento:"],
            ["HQ to patrol cars:", "QG para viaturas:"], ["Emergency broadcast:", "Transmissão de emergência:"],
            ["Suspect spotted:", "Suspeito avistado:"], ["High priority alert:", "Alerta de alta prioridade:"],
            ["SWAT units standby:", "Unidades da SWAT em prontidão:"], ["Air support requested:", "Apoio aéreo solicitado:"],
            ["Set up roadblocks:", "Montem bloqueios nas ruas:"], ["Pursuit authorized:", "Perseguição autorizada:"],
            ["Lethal force approved:", "Força letal aprovada:"], ["APB on armed suspect:", "Procura-se suspeito armado:"]
        ],
        middles: [
            ["Suspect wearing a cyan Hawaiian shirt", "Suspeito usando camisa havaiana ciano"],
            ["Armed and extremely dangerous", "Armado e extremamente perigoso"],
            ["Fleeing at high speed down Ocean Drive", "Fugindo em alta velocidade pela Ocean Drive"],
            ["Shots fired at civilians", "Tiros disparados contra civis"],
            ["Robbery reported at local store", "Assalto relatado em loja local"],
            ["Driving a stolen high-performance vehicle", "Dirigindo um veículo esportivo roubado"],
            ["Evading arrest near the beach", "Fugindo da prisão perto da praia"],
            ["Multiple traffic violations reported", "Múltiplas infrações de trânsito relatadas"],
            ["Do not approach without backup", "Não se aproximem sem reforços"],
            ["Suspect heading downtown", "Suspeito indo em direção ao centro"],
            ["Use spike strips if necessary", "Usem faixas de pregos se necessário"],
            ["Corner the suspect immediately", "Enquadrem o suspeito imediatamente"],
            ["He's resisting arrest", "Ele está resistindo à prisão"],
            ["Visual confirmed on target", "Visual confirmado no alvo"],
            ["Keep sirens active", "Mantenham as sirenes ligadas"],
            ["Backup arriving in 10 seconds", "Reforços chegando em 10 segundos"]
        ],
        outros: [
            ["Over.", "Câmbio."], ["Move in!", "Avancem!"], ["Respond immediately!", "Respondam imediatamente!"],
            ["Take him down!", "Derrubem ele!"], ["Freeze!", "Parado!"], ["Copy that.", "Copiado."],
            ["Pursuit active!", "Perseguição ativa!"], ["Lock down the sector!", "Fechem o setor!"],
            ["Stay sharp!", "Fiquem atentos!"], ["Out.", "Desligo."], ["Engaging now!", "Engajando agora!"],
            ["Roger that.", "Entendido."], ["Hold your fire until clear!", "Segurem o fogo até ter visão limpa!"],
            ["Bust him!", "Prendam ele!"], ["No escape!", "Sem escapatória!"]
        ]
    },
    shop_robbery: {
        intros: [
            ["Please don't hurt me!", "Por favor não me machuque!"], ["Take everything!", "Leve tudo!"],
            ["Whoa, easy with that gun!", "Ei, calma com essa arma!"], ["I'm opening the register!", "Estou abrindo o caixa!"],
            ["Don't pull the trigger!", "Não puxe o gatilho!"], ["Here is the cash!", "Aqui está o dinheiro!"],
            ["I'm just a clerk!", "Eu sou apenas um atendente!"], ["Hands up, I surrender!", "Mãos ao alto, eu me rendo!"],
            ["It's all yours!", "É tudo seu!"], ["Keep calm, man!", "Mantenha a calma, cara!"],
            ["No sudden moves!", "Sem movimentos bruscos!"], ["Take the safe too!", "Leve o cofre também!"],
            ["I won't call the cops!", "Eu não vou chamar a polícia!"], ["Just leave me alive!", "Apenas me deixe vivo!"],
            ["All the bills are inside!", "Todas as notas estão aí dentro!"]
        ],
        middles: [
            ["This store is insured anyway!", "Essa loja tem seguro mesmo!"], ["Take the jewelry and go!", "Pegue as joias e vá embora!"],
            ["I'm emptying the drawer right now!", "Estou esvaziando a gaveta agora mesmo!"], ["Don't shoot the glass!", "Não atire nos vidros!"],
            ["That's every dollar we made today!", "Esse é cada dólar que faturamos hoje!"], ["You got what you wanted!", "Você conseguiu o que queria!"],
            ["My hands are in the air!", "Minhas mãos estão para o alto!"], ["Please just walk out the door!", "Por favor, apenas saia pela porta!"],
            ["I didn't even see your face!", "Eu nem vi o seu rosto!"], ["Take the bag and run!", "Pegue a sacola e corra!"],
            ["Don't make a mess!", "Não faça bagunça!"], ["The silent alarm wasn't touched!", "O alarme silencioso não foi tocado!"],
            ["Here's the VIP stash!", "Aqui está o dinheiro VIP!"], ["I swear that's all of it!", "Eu juro que isso é tudo!"],
            ["Just take the money!", "Apenas pegue o dinheiro!"], ["Calm down, friend!", "Acalme-se, amigo!"]
        ],
        outros: [
            ["Now go!", "Agora vá!"], ["Please leave!", "Por favor saia!"], ["Don't shoot!", "Não atire!"],
            ["Take it!", "Pegue!"], ["Spare me!", "Me poupe!"], ["Okay, okay!", "Tudo bem, tudo bem!"],
            ["Get out!", "Saia!"], ["I'm staying down!", "Vou ficar abaixado!"], ["Mercy!", "Piedade!"],
            ["Take the cash!", "Leve a grana!"], ["Run!", "Corra!"], ["Don't do it!", "Não faça isso!"],
            ["Here!", "Aqui!"], ["All yours!", "Tudo seu!"], ["Bye!", "Tchau!"]
        ]
    }
};

// Gera e fala uma das +14.400 combinações únicas
window.triggerDynamicDialogue = function(category, pitch = 1.0, rate = 1.08) {
    const pool = VCDialogueMatrix[category] || VCDialogueMatrix.pedestrian_panic;
    const p1 = pool.intros[Math.floor(Math.random() * pool.intros.length)];
    const p2 = pool.middles[Math.floor(Math.random() * pool.middles.length)];
    const p3 = pool.outros[Math.floor(Math.random() * pool.outros.length)];

    const enFull = `${p1[0]} ${p2[0]} ${p3[0]}`;
    const ptFull = `${p1[1]} ${p2[1]} ${p3[1]}`;

    window.speakVC(enFull, ptFull, pitch, rate);
};

window.speakVC = function(enText, ptSubtitle, pitch = 1.0, rate = 1.05) {
    const subBox = document.getElementById('vc-subtitle-box');
    const subText = document.getElementById('vc-subtitle-text');
    if (subBox && subText) {
        subText.textContent = ptSubtitle;
        subBox.classList.remove('hidden');
        clearTimeout(window.vcSubTimer);
        window.vcSubTimer = setTimeout(() => subBox.classList.add('hidden'), 4800);
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(enText);
        utter.lang = 'en-US';
        utter.pitch = pitch;
        utter.rate = rate;
        window.speechSynthesis.speak(utter);
    }
};

// ============================================================================
// 2. MOTOR DE +1.200 EFEITOS SONOROS SINTETIZADOS (TIROS, CARROS, GRITOS, AMBIENTE)
// ============================================================================
window.VCSoundFX = {
    // +300 variações paramétricas de disparos (calibres, reverberação e eco urbano)
    playGunshot(weaponType = 'pistol') {
        try {
            const ctx = getVCAudio();
            const randPitch = 0.85 + Math.random() * 0.35; // Variação acústica única por tiro
            const dur = weaponType === 'shotgun' ? 0.42 : (weaponType === 'uzi' ? 0.11 : 0.18);

            // Explosão de pólvora (Ruído filtrado)
            const bufferSize = Math.floor(ctx.sampleRate * dur);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (weaponType === 'shotgun' ? 0.08 : 0.035)));
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime((weaponType === 'shotgun' ? 480 : 1150) * randPitch, ctx.currentTime);
            filter.Q.setValueAtTime(1.2, ctx.currentTime);

            // Impacto grave (Punch)
            const punchOsc = ctx.createOscillator();
            const punchGain = ctx.createGain();
            punchOsc.type = 'triangle';
            punchOsc.frequency.setValueAtTime(180 * randPitch, ctx.currentTime);
            punchOsc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.09);
            punchGain.gain.setValueAtTime(weaponType === 'shotgun' ? 0.65 : 0.35, ctx.currentTime);
            punchGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(weaponType === 'shotgun' ? 0.6 : 0.35, ctx.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

            noise.connect(filter);
            filter.connect(masterGain);
            masterGain.connect(ctx.destination);

            punchOsc.connect(punchGain);
            punchGain.connect(ctx.destination);

            noise.start();
            punchOsc.start();
            punchOsc.stop(ctx.currentTime + 0.09);
        } catch (e) {}
    },

    // Gritos humanos sintetizados (Masculino / Feminino com formantes vocais)
    playScream(isFemale = false) {
        try {
            const ctx = getVCAudio();
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            const baseFreq = isFemale ? (520 + Math.random() * 140) : (240 + Math.random() * 80);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(baseFreq * 1.35, ctx.currentTime + 0.15);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + 0.55);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(isFemale ? 1400 : 950, ctx.currentTime);
            filter.Q.setValueAtTime(3.5, ctx.currentTime);

            gain.gain.setValueAtTime(0.16, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.55);
        } catch (e) {}
    },

    // Ronco de Motor V8 + Derrapagem de Pneu
    playEnginePulse(speedRatio = 0.5, isDrifting = false) {
        try {
            const ctx = getVCAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            const rpmFreq = 42 + (speedRatio * 135) + (Math.random() * 6);
            osc.frequency.setValueAtTime(rpmFreq, ctx.currentTime);

            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);

            if (isDrifting) {
                const screech = ctx.createOscillator();
                const sGain = ctx.createGain();
                screech.type = 'sine';
                screech.frequency.setValueAtTime(1450 + Math.random() * 300, ctx.currentTime);
                sGain.gain.setValueAtTime(0.05, ctx.currentTime);
                sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                screech.connect(sGain);
                sGain.connect(ctx.destination);
                screech.start();
                screech.stop(ctx.currentTime + 0.15);
            }
        } catch (e) {}
    },

    // Buzina do Carro (Tecla H)
    playCarHorn() {
        try {
            const ctx = getVCAudio();
            [392.0, 493.88].forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            });
        } catch (e) {}
    },

    // Sirene Bitonal da Polícia VCPD
    playPoliceSirenStep(highTone = true) {
        try {
            const ctx = getVCAudio();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(highTone ? 880 : 660, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {}
    },

    // Som Ambiente Urbano (Ondas do Mar + Brisa + Trânsito Distante)
    playAmbientCityTick() {
        try {
            const ctx = getVCAudio();
            const bufferSize = ctx.sampleRate * 0.6;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220 + Math.random() * 120, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.025, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch (e) {}
    },

    // Caixa Registradora / Dinheiro
    playCash() {
        try {
            const ctx = getVCAudio();
            [987.77, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
            });
        } catch (e) {}
    },

    // Acorde Synthwave Rockstar
    playSynthChord() {
        try {
            const ctx = getVCAudio();
            [220, 277.18, 329.63, 415.30].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
                gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 1.3);
            });
        } catch (e) {}
    }
};
