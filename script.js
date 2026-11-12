/**
 * Rítmica Visual - Laboratorio de Ritmo (Versión optimizada con sincronización r.a.f.)
 */

const FIGURES = {
    pan: {
        id: 'pan',
        name: 'PAN',
        syllables: 1,
        soundLabel: '(1 sonido)',
        image: 'assets/pan.png',
        fallback: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10,50 Q10,30 50,25 Q90,30 90,50 Q90,75 50,80 Q10,75 10,50 Z" fill="%23d35400"/></svg>'
    },
    queso: {
        id: 'queso',
        name: 'QUESO',
        syllables: 2,
        soundLabel: '(2 sonidos)',
        image: 'assets/queso.png',
        fallback: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,80 90,80 50,20" fill="%23f1c40f"/></svg>'
    },
    silencio: {
        id: 'silencio',
        name: 'SILENCIO',
        syllables: 0,
        soundLabel: '(0 sonidos)',
        image: 'assets/silencio.png',
        fallback: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e2e8f0"/><text x="50" y="62" font-size="42" text-anchor="middle" fill="%232c3e50">🤫</text></svg>'
    },
    mariposa: {
        id: 'mariposa',
        name: 'MARIPOSA',
        syllables: 4,
        soundLabel: '(4 sonidos)',
        image: 'assets/mariposa.png',
        fallback: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="30" fill="%23e67e22"/></svg>'
    }
};

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

let currentStageIndex = 0;
let currentExerciseIndex = 0;
let currentPattern = [];
let userAnswers = [null, null, null, null];
let audioCtx = null;
let currentBpm = 75;
let stats = { total: 0, correct: 0 };
let selectedTokenId = null;
let animationFrameId = null; // Control del bucle visual de alta precisión

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
    document.getElementById('btn-play-count').addEventListener('click', () => playCountAndPattern(currentBpm));
    document.getElementById('btn-replay').addEventListener('click', () => playPatternOnly(currentBpm));
    document.getElementById('btn-check').addEventListener('click', checkAnswers);
    document.getElementById('btn-next-exercise').addEventListener('click', nextExercise);
    document.getElementById('btn-next-tutorial').addEventListener('click', advanceStage);
    document.getElementById('btn-restart').addEventListener('click', restartApp);

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            startSpeedChallenge(parseInt(e.target.dataset.bpm, 10));
        });
    });
}

function loadStage() {
    const stage = STAGES[currentStageIndex];
    document.getElementById('stage-title').textContent = stage.title;
    updateProgressBar();

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

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

// -------------------------------------------------------------
// TUTORIALES INTERACTIVOS
// -------------------------------------------------------------
function encodeSvg(svgString) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString.trim());
}

function createSafeImage(figKey, altText) {
    const fig = FIGURES[figKey];
    const img = document.createElement('img');
    img.alt = altText || fig.name;
    img.addEventListener('error', () => {
        if (img.src !== fig.fallback) img.src = fig.fallback;
    }, { once: true });
    img.src = fig.image;
    return img;
}

function createTutorialCard(figKey) {
    const fig = FIGURES[figKey];
    const card = document.createElement('div');
    card.className = 'tutorial-item';
    card.dataset.fig = figKey;

    const img = createSafeImage(figKey, fig.name);
    const title = document.createElement('strong');
    title.textContent = fig.name;

    const subtitle = document.createElement('span');
    subtitle.style.fontSize = '0.75rem';
    subtitle.style.color = '#666';
    subtitle.textContent = fig.soundLabel;

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(subtitle);

    card.addEventListener('click', () => {
        playSingleFigureAudio(figKey, currentBpm);
    });

    return card;
}

function loadInteractiveTutorial(stage) {
    const mainContent = document.getElementById('main-content');
    mainContent.classList.remove('hidden');
    document.getElementById('btn-next-tutorial').classList.add('hidden');
    document.getElementById('tutorial-feedback').classList.add('hidden');

    const tutorialContent = document.getElementById('tutorial-content');
    tutorialContent.innerHTML = '';

    const interactiveArea = document.getElementById('tutorial-interactive-area');
    interactiveArea.classList.add('hidden');
    const optionsContainer = document.getElementById('tutorial-options');
    optionsContainer.innerHTML = '';

    const heading = document.createElement('h3');
    const instruction = document.createElement('p');
    const strongInstr = document.createElement('strong');
    instruction.appendChild(strongInstr);

    const grid = document.createElement('div');
    grid.className = 'tutorial-card-grid';

    if (stage.interactiveType === 'pan-queso') {
        heading.textContent = 'Descubriendo el PAN y el QUESO';
        strongInstr.textContent = '¡Hacé clic o tocá cada figura para escuchar cómo suena!';
        ['pan', 'queso'].forEach(key => grid.appendChild(createTutorialCard(key)));

        tutorialContent.appendChild(heading);
        tutorialContent.appendChild(instruction);
        tutorialContent.appendChild(grid);

        setupTutorialChallenge(['pan', 'queso'], optionsContainer);

    } else if (stage.interactiveType === 'silencio') {
        heading.textContent = 'El Pulso con el SILENCIO 🤫';
        strongInstr.textContent = 'Tocá cada tarjeta para escuchar la diferencia:';
        ['pan', 'silencio'].forEach(key => grid.appendChild(createTutorialCard(key)));

        tutorialContent.appendChild(heading);
        tutorialContent.appendChild(instruction);
        tutorialContent.appendChild(grid);

        setupTutorialChallenge(['pan', 'silencio'], optionsContainer);

    } else if (stage.interactiveType === 'mariposa') {
        heading.textContent = 'La Mariposa 🦋 (Semicorcheas)';
        strongInstr.textContent = 'Tocá las tarjetas para comparar velocidades:';
        ['pan', 'queso', 'mariposa'].forEach(key => grid.appendChild(createTutorialCard(key)));

        tutorialContent.appendChild(heading);
        tutorialContent.appendChild(instruction);
        tutorialContent.appendChild(grid);

        setupTutorialChallenge(['queso', 'mariposa'], optionsContainer);
    }
}

function createRhythmTokenElement(figKey, draggable = false) {
    const fig = FIGURES[figKey];
    const token = document.createElement('div');
    token.className = 'rhythm-token';
    token.draggable = draggable;

    const img = createSafeImage(figKey, fig.name);
    const label = document.createElement('span');
    label.className = 'token-label';
    label.textContent = fig.name;

    token.appendChild(img);
    token.appendChild(label);
    return token;
}

function setupTutorialChallenge(allowedFigs, container) {
    const targetFig = allowedFigs[Math.floor(Math.random() * allowedFigs.length)];

    const challengeBox = document.createElement('div');
    challengeBox.style.marginTop = '15px';

    const promptText = document.createElement('p');
    promptText.style.fontWeight = 'bold';
    promptText.style.marginBottom = '8px';
    promptText.textContent = 'Desafío: ¿Cuál de estas figuras produce el sonido que escucharás?';
    challengeBox.appendChild(promptText);

    const listenBtn = document.createElement('button');
    listenBtn.className = 'btn primary';
    listenBtn.textContent = '🔊 Reproducir Sonido Misterioso';
    listenBtn.style.marginBottom = '10px';
    listenBtn.addEventListener('click', () => playSingleFigureAudio(targetFig, currentBpm));
    challengeBox.appendChild(listenBtn);

    const figsRow = document.createElement('div');
    figsRow.className = 'tokens-flex';

    allowedFigs.forEach(figKey => {
        const token = createRhythmTokenElement(figKey, false);
        token.style.cursor = 'pointer';

        token.addEventListener('click', () => {
            const feedbackBox = document.getElementById('tutorial-feedback');
            feedbackBox.classList.remove('hidden');
            if (figKey === targetFig) {
                feedbackBox.textContent = '¡Correcto! Reconociste el sonido perfectamente 🌟';
                feedbackBox.className = 'feedback-box correct';
                document.getElementById('btn-next-tutorial').classList.remove('hidden');
            } else {
                feedbackBox.textContent = 'Ese no era. Volvé a escuchar el sonido misterioso.';
                feedbackBox.className = 'feedback-box incorrect';
            }
        });
        figsRow.appendChild(token);
    });

    challengeBox.appendChild(figsRow);
    container.appendChild(challengeBox);
    document.getElementById('tutorial-interactive-area').classList.remove('hidden');
}

// -------------------------------------------------------------
// EJERCICIOS Y SÍNTESIS DE AUDIO CON SINCRONIZACIÓN R.A.F.
// -------------------------------------------------------------
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
        const token = createRhythmTokenElement(figKey, true);

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
        const slotIdx = parseInt(zone.dataset.slot, 10);

        zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
        zone.ondragleave = () => { zone.classList.remove('drag-over'); };
        zone.ondrop = (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const figId = e.dataTransfer.getData('text/plain');
            if (FIGURES[figId]) {
                placeTokenInSlot(slotIdx, figId);
            }
        };

        zone.onclick = () => {
            if (selectedTokenId) {
                placeTokenInSlot(slotIdx, selectedTokenId);
                selectedTokenId = null;
                document.querySelectorAll('.rhythm-token').forEach(t => t.classList.remove('selected-touch'));
            } else if (userAnswers[slotIdx]) {
                userAnswers[slotIdx] = null;
                zone.innerHTML = '';
                checkCompletionStatus();
            }
        };
    });
}

function placeTokenInSlot(slotIdx, figId) {
    userAnswers[slotIdx] = figId;
    const zone = document.querySelector(`.slot-dropzone[data-slot="${slotIdx}"]`);
    const fig = FIGURES[figId];
    zone.innerHTML = '';
    zone.appendChild(createSafeImage(figId, fig.name));
    checkCompletionStatus();
}

function resetSlotsUI() {
    document.querySelectorAll('.slot-dropzone').forEach(zone => {
        zone.innerHTML = '';
    });
}

function checkCompletionStatus() {
    const isComplete = userAnswers.every(ans => ans !== null);
    document.getElementById('btn-check').disabled = !isComplete;
}

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
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;
    playRhythmPatternForSequence([figKey], now, beatInterval, null);
}

function playCountAndPattern(bpm) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;

    for (let i = 0; i < 4; i++) {
        const beatTime = now + (i * beatInterval);
        playSinusoidalBeep(beatTime, i === 0);
        setTimeout(() => highlightCountBox(i + 1, bpm), (beatTime - now) * 1000);
    }

    const patternStartTime = now + (4 * beatInterval);
    playRhythmPatternForSequence(currentPattern, patternStartTime, beatInterval, () => {
        document.getElementById('btn-replay').disabled = false;
    });
}

function playPatternOnly(bpm) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;
    playRhythmPatternForSequence(currentPattern, now, beatInterval, null);
}

function playRhythmPatternForSequence(pattern, startTime, beatInterval, onComplete) {
    // 1. Programar todos los eventos de audio con precisión absoluta de hardware
    pattern.forEach((figKey, pulseIdx) => {
        const pulseStart = startTime + (pulseIdx * beatInterval);

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
            // Silencio total
        }
    });

    // 2. Sincronización visual de alta precisión usando requestAnimationFrame
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    let highlighted = new Array(pattern.length).fill(false);

    function updateVisuals() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        pattern.forEach((_, pulseIdx) => {
            const pulseStart = startTime + (pulseIdx * beatInterval);
            // Iluminación instantánea y exacta cuando el reloj de audio alcanza el pulso
            if (!highlighted[pulseIdx] && now >= pulseStart) {
                highlighted[pulseIdx] = true;
                highlightPulseSlot(pulseIdx);
            }
        });

        const totalDuration = pattern.length * beatInterval;
        if (now < startTime + totalDuration + 0.1) {
            animationFrameId = requestAnimationFrame(updateVisuals);
        }
    }

    animationFrameId = requestAnimationFrame(updateVisuals);

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

function checkAnswers() {
    stats.total++;
    let isCorrect = true;
    for (let i = 0; i < 4; i++) {
        if (userAnswers[i] !== currentPattern[i]) {
            isCorrect = false;
            break;
        }
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

function showResults() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    document.getElementById('audio-control-panel').classList.add('hidden');
    document.getElementById('exercise-section').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');

    const resultsSec = document.getElementById('results-section');
    resultsSec.classList.remove('hidden');

    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-correct').textContent = stats.correct;
}

function startSpeedChallenge(customBpm) {
    currentBpm = customBpm;
    document.getElementById('tempo-label').textContent = currentBpm;
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('audio-control-panel').classList.remove('hidden');
    document.getElementById('exercise-section').classList.remove('hidden');
    document.getElementById('stage-title').textContent = `🚀 Desafío de Velocidad (${currentBpm} BPM)`;

    currentStageIndex = STAGES.length - 1;
    loadNewExercise();
}

function restartApp() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    currentStageIndex = 0;
    currentBpm = 75;
    document.getElementById('tempo-label').textContent = currentBpm;
    stats = { total: 0, correct: 0 };
    loadStage();
}