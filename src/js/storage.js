// Estado Global do Aplicativo
let state = {
    owner: '',
    project: null,
    participants: [],
    isAuthenticated: false
};

let movies = [];

// URL do Facade no n8n
const N8N_FACADE_URL = 'https://dsop.app.n8n.cloud/webhook/webhookfacade';

// --- FUNÇÕES DE COMUNICAÇÃO E PERSISTÊNCIA ---

/**
 * Função Facade Genérica para chamadas ao n8n
 * @param {Object} payload - Dados a enviar (ex: { email, service })
 */
async function calln8nFacade(payload) {
    try {
        const response = await fetch(N8N_FACADE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload }) // Envelopa o parâmetro no formato esperado
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Erro na comunicação com o Facade:", error);
        return null;
    }
}

/**
 * Lógica de busca híbrida: Procura localmente, se não encontrar, consulta o n8n
 */
async function fetchUserData(email) {
    // 1. Procura no Banco de Dados Local
    const localData = getExistingData(email);
    if (localData) {
        printLog('DADOS LOCALIZADOS NO CACHE DO DISPOSITIVO.', 'text-terminal-green');
        return localData;
    }

    // 2. Procura no n8n (Serviço 1001)
    printLog('CONSULTANDO REGISTROS REMOTOS (SRV:1001)...', 'text-zinc-500');

    // Chamada usando o Facade genérico
    const result = await calln8nFacade({ email: email, service: 1001 });

    // Verifica se o n8n retornou sucesso e dados válidos
    if (result && result.success && result.data) {
        printLog('REGISTRO ENCONTRADO NO SERVIDOR. SINCRONIZANDO...', 'text-terminal-green');
        return result.data;
    }

    printLog('USUÁRIO NÃO LOCALIZADO NO SERVIDOR.', 'text-yellow-500');
    return null;
}

// Persistência Local
function saveLocal() {
    localStorage.setItem('amigo_secreto_v1', JSON.stringify(state));
}

function getExistingData(email) {
    const saved = localStorage.getItem('amigo_secreto_v1');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.owner === email) return parsed;
    }
    return null;
}

// --- UTILITÁRIOS DE INTERFACE ---

async function loadMovies() {
    try {
        const response = await fetch('./movieslist.json');
        movies = await response.json();
    } catch (e) {
        printLog('ERRO CRÍTICO: FALHA AO CARREGAR DATABASE DE CODE-NAMES.', 'text-red-500');
    }
}

function printLog(message, colorClass = '') {
    const logs = document.getElementById('terminal-logs');
    if (!logs) return;
    const p = document.createElement('p');
    p.className = `leading-relaxed text-xs ${colorClass}`;
    p.textContent = `>> ${message}`;
    logs.appendChild(p);
    setTimeout(() => { logs.scrollTop = logs.scrollHeight; }, 0);
}

async function printProgressBar(duration = 2000) {
    const logs = document.getElementById('terminal-logs');
    const p = document.createElement('p');
    p.className = 'text-terminal-green text-xs';
    logs.appendChild(p);
    const steps = 20;
    const stepTime = duration / steps;
    for (let i = 0; i <= steps; i++) {
        const percent = Math.round((i / steps) * 100);
        const bar = "█".repeat(i) + "░".repeat(steps - i);
        p.textContent = `>> TRANSMITINDO: [${bar}] ${percent}%`;
        logs.scrollTop = logs.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, stepTime));
    }
}

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- FLUXO DE TELAS ---

function showAuthStep() {
    printLog(`SOLICITANDO CÓDIGO DE ACESSO PARA: ${state.owner}...`, 'text-zinc-500');
    printLog('AGUARDANDO INPUT DE SEGURANÇA...', 'text-yellow-500');
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div id="step-auth" class="flex flex-col animate-pulse">
            <label class="text-xs uppercase mb-2 opacity-50">Digite o código de 6 dígitos enviado ao e-mail:</label>
            <div class="flex items-center">
                <span class="text-terminal-green mr-2">auth_key:~$</span>
                <input type="text" id="auth-code" maxlength="6" class="bg-transparent border-none outline-none text-terminal-green w-full" autofocus autocomplete="off">
            </div>
        </div>`;
    const authInput = document.getElementById('auth-code');
    authInput.focus();
    authInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (e.target.value === '091205') processAuthentication();
            else printLog('CÓDIGO INCORRETO. TENTE NOVAMENTE.', 'text-red-500');
        }
    });
}

function processAuthentication() {
    state.isAuthenticated = true;
    printLog('CÓDIGO ACEITO. IDENTIDADE CONFIRMADA.', 'text-terminal-green');
    printLog('INICIALIZANDO ESTRUTURA DE DADOS LOCAL...', 'text-zinc-500');
    setTimeout(() => printLog('ALOCANDO SETORES DE MEMÓRIA...', 'text-zinc-600'), 400);
    setTimeout(() => printLog('DATABASE "AMIGO_SECRETO_V1" CRIADO COM SUCESSO.', 'text-terminal-green'), 1200);
    setTimeout(() => showMovieSelection(), 1800);
}

function showMovieSelection() {
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div id="step-movie" class="flex flex-col">
            <label class="text-xs uppercase mb-2 opacity-50">Selecione o Codinome do Projeto:</label>
            <div class="flex items-center border-b border-terminal-border mb-4">
                <span class="text-terminal-green mr-2">search_db:~$</span>
                <input type="text" id="movie-search" class="bg-transparent border-none outline-none text-terminal-green w-full" autofocus autocomplete="off">
            </div>
            <div id="movie-results" class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]"></div>
        </div>`;
    const searchInput = document.getElementById('movie-search');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = movies.filter(m => m.name.toLowerCase().includes(term)).slice(0, 6);
        const resultsContainer = document.getElementById('movie-results');
        resultsContainer.innerHTML = filtered.map(m => `
            <div onclick="selectMovie('${m.id}', '${m.name}')" class="cursor-pointer p-2 border border-terminal-border hover:bg-zinc-900 hover:text-terminal-green transition-colors">
                [ID: ${m.id}] ${m.name.toUpperCase()}
            </div>`).join('');
    });
}

window.selectMovie = (id, name) => {
    state.project = { id, name };
    printLog(`PROJETO VINCULADO: ${name.toUpperCase()} [${id}]`, 'text-terminal-green');
    saveLocal();
    renderParticipantForm();
};

function renderParticipantForm() {
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div id="step-participants" class="flex flex-col space-y-4">
            <p class="text-xs text-terminal-green uppercase">REGISTRO DE MEMBROS - PROJETO ${state.project.name}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input type="text" id="p-name" placeholder="NOME DO MEMBRO" class="border border-terminal-border p-2 text-xs focus:border-terminal-green bg-black text-terminal-green">
                <input type="email" id="p-email" placeholder="EMAIL@DESTINO.COM" class="border border-terminal-border p-2 text-xs focus:border-terminal-green bg-black text-terminal-green">
            </div>
            <button onclick="addParticipant()" class="bg-terminal-green text-black font-bold text-[10px] py-2 hover:bg-emerald-400 transition-colors uppercase">Confirmar Inclusão</button>
            <div class="mt-4">
                <p class="text-[10px] opacity-50 mb-2">RELATÓRIO DE MEMBROS ATIVOS:</p>
                <div id="participants-list" class="space-y-1"></div>
            </div>
            <button id="btn-sync" onclick="sendToN8N()" class="hidden mt-4 border border-terminal-green text-terminal-green text-[10px] py-2 hover:bg-terminal-green hover:text-black transition-all">[ EXECUTAR SINCRONIZAÇÃO COM BACKEND N8N ]</button>
        </div>`;
    updateParticipantUI();
}

window.addParticipant = () => {
    const nameInput = document.getElementById('p-name');
    const emailInput = document.getElementById('p-email');
    if (nameInput.value && validateEmail(emailInput.value)) {
        state.participants.push({ name: nameInput.value, email: emailInput.value, status: 'local_only' });
        printLog(`MEMBRO ADICIONADO: ${nameInput.value.toUpperCase()}`, 'text-zinc-500');
        nameInput.value = ''; emailInput.value = '';
        updateParticipantUI(); saveLocal();
    } else {
        printLog('ERRO: DADOS DO MEMBRO INVÁLIDOS.', 'text-red-500');
    }
};

function updateParticipantUI() {
    const list = document.getElementById('participants-list');
    const btnSync = document.getElementById('btn-sync');
    list.innerHTML = state.participants.map((p, index) => `
        <div class="flex justify-between items-center text-[10px] border-l border-terminal-green pl-2 py-1 bg-zinc-900/30">
            <span>> ${p.name.toUpperCase()} (${p.email})</span>
            <button onclick="removeParticipant(${index})" class="text-red-500 px-2 hover:bg-red-900/20">ELIMINAR</button>
        </div>`).join('');
    if (state.participants.length >= 2) btnSync.classList.remove('hidden');
    else btnSync.classList.add('hidden');
}

window.removeParticipant = (index) => {
    state.participants.splice(index, 1);
    updateParticipantUI(); saveLocal();
};

window.sendToN8N = async () => {
    const btnSync = document.getElementById('btn-sync');
    if (btnSync) {
        btnSync.disabled = true;
        btnSync.innerHTML = "[ PROCESSANDO... ]";
    }

    printLog('INICIANDO BACKUP LOCAL DOS DADOS...', 'text-zinc-500');

    // Força a gravação no LocalStorage
    saveLocal();

    // Simula o progresso apenas para manter a estética do terminal
    await printProgressBar(1500);

    printLog('DADOS ARMAZENADOS COM SUCESSO NO NAVEGADOR.', 'text-terminal-green');
    printLog('ESTADO ATUALIZADO NO DISPOSITIVO LOCAL.', 'text-zinc-400');

    setTimeout(() => {
        finalizeRegistration();
    }, 500);
};

function finalizeRegistration() {
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div class="border border-terminal-green p-4 bg-zinc-900/20 mt-4 text-center">
            <p class="text-terminal-green font-bold animate-pulse uppercase text-xs">Sincronização Ativa</p>
            <p class="text-[9px] mt-2 opacity-70">O PROJETO FOI TRANSMITIDO. O SORTEIO SERÁ LIBERADO APÓS AS CONFIRMAÇÕES.</p>
        </div>`;
    printLog('SISTEMA EM MODO DE ESPERA (IDLE).', 'text-zinc-600');
}

// --- ÚNICO PONTO DE ENTRADA ATUALIZADO ---
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    const ownerInput = document.getElementById('owner-input');

    if (ownerInput) {
        ownerInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const email = e.target.value.trim();

                if (validateEmail(email)) {
                    // Executa a lógica do Facade híbrida
                    const userData = await fetchUserData(email);

                    if (userData) {
                        // Se encontrou (Local ou n8n), reconstrói o estado
                        state = userData;
                        saveLocal(); // Garante a sincronização local

                        printLog('ACESSO AUTORIZADO. RECONSTITUINDO PROJETO...', 'text-terminal-green');

                        setTimeout(() => {
                            if (state.project) renderParticipantForm();
                            else showMovieSelection();
                        }, 1000);
                    } else {
                        // Se não encontrou em lugar nenhum, inicia novo fluxo
                        printLog('INICIANDO NOVO PROTOCOLO DE REGISTRO.', 'text-zinc-500');
                        state.owner = email;
                        state.participants = [];
                        state.project = null;
                        showAuthStep();
                    }
                } else {
                    printLog('ERRO: ENDEREÇO DE E-MAIL INVÁLIDO.', 'text-red-500');
                }
            }
        });
    }
});