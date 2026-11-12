/**
 * Laboratorio de Ritmo Musical - Versión 2 con Web Audio API avanzada,
 * assets locales estables, tempo fijo a 75 BPM, tutoriales interactivos y desafío de velocidad.
 */

// Rutas locales de los assets gráficos solicitados
const FIGURES = {
    pan: {
        id: 'pan',
        name: 'PAN',
        syllables: 1,
        image: 'assets/pan.png',
        fallbackImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10,50 Q10,30 50,25 Q90,30 90,50 Q90,75 50,80 Q10,75 10,50 Z" fill="%23d35400"/><path d="M20,45 Q50,35 80,45" stroke="%23b9770e" stroke-width="4" fill="none"/></svg>',
        desc: 'Una sílaba, un sonido (Negra).'
    },
    queso: {
        id: 'queso',
        name: 'QUESO',
        syllables: 2,
        image: 'assets/queso.png',
        fallbackImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,80 90,80 50,20" fill="%23f1c40f"/><circle cx="45" cy="55" r="6" fill="%23d4ac0d"/><circle cx="65" cy="65" r="5" fill="%23d4ac0d"/><circle cx="35" cy="70" r="4" fill="%23d4ac0d"/></svg>',
        desc: 'Dos sílabas, dos sonidos (Corcheas).'
    },
    silencio: {
        id: 'silencio',
        name: 'SILENCIO',
        syllables: 0,
        image: 'assets/silencio.png',
        fallbackImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e2e8f0"/><text x="50" y="62" font-size="42" text-anchor="middle" fill="%232c3e50">🤫</text></svg>',
        desc: 'Un pulso completo sin sonido (Silencio de negra).'
    },
    mariposa: {
        id: 'mariposa',
        name: 'MARIPOSA',
        syllables: 4,
        image: 'assets/mariposa.png',
        fallbackImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,30 Q30,10 15,30 Q5,50 30,70 Q50,90 50,90 Q50,90 70,70 Q95,50 85,30 Q70,10 50,30 Z" fill="%23e67e22"/><line x1="50" y1="20" x2="50" y2="85" stroke="%232c3e50" stroke-width="4"/></svg>',
        desc: 'Cuatro sílabas, cuatro sonidos (Semicorcheas).'
    }
};

// Estructura de las 6 etapas obligatorias + Resultados
const STAGES = [
    {
        id: 1,
        type: 'tutorial',
        title: 'Etapa 1: Tutorial Interactivo de PAN y QUESO',
        figures: ['pan', 'queso'],
        interactiveType: 'pan-queso'
    },
    {
        id: 2,
        type: 'exercise',
        title: 'Etapa 2: Reconocimiento Auditivo (PAN y QUESO)',
        figures: ['pan', 'queso'],
        exercisesCount: 5
    },
    {
        id: 3,
        type: 'tutorial',
        title: 'Etapa 3: Tutorial Interactivo de SILENCIO',
        figures: ['pan', 'queso', 'silencio'],
        interactiveType: 'silencio'
    },
    {
        id: 4,
        type: 'exercise',
        title: 'Etapa 4: Reconocimiento con Silencios',
        figures: ['pan', 'queso', 'silencio'],
        exercisesCount: 5
    },
    {
        id: 5,
        type: 'tutorial',
        title: 'Etapa 5: Tutorial Interactivo de MARIPOSA',
        figures: ['pan', 'queso', 'silencio', 'mariposa'],
        interactiveType: 'mariposa'
    },
    {
        id: 6,
        type: 'exercise',
        title: 'Etapa 6: Reconocimiento Auditivo Final',
        figures: ['pan', 'queso', 'silencio', 'mariposa'],
        exercisesCount: 6
    }
];

// Estado global
let currentStageIndex = 0;
let currentExerciseIndex = 0;
let currentPattern = [];
let userAnswers = [null, null, null, null];
let audioCtx = null;
let fixedBpm = 75; // Tempo fijo estricto de 75 BPM para etapas normales
let stats = { total: 0, correct: 0 };
let selectedTokenId = null;
let tutorialPassed = false;

window.addEventListener('DOMContentLoaded', () => {
    initAudio();
    setupEventListeners();
    loadStage();
});

function initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
}

function setupEventListeners() {
    document.getElementById('btn-play-count').addEventListener('click', () => playCountAndPattern(fixedBpm));
    document.getElementById('btn-replay').addEventListener('click', () => playPatternOnly(fixedBpm));
    document.getElementById('btn-check').addEventListener('click', checkAnswers);
    document.getElementById('btn-next-exercise').addEventListener('click', nextExercise);
    document.getElementById('btn-next-tutorial').addEventListener('click', advanceStage);
    document.getElementById('btn-restart').addEventListener('click', restartApp);

    // Botones del Desafío de Velocidad
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bpmVal = parseInt(e.target.dataset.bpm);
            startSpeedChallenge(bpmVal);
        });
    });
}

// Carga de Etapas
function loadStage() {
    const stage = STAGES[currentStageIndex];
    document.getElementById('stage-title').textContent = stage.title;
    updateProgressBar();

    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('audio-control-panel').classList.add('hidden');
    document.getElementById('exercise-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');

    if (stage.type === 'tutorial') {
        loadInteractiveTutorial(stage);
    } else {
        document.getElementById('audio-control-panel').classList.remove('hidden');
        document.getElementById('exercise-section').classList.remove('hidden');
        currentExerciseIndex = 0;
        loadNewExercise();
    }
}

function updateProgressBar() {
    const progress = (currentStageIndex / STAGES.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

function advanceStage() {
    currentStageIndex++;
    if (currentStageIndex < STAGES.length) {
        loadStage();
    } else {
        showResults();
    }
}

// Tutoriales Interactivos Audiovisuales con Microactividad
function loadInteractiveTutorial(stage) {
    const mainContent = document.getElementById('main-content');
    mainContent.classList.remove('hidden');
    tutorialPassed = false;
    document.getElementById('btn-next-tutorial').classList.add('hidden');
    document.getElementById('tutorial-feedback').classList.add('hidden');

    const tutorialContent = document.getElementById('tutorial-content');
    const interactiveArea = document.getElementById('tutorial-interactive-area');
    interactiveArea.classList.remove('hidden');
    const optionsContainer = document.getElementById('tutorial-options');
    optionsContainer.innerHTML = '';

    if (stage.interactiveType === 'pan-queso') {
        tutorialContent.innerHTML = `
            <h3>Descubriendo el PAN y el QUESO</h3>
            <p>El <strong>PAN</strong> suena una vez por pulso (negra). El <strong>QUESO</strong> (ti-ti) suena dos veces dividiendo el pulso en dos partes iguales.</p>
            <div class="tutorial-card-grid">
                <div class="tutorial-item"><img src="${FIGURES.pan.image}" onerror="this.src='${FIGURES.pan.fallbackImage}'"><strong>PAN</strong></div>
                <div class="tutorial-item"><img src="${FIGURES.queso.image}" onerror="this.src='${FIGURES.queso.fallbackImage}'"><strong>QUESO</strong></div>
            </div>
        `;
        
        // Microactividad: Identificar sonido aleatorio entre Pan y Queso
        setupTutorialChallenge(['pan', 'queso'], optionsContainer);

    } else if (stage.interactiveType === 'silencio') {
        tutorialContent.innerHTML = `
            <h3>El Pulso Avanza con el SILENCIO 🤫</h3>
            <p>El pulso continúa constante, pero en el silencio <strong>no hay ataque sonoro</strong>. Su duración es exactamente igual a la de un PAN.</p>
            <div class="tutorial-card-grid">
                <div class="tutorial-item"><img src="${FIGURES.silencio.image}" onerror="this.src='${FIGURES.silencio.fallbackImage}'"><strong>SILENCIO</strong></div>
            </div>
        `;
        setupTutorialChallenge(['pan', 'silencio'], optionsContainer);

    } else if (stage.interactiveType === 'mariposa') {
        tutorialContent.innerHTML = `
            <h3>La Mariposa 🦋 (Semicorcheas)</h3>
            <p>La mariposa divide el pulso en <strong>cuatro partes iguales</strong> (ti-ri-ti-ri).</p>
            <div class="tutorial-card-grid">
                <div class="tutorial-item"><img src="${FIGURES.mariposa.image}" onerror="this.src='${FIGURES.mariposa.fallbackImage}'"><strong>MARIPOSA</strong></div>
            </div>
        `;
        setupTutorialChallenge(['pan', 'queso', 'silencio', 'mariposa'], optionsContainer);
    }
}

function setupTutorialChallenge(allowedFigs, container) {
    let targetFig = allowedFigs[Math.floor(Math.random() * allowedFigs.length)];

    const listenBtn = document.createElement('button');
    listenBtn.className = 'btn primary';
    listenBtn.textContent = '🔊 Escuchar Ejemplo del Tutor';
    listenBtn.style.margin = '10px auto';
    listenBtn.addEventListener('click', () => {
        playSingleFigureAudio(targetFig, fixedBpm);
    });

    container.appendChild(listenBtn);

    const figsRow = document.createElement('div');
    figsRow.className = 'tokens-flex';
    figsRow.style.marginTop = '10px';

    allowedFigs.forEach(figKey => {
        const fig = FIGURES[figKey];
        const token = document.createElement('div');
        token.className = 'rhythm-token';
        token.innerHTML = `<img src="${fig.image}" onerror="this.src='${fig.fallbackImage}'"><span class="token-label">${fig.name}</span>`;
        token.style.cursor = 'pointer';

        token.addEventListener('click', () => {
            const feedbackBox = document.getElementById('tutorial-feedback');
            feedbackBox.classList.remove('hidden');
            if (figKey === targetFig) {
                feedbackBox.textContent = '¡Correcto! Reconociste el sonido perfectamente 🌟';
                feedbackBox.className = 'feedback-box correct';
                tutorialPassed = true;
                document.getElementById('btn-next-tutorial').classList.remove('hidden');
            } else {
                feedbackBox.textContent = 'Ese no era. Volvé a escuchar el ejemplo atentamente.';
                feedbackBox.className = 'feedback-box incorrect';
            }
        });
        figsRow.appendChild(token);
    });
    container.appendChild(figsRow);
}

// Generación de Ejercicios de Reconocimiento
function loadNewExercise() {
    const stage = STAGES[currentStageIndex];
    userAnswers = [null, null, null, null];
    resetSlotsUI();
    document.getElementById('feedback-message').classList.add('hidden');
    document.getElementById('btn-next-exercise').classList.add('hidden');
    document.getElementById('btn-check').disabled = true;
    document.getElementById('btn-replay').disabled = true;

    currentPattern = [];
    for (let i = 0; i < 4; i++) {
        const randIdx = Math.floor(Math.random() * stage.figures.length);
        currentPattern.push(stage.figures[randIdx]);
    }

    renderTokensBank(stage.figures);
}

function renderTokensBank(allowedFigures) {
    const bank = document.getElementById('tokens-bank');
    bank.innerHTML = '';
    allowedFigures.forEach(figKey => {
        const fig = FIGURES[figKey];
        const token = document.createElement('div');
        token.className = 'rhythm-token';
        token.draggable = true;
        token.innerHTML = `
            <img src="${fig.image}" onerror="this.src='${fig.fallbackImage}'" alt="${fig.name}">
            <span class="token-label">${fig.name}</span>
        `;

        token.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', fig.id);
        });

        token.addEventListener('click', () => {
            document.querySelectorAll('.rhythm-token').forEach(t => t.classList.remove('selected-touch'));
            token.classList.add('selected-touch');
            selectedTokenId = fig.id;
        });

        bank.appendChild(token);
    });

    setupDropzones();
}

function setupDropzones() {
    const dropzones = document.querySelectorAll('.slot-dropzone');
    dropzones.forEach(zone => {
        const slotIdx = parseInt(zone.dataset.slot);

        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            placeTokenInSlot(slotIdx, e.dataTransfer.getData('text/plain'));
        });

        zone.addEventListener('click', () => {
            if (selectedTokenId) {
                placeTokenInSlot(slotIdx, selectedTokenId);
                selectedTokenId = null;
                document.querySelectorAll('.rhythm-token').forEach(t => t.classList.remove('selected-touch'));
            } else if (userAnswers[slotIdx]) {
                userAnswers[slotIdx] = null;
                zone.innerHTML = '';
                checkCompletionStatus();
            }
        });
    });
}

function placeTokenInSlot(slotIdx, figId) {
    userAnswers[slotIdx] = figId;
    const zone = document.querySelector(`.slot-dropzone[data-slot="${slotIdx}"]`);
    const fig = FIGURES[figId];
    zone.innerHTML = `<img src="${fig.image}" onerror="this.src='${fig.fallbackImage}'" alt="${fig.name}">`;
    checkCompletionStatus();
}

function resetSlotsUI() {
    document.querySelectorAll('.slot-dropzone').forEach(zone => zone.innerHTML = '');
}

function checkCompletionStatus() {
    const isComplete = userAnswers.every(ans => ans !== null);
    document.getElementById('btn-check').disabled = !isComplete;
}

// Síntesis Web Audio API diferenciada (Cuenta previa vs Patrones rítmicos)
function playSinusoidalBeep(time, isAccent = false) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1000 : 750, time);

    gain.gain.setValueAtTime(isAccent ? 0.4 : 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
}

function playWoodblockAttack(time) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.04);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
}

function playSingleFigureAudio(figKey, bpm) {
    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;
    playRhythmPatternForSequence([figKey], now, beatInterval, null);
}

function playCountAndPattern(bpm) {
    if (!audioCtx) initAudio();
    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;

    // 1. Cuenta previa con tonos sinusoidales
    for (let i = 0; i < 4; i++) {
        const beatTime = now + (i * beatInterval);
        playSinusoidalBeep(beatTime, i === 0);
        setTimeout(() => highlightCountBox(i + 1, bpm), (beatTime - now) * 1000);
    }

    // 2. Patrón rítmico con sonido percusivo de madera
    const patternStartTime = now + (4 * beatInterval);
    playRhythmPatternForSequence(currentPattern, patternStartTime, beatInterval, () => {
        document.getElementById('btn-replay').disabled = false;
    });
}

function playPatternOnly(bpm) {
    if (!audioCtx) initAudio();
    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;
    playRhythmPatternForSequence(currentPattern, now, beatInterval, null);
}

function playRhythmPatternForSequence(pattern, startTime, beatInterval, onComplete) {
    pattern.forEach((figKey, pulseIdx) => {
        const pulseStart = startTime + (pulseIdx * beatInterval);
        
        // Animación visual del pulso en los slots si estamos en ejercicio
        setTimeout(() => {
            highlightPulseSlot(pulseIdx);
        }, (pulseStart - audioCtx.currentTime) * 1000);

        if (figKey === 'pan') {
            playWoodblockAttack(pulseStart);
        } else if (figKey === 'queso') {
            playWoodblockAttack(pulseStart);
            playWoodblockAttack(pulseStart + (beatInterval / 2));
        } else if (figKey === 'mariposa') {
            const sub = beatInterval / 4;
            for (let s = 0; s < 4; s++) {
                playWoodblockAttack(pulseStart + (s * sub));
            }
        } else if (figKey === 'silencio') {
            // Silencio total: sin ataques
        }
    });

    if (onComplete) {
        const totalDuration = (pattern.length * beatInterval * 1000);
        setTimeout(onComplete, totalDuration + 100);
    }
}

function highlightCountBox(num, bpm) {
    const container = document.getElementById('count-visualizer');
    container.classList.remove('hidden');
    document.querySelectorAll('.count-box').forEach(box => box.classList.remove('active'));
    document.getElementById(`c-${num}`).classList.add('active');

    if (num === 4) {
        setTimeout(() => container.classList.add('hidden'), (60 / bpm) * 1000);
    }
}

function highlightPulseSlot(idx) {
    const zones = document.querySelectorAll('.slot-dropzone');
    if (zones[idx]) {
        zones[idx].classList.add('pulse-active');
        setTimeout(() => zones[idx].classList.remove('pulse-active'), 300);
    }
}

// Validación de Ejercicios
function checkAnswers() {
    stats.total++;
    let isCorrect = true;
    for (let i = 0; i < 4; i++) {
        if (userAnswers[i] !== currentPattern[i]) { isCorrect = false; break; }
    }

    const feedback = document.getElementById('feedback-message');
    feedback.classList.remove('hidden', 'success', 'error');

    if (isCorrect) {
        stats.correct++;
        feedback.textContent = '¡Excelente! Patrón rítmico correcto 🌟';
        feedback.classList.add('success');
        document.getElementById('btn-check').disabled = true;
        document.getElementById('btn-next-exercise').classList.remove('hidden');
    } else {
        feedback.textContent = '¡Casi! Escuchá de nuevo e intentá corregir los pulsos.';
        feedback.classList.add('error');
    }
}

function nextExercise() {
    currentExerciseIndex++;
    const stage = STAGES[currentStageIndex];
    if (currentExerciseIndex < stage.exercisesCount) {
        loadNewExercise();
    } else {
        advanceStage();
    }
}

// Pantalla de Resultados y Desafío de Velocidad
function showResults() {
    document.getElementById('audio-control-panel').classList.add('hidden');
    document.getElementById('exercise-section').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');

    const resultsSec = document.getElementById('results-section');
    resultsSec.classList.remove('hidden');

    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-correct').textContent = stats.correct;
}

function startSpeedChallenge(customBpm) {
    // Iniciar desafío de velocidad con patrón aleatorio avanzado
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('audio-control-panel').classList.remove('hidden');
    document.getElementById('exercise-section').classList.remove('hidden');
    document.getElementById('stage-title').textContent = `🚀 Desafío de Velocidad (${customBpm} BPM)`;

    // Sobrecargar momentáneamente el tempo para este desafío
    fixedBpm = customBpm;
    loadNewExercise();
}

function restartApp() {
    currentStageIndex = 0;
    fixedBpm = 75;
    stats = { total: 0, correct: 0 };
    loadStage();
}