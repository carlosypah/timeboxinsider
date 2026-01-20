// Variables globales
let addonSession = null;
let mainStageClient = null;
let participants = [];
let defaultTime = 3;

// Configuración del proyecto (REEMPLAZAR con tus valores)
const CLOUD_PROJECT_NUMBER = 'timeboxinsider';

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeMainStage();
    setupEventListeners();
});

/**
 * Inicializar el main stage
 */
async function initializeMainStage() {
    try {
        // Crear sesión del add-on
        addonSession = await window.meet.addon.createAddonSession({
            cloudProjectNumber: CLOUD_PROJECT_NUMBER
        });
        
        // Crear cliente del main stage
        mainStageClient = await addonSession.createMainStageClient();
        
        // Obtener estado inicial desde el side panel
        const startingState = mainStageClient.getActivityStartingState();
        
        if (startingState) {
            participants = startingState.participants || [];
            defaultTime = startingState.defaultTime || 3;
            
            // Actualizar UI con el estado inicial
            document.getElementById('defaultTimeDisplay').textContent = defaultTime;
            renderTimersGrid();
        } else {
            // Si no hay estado inicial, cargar datos mock
            loadMockData();
        }
        
        // Configurar listeners para Co-Doing API
        setupCollaborationListeners();
        
        console.log('✅ Main stage inicializado correctamente');
        
    } catch (error) {
        console.error('Error inicializando main stage:', error);
        loadMockData(); // Fallback a datos simulados
    }
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    document.getElementById('pauseAllTimers').addEventListener('click', pauseAllTimers);
    document.getElementById('resetAllTimers').addEventListener('click', resetAllTimers);
    document.getElementById('addParticipant').addEventListener('click', addManualParticipant);
}

/**
 * Configurar listeners para colaboración en tiempo real
 */
function setupCollaborationListeners() {
    // TODO: Implementar Co-Doing API listeners
    // mainStageClient.on('participantStateChanged', handleParticipantStateChange);
    // mainStageClient.on('timerUpdate', handleTimerUpdate);
}

/**
 * Cargar datos mock si no hay estado inicial
 */
function loadMockData() {
    participants = [
        {
            id: 'user1',
            name: 'Ana García',
            timeRemaining: defaultTime * 60,
            isRunning: false,
            isOvertime: false
        },
        {
            id: 'user2',
            name: 'Carlos López', 
            timeRemaining: defaultTime * 60,
            isRunning: false,
            isOvertime: false
        },
        {
            id: 'user3',
            name: 'María Rodríguez',
            timeRemaining: defaultTime * 60,
            isRunning: false,
            isOvertime: false
        }
    ];
    
    document.getElementById('defaultTimeDisplay').textContent = defaultTime;
    renderTimersGrid();
}

/**
 * Renderizar grid de timers
 */
function renderTimersGrid() {
    const grid = document.getElementById('timersGrid');
    
    if (participants.length === 0) {
        grid.innerHTML = `
            <div class="timer-card">
                <div class="timer-participant-name">No hay participantes</div>
                <div class="timer-status">Agrega participantes desde el panel lateral</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = participants.map(participant => `
        <div class="timer-card ${getCardClass(participant)}" id="timer-${participant.id}">
            <div class="timer-participant-name">
                👤 ${participant.name}
            </div>
            
            <div class="timer-display ${getTimerDisplayClass(participant)}">
                ${formatTime(participant.timeRemaining)}
            </div>
            
            <div class="timer-status">
                ${getTimerStatus(participant)}
            </div>
            
            <div class="timer-controls">
                <button class="btn-primary btn-small" onclick="startTimer('${participant.id}')" 
                        ${participant.isRunning ? 'disabled' : ''}>
                    ▶️ Iniciar
                </button>
                <button class="btn-warning btn-small" onclick="pauseTimer('${participant.id}')"
                        ${!participant.isRunning ? 'disabled' : ''}>
                    ⏸️ Pausar
                </button>
                <button class="btn-secondary btn-small" onclick="resetTimer('${participant.id}')">
                    🔄 Reiniciar
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Obtener clase CSS para la tarjeta del timer
 */
function getCardClass(participant) {
    if (participant.isOvertime) return 'overtime';
    if (participant.isRunning) return 'active';
    return '';
}

/**
 * Obtener clase CSS para el display del timer
 */
function getTimerDisplayClass(participant) {
    if (participant.isOvertime) return 'overtime';
    if (!participant.isRunning) return 'paused';
    return '';
}

/**
 * Obtener texto de estado del timer
 */
function getTimerStatus(participant) {
    if (participant.isOvertime) {
        return '⚠️ Tiempo excedido';
    } else if (participant.isRunning) {
        return '🟢 En progreso';
    } else {
        return '⏸️ Pausado';
    }
}

/**
 * Formatear tiempo en MM:SS
 */
function formatTime(seconds) {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return seconds < 0 ? `-${formatted}` : formatted;
}

/**
 * Iniciar timer de un participante
 */
function startTimer(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant && !participant.isRunning) {
        participant.isRunning = true;
        renderTimersGrid();
        broadcastStateChange(participant);
        
        // Reproducir sonido de inicio (opcional)
        playSound('start');
    }
}

/**
 * Pausar timer de un participante
 */
function pauseTimer(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant && participant.isRunning) {
        participant.isRunning = false;
        renderTimersGrid();
        broadcastStateChange(participant);
        
        // Reproducir sonido de pausa (opcional)
        playSound('pause');
    }
}

/**
 * Reiniciar timer de un participante
 */
function resetTimer(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
        participant.timeRemaining = defaultTime * 60;
        participant.isRunning = false;
        participant.isOvertime = false;
        renderTimersGrid();
        broadcastStateChange(participant);
        
        // Reproducir sonido de reset (opcional)
        playSound('reset');
    }
}

/**
 * Pausar todos los timers
 */
function pauseAllTimers() {
    participants.forEach(participant => {
        if (participant.isRunning) {
            participant.isRunning = false;
        }
    });
    renderTimersGrid();
    broadcastStateChange({ action: 'pauseAll' });
}

/**
 * Reiniciar todos los timers
 */
function resetAllTimers() {
    if (confirm('¿Estás seguro de que quieres reiniciar todos los timers?')) {
        participants.forEach(participant => {
            participant.timeRemaining = defaultTime * 60;
            participant.isRunning = false;
            participant.isOvertime = false;
        });
        renderTimersGrid();
        broadcastStateChange({ action: 'resetAll' });
    }
}

/**
 * Agregar participante manual
 */
function addManualParticipant() {
    const name = prompt('Nombre del participante:');
    if (name && name.trim()) {
        const newParticipant = {
            id: 'manual_' + Date.now(),
            name: name.trim(),
            timeRemaining: defaultTime * 60,
            isRunning: false,
            isOvertime: false
        };
        
        participants.push(newParticipant);
        renderTimersGrid();
        broadcastStateChange({ action: 'addParticipant', participant: newParticipant });
    }
}

/**
 * Broadcast de cambio de estado (para implementar con Co-Doing API)
 */
function broadcastStateChange(data) {
    // TODO: Implementar con Co-Doing API para sincronizar entre usuarios
    console.log('Broadcasting state change:', data);
    
    // Por ahora, solo actualizamos localmente
    // En la implementación real, esto se sincronizaría con todos los participantes
}

/**
 * Reproducir sonido
 */
function playSound(type) {
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    let frequency;
    switch (type) {
        case 'start':
            frequency = 800; // Do alto
            break;
        case 'pause':
            frequency = 400; // Do medio
            break;
        case 'reset':
            frequency = 600; // Sol
            break;
        case 'alarm':
            frequency = 1000; // Do muy alto
            break;
        default:
            frequency = 500;
    }
    
    // Crear oscilador
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

/**
 * Manejar cuando un timer llega a cero
 */
function handleTimerFinished(participant) {
    participant.isOvertime = true;
    
    // Reproducir alarma
    playSound('alarm');
    
    // Notificación visual
    const timerCard = document.getElementById(`timer-${participant.id}`);
    if (timerCard) {
        timerCard.style.animation = 'pulse 0.5s ease-in-out 3';
    }
    
    console.log(`🚨 ¡${participant.name} ha superado el tiempo límite!`);
}

// Contador principal - ejecuta cada segundo
setInterval(() => {
    let hasChanges = false;
    
    participants.forEach(participant => {
        if (participant.isRunning) {
            const previousTime = participant.timeRemaining;
            participant.timeRemaining--;
            
            // Verificar si el timer acaba de llegar a cero
            if (previousTime > 0 && participant.timeRemaining <= 0 && !participant.isOvertime) {
                handleTimerFinished(participant);
            }
            
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        renderTimersGrid();
    }
}, 1000);