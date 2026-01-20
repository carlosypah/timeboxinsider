// Variables globales
let addonSession = null;
let sidePanelClient = null;
let participants = [];
let defaultTime = 3; // minutos

// Configuración del proyecto (REEMPLAZAR con tus valores)
const MAIN_STAGE_URL = 'https://carlosypah.github.io/main-stage.html';

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeAddon();
    setupEventListeners();
    updateStatus('Inicializando add-on...');
});

/**
 * Inicializar el add-on de Meet
 */
async function initializeAddon() {
    try {
        // Crear sesión del add-on
        addonSession = await window.meet.addon.createAddonSession({});
        
        // Crear cliente del panel lateral
        sidePanelClient = await addonSession.createSidePanelClient();
        
        updateStatus('✅ Conectado con Meet');
        
        // Cargar participantes simulados por ahora
        loadMockParticipants();
        
    } catch (error) {
        console.error('Error inicializando add-on:', error);
        updateStatus('❌ Error conectando con Meet');
    }
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Botón para iniciar actividad en main stage
    document.getElementById('startActivity').addEventListener('click', startMainStageActivity);
    
    // Botón para actualizar participantes
    document.getElementById('refreshParticipants').addEventListener('click', refreshParticipants);
    
    // Input de tiempo por defecto
    document.getElementById('defaultTime').addEventListener('change', function(e) {
        defaultTime = parseInt(e.target.value);
        updateDefaultTimeForAll();
    });
}

/**
 * Iniciar actividad en el main stage
 */
async function startMainStageActivity() {
    try {
        updateStatus('🚀 Iniciando timer en pantalla principal...');
        
        // Preparar estado inicial para compartir
        const activityState = {
            participants: participants,
            defaultTime: defaultTime,
            timestamp: Date.now()
        };
        
        // Iniciar actividad
        await sidePanelClient.startActivity({
            mainStageUrl: MAIN_STAGE_URL,
            activityStartingState: activityState
        });
        
        updateStatus('✅ Timer iniciado en pantalla principal');
        
    } catch (error) {
        console.error('Error iniciando actividad:', error);
        updateStatus('❌ Error iniciando timer');
    }
}

/**
 * Cargar participantes mock (temporal)
 */
function loadMockParticipants() {
    // Datos simulados hasta que conectemos con la API real
    participants = [
        {
            id: 'user1',
            name: 'Ana García',
            timeRemaining: defaultTime * 60, // en segundos
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
    
    renderParticipants();
}

/**
 * Renderizar lista de participantes
 */
function renderParticipants() {
    const container = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        container.innerHTML = '<p>No hay participantes detectados</p>';
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="participant-item">
            <div class="participant-info">
                <span>👤</span>
                <span class="participant-name">${participant.name}</span>
            </div>
            <div class="participant-timer ${getTimerClass(participant)}">
                ${formatTime(participant.timeRemaining)}
            </div>
            <div class="timer-controls">
                <button class="btn-small btn-primary" onclick="startTimer('${participant.id}')">
                    ▶️
                </button>
                <button class="btn-small btn-warning" onclick="pauseTimer('${participant.id}')">
                    ⏸️
                </button>
                <button class="btn-small btn-secondary" onclick="resetTimer('${participant.id}')">
                    🔄
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Obtener clase CSS para el timer
 */
function getTimerClass(participant) {
    if (participant.isOvertime) return 'timer-overtime';
    if (participant.isRunning) return 'timer-running';
    return 'timer-paused';
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
    if (participant) {
        participant.isRunning = true;
        renderParticipants();
        
        // Aquí enviarías el estado al main stage usando el Co-Doing API
        broadcastTimerUpdate(participant);
    }
}

/**
 * Pausar timer de un participante
 */
function pauseTimer(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
        participant.isRunning = false;
        renderParticipants();
        broadcastTimerUpdate(participant);
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
        renderParticipants();
        broadcastTimerUpdate(participant);
    }
}

/**
 * Actualizar tiempo por defecto para todos
 */
function updateDefaultTimeForAll() {
    participants.forEach(participant => {
        if (!participant.isRunning && participant.timeRemaining === (defaultTime * 60)) {
            participant.timeRemaining = defaultTime * 60;
        }
    });
    renderParticipants();
}

/**
 * Refrescar participantes
 */
async function refreshParticipants() {
    updateStatus('🔄 Actualizando participantes...');
    
    // Aquí conectarías con la API real de Meet para obtener participantes
    // Por ahora, simulamos la actualización
    setTimeout(() => {
        loadMockParticipants();
        updateStatus('✅ Participantes actualizados');
    }, 1000);
}

/**
 * Broadcast de actualización de timer (para implementar con Co-Doing API)
 */
function broadcastTimerUpdate(participant) {
    // TODO: Implementar con Co-Doing API para sincronizar con main stage
    console.log('Broadcasting timer update:', participant);
}

/**
 * Actualizar mensaje de estado
 */
function updateStatus(message) {
    document.getElementById('statusMessage').textContent = message;
}

// Simular countdown de timers (temporal)
setInterval(() => {
    let hasChanges = false;
    
    participants.forEach(participant => {
        if (participant.isRunning) {
            participant.timeRemaining--;
            
            if (participant.timeRemaining <= 0 && !participant.isOvertime) {
                participant.isOvertime = true;
                // Aquí podrías reproducir una alarma
                console.log(`⚠️ ${participant.name} ha superado el tiempo límite`);
            }
            
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        renderParticipants();
    }
}, 1000);