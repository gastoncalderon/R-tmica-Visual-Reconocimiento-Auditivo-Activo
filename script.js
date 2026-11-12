/**
 * Aplicación Web Educativa: Reconocimiento Auditivo Rítmico (Primaria)
 * Arquitectura basada en Web Audio API, interacción táctil/mouse y progresión por etapas.
 */

// Definición de las fichas rítmicas con sus imágenes representativas y sílabas
const FIGURES = {
    pan: {
        id: 'pan',
        name: 'PAN',
        syllables: 1,
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10,50 Q10,30 50,25 Q90,30 90,50 Q90,75 50,80 Q10,75 10,50 Z" fill="%23d35400"/><path d="M20,45 Q50,35 80,45" stroke="%23b9770e" stroke-width="4" fill="none"/></svg>',
        desc: 'Una sílaba, un sonido (Negra).'
    },
    queso: {
        id: 'queso',
        name: 'QUESO',
        syllables: 2,
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,80 90,80 50,20" fill="%23f1c40f"/><circle cx="45" cy="55" r="6" fill="%23d4ac0d"/><circle cx="65" cy="65" r="5" fill="%23d4ac0d"/><circle cx="35" cy="70" r="4" fill="%23d4ac0d"/></svg>',
        desc: 'Dos sílabas, dos sonidos (Corcheas).'
    },
    silencio: {
        id: 'silencio',
        name: 'SILENCIO',
        syllables: 0,
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e2e8f0"/><text x="50" y="62" font-size="45" text-anchor="middle" fill="%232c3e50">🤫</text></svg>',
        desc: 'Un pulso completo sin sonido (Silencio de negra).'
    },
    mariposa: {
        id: 'mariposa',
        name: 'MARIPOSA',
        syllables: 4,
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,30 Q30,10 15,30 Q5,50 30,70 Q50,90 50,90 Q50,90 70,70 Q95,50 85,30 Q70,10 50,30 Z" fill="%23e67e22"/><line x1="50" y1="20" x2="50" y2="85" stroke="%232c3e50" stroke-width="4"/></svg>',
        desc: 'Cuatro sílabas, cuatro sonidos (Semicorcheas).'
    }
};

// Estructura de las Etapas del Proyecto
const STAGES = [
    {
        id: 1,
        type: 'tutorial',
        title: 'Etapa 1: Tutorial de PAN y QUESO',
        figures: ['pan', 'queso'],
        content: `
            <h3>¡Aprendemos los primeros sonidos!</h3>
            <p>Descubramos cómo suenan el <strong>PAN</strong> y el <strong>QUESO</strong> dentro del pulso musical.</p>
            <div class="tutorial-card-grid">
                <div class="tutorial-item">
                    <img src="${FIGURES.pan.image}" alt="Pan">
                    <strong>PAN</strong>
                    <span>1 sonido (Negra)</span>
                </div>
                <div class="tutorial-item">
                    <img src="${FIGURES.queso.image}" alt="Queso">
                    <strong>QUESO</strong>
                    <span>2 sonidos (Corcheas)</span>
                </div>
            </div>
            <p>El <strong>PAN</strong> ocupa un pulso completo con un golpe firme. El <strong>QUESO</strong> divide ese mismo pulso en dos partes iguales (ti-ti).</p>
        `
    },
    {
        id: 2,
        type: 'exercise',
        title: 'Etapa 2: Primer Reconocimiento Auditivo (PAN y QUESO)',
        figures: ['pan', 'queso'],
        exercisesCount: 5
    },
    {
        id: 3,
        type: 'tutorial',
        title: 'Etapa 3: Tutorial de SILENCIO',
        figures: ['pan', 'queso', 'silencio'],
        content: `
            <h3>Incorporamos el Silencio 🤫</h3>
            <p>El pulso musical sigue avanzando inexorablemente, pero en algunos momentos... <strong>¡no suena nada!</strong></p>
            <div class="tutorial-card-grid">
                <div class="tutorial-item">
                    <img src="${FIGURES.silencio.image}" alt="Silencio">
                    <strong>SILENCIO</strong>
                    <span>Duración de un pulso</span>
                </div>
            </div>
            <p>El silencio dura exactamente lo mismo que un <strong>PAN</strong>, pero sin ataque sonoro.</p>
        `
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
        title: 'Etapa 5: Tutorial de MARIPOSA',
        figures: ['pan', 'queso', 'silencio', 'mariposa'],
        content: `
            <h3>¡Llega la Mariposa! 🦋 (Semicorcheas)</h3>
            <p>La mariposa es más rápida: produce <strong>cuatro sonidos equidistantes</strong> dentro de un mismo pulso (ti-ri-ti-ri).</p>
            <div class="tutorial-card-grid">
                <div class="tutorial-item">
                    <img src="${FIGURES.mariposa.image}" alt="Mariposa">
                    <strong>MARIPOSA</strong>
                    <span>4 sonidos</span>
                </div>
            </div>
        `
    },
    {
        id: 6,
        type: 'exercise',
        title: 'Etapa 6: Reconocimiento Auditivo Final',
        figures: ['pan', 'queso', 'silencio', 'mariposa'],
        exercisesCount: 6
    }
];

// Estado global de la aplicación
let currentStageIndex = 0;
let currentExerciseIndex = 0;
let currentPattern = [];
let userAnswers = [null, null, null, null];
let audioCtx = null;
let bpm = 80;
let stats = { total: 0, correct: 0 };
let selectedTokenId = null; // Para modalidad táctil por toque

// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    initAudio();
    setupEventListeners();
    loadStage();
});

function initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        audioCtx = new AudioContext();
    }
}

function setupEventListeners() {
    document.getElementById('bpm-slider').addEventListener('input', (e) => {
        bpm = parseInt(e.target.value);
        document.getElementById('bpm-val').textContent = bpm;
    });

    document.getElementById('btn-play-count').addEventListener('click', playCountAndPattern);
    document.getElementById('btn-replay').addEventListener('click', playPatternOnly);
    document.getElementById('btn-check').addEventListener('click', checkAnswers);
    document.getElementById('btn-next-exercise').addEventListener('click', nextExercise);
    document.getElementById('btn-finish-tutorial').addEventListener('click', advanceStage);
    document.getElementById('btn-restart').addEventListener('click', restartApp);
}

// Gestión de Etapas
function loadStage() {
    const stage = STAGES[currentStageIndex];
    document.getElementById('stage-title').textContent = stage.title;
    updateProgressBar();

    // Ocultar todas las secciones principales
    document.getElementById('audio-control-panel').classList.add('hidden');
    document.getElementById('exercise-section').classList.add('hidden');
    document.getElementById('tutorial-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');

    if (stage.type === 'tutorial') {
        document.getElementById('tutorial-content').innerHTML = stage.content;
        document.getElementById('tutorial-section').classList.remove('hidden');
    } else {
        document.getElementById('audio-control-panel').classList.remove('hidden');
        document.getElementById('exercise-section').classList.remove('hidden');
        currentExerciseIndex = 0;
        loadNewExercise();
    }
}

function updateProgressBar() {
    const progress = ((currentStageIndex) / STAGES.length) * 100;
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

// Generación de Ejercicios
function loadNewExercise() {
    const stage = STAGES[currentStageIndex];
    userAnswers = [null, null, null, null];
    resetSlotsUI();
    document.getElementById('feedback-message').classList.add('hidden');
    document.getElementById('btn-next-exercise').classList.add('hidden');
    document.getElementById('btn-check').disabled = true;
    document.getElementById('btn-replay').disabled = true;

    // Generar patrón aleatorio de 4 pulsos con las figuras permitidas en la etapa
    currentPattern = [];
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * stage.figures.length);
        currentPattern.push(stage.figures[randomIndex]);
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
        token.dataset.id = fig.id;
        token.innerHTML = `
            <img src="${fig.image}" alt="${fig.name}">
            <span class="token-label">${fig.name}</span>
        `;

        // Eventos Drag and Drop (Mouse)
        token.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', fig.id);
        });

        // Eventos Táctiles / Alternativos por Toque
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

        // Drag and drop overs
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const figId = e.dataTransfer.getData('text/plain');
            placeTokenInSlot(slotIdx, figId);
        });

        // Alternativa táctil por toque
        zone.addEventListener('click', () => {
            if (selectedTokenId) {
                placeTokenInSlot(slotIdx, selectedTokenId);
                selectedTokenId = null;
                document.querySelectorAll('.rhythm-token').forEach(t => t.classList.remove('selected-touch'));
            } else if (userAnswers[slotIdx]) {
                // Permitir retirar figura al tocarla nuevamente
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
    zone.innerHTML = `
        <img src="${fig.image}" alt="${fig.name}">
    `;
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

// Síntesis de Audio (Web Audio API)
function playWoodblock(time, isAccent = false) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Frecuencia tipo bloque de madera / clave
    osc.frequency.setValueAtTime(isAccent ? 1200 : 900, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.04);

    gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
}

function playCountAndPattern() {
    if (!audioCtx) initAudio();
    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;

    // 1. Reproducir Cuenta Previa (4 pulsos)
    for (let i = 0; i < 4; i++) {
        const beatTime = now + (i * beatInterval);
        const isAccent = (i === 0);
        playWoodblock(beatTime, isAccent);

        // Animación visual de la cuenta
        setTimeout(() => {
            highlightCountBox(i + 1);
        }, (beatTime - now) * 1000);
    }

    // 2. Reproducir Patrón Rítmico a continuación
    const patternStartTime = now + (4 * beatInterval);
    playRhythmPattern(patternStartTime, beatInterval);

    // Habilitar botón de repetir al finalizar
    const totalDuration = (4 + 4) * beatInterval * 1000;
    setTimeout(() => {
        document.getElementById('btn-replay').disabled = false;
    }, totalDuration);
}

function playPatternOnly() {
    if (!audioCtx) initAudio();
    const now = audioCtx.currentTime + 0.05;
    const beatInterval = 60 / bpm;
    playRhythmPattern(now, beatInterval);
}

function playRhythmPattern(startTime, beatInterval) {
    currentPattern.forEach((figKey, pulseIdx) => {
        const pulseStart = startTime + (pulseIdx * beatInterval);
        
        if (figKey === 'pan') {
            playWoodblock(pulseStart, false);
        } else if (figKey === 'queso') {
            playWoodblock(pulseStart, false);
            playWoodblock(pulseStart + (beatInterval / 2), false);
        } else if (figKey === 'mariposa') {
            const sub = beatInterval / 4;
            for (let s = 0; s < 4; s++) {
                playWoodblock(pulseStart + (s * sub), false);
            }
        } else if (figKey === 'silencio') {
            // Ningún ataque sonoro durante este pulso
        }
    });
}

function highlightCountBox(num) {
    const container = document.getElementById('count-visualizer');
    container.classList.remove('hidden');
    document.querySelectorAll('.count-box').forEach(box => box.classList.remove('active'));
    document.getElementById(`c-${num}`).classList.add('active');

    if (num === 4) {
        setTimeout(() => {
            container.classList.add('hidden');
        }, (60 / bpm) * 1000);
    }
}

// Corrección y Validación
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
        feedback.textContent = '¡Excelente! El patrón es correcto 🌟';
        feedback.classList.add('success');
        document.getElementById('btn-check').disabled = true;
        document.getElementById('btn-next-exercise').classList.remove('hidden');
    } else {
        feedback.textContent = '¡Casi! Escuchá nuevamente el patrón e intentá corregir los pulsos.';
        feedback.classList.add('error');
    }
}

function nextExercise() {
    currentExerciseIndex++;
    const stage = STAGES[currentStageIndex];

    if (currentExerciseIndex < stage.exercisesCount) {
        loadNewExercise();
    } else {
        // Avanzar a la siguiente etapa
        advanceStage();
    }
}

// Pantalla de Resultados Finales
function showResults() {
    document.getElementById('audio-control-panel').classList.add('hidden');
    document.getElementById('exercise-section').classList.add('hidden');
    document.getElementById('tutorial-section').classList.add('hidden');

    const resultsSec = document.getElementById('results-section');
    resultsSec.classList.remove('hidden');

    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-correct').textContent = stats.correct;
    
    const percent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    document.getElementById('stat-percent').textContent = percent;

    const recBox = document.getElementById('recommendations-box');
    if (percent >= 80) {
        recBox.textContent = '🏆 ¡Excepcional desempeño! Demostraste gran precisión en el reconocimiento auditivo de todas las subdivisiones rítmicas.';
    } else {
        recBox.textContent = '💡 Buen trabajo. Te sugerimos repasar los ejercicios con silencios y mariposas prestando especial atención a la división temporal de cada pulso.';
    }
}

function restartApp() {
    currentStageIndex = 0;
    stats = { total: 0, correct: 0 };
    loadStage();
}