// Estado Global do Aplicativo
let state = {
    owner: '',
    project: null,
    participants: [],
    isAuthenticated: false
};

let movies = [];

// --- FUNÇÕES DE SEGURANÇA E CRIPTOGRAFIA ---

const generateDrawId = () => `DRAW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function encryptData(data) {
    const salt = Math.random().toString(36).substring(2, 7);
    const stringToEncode = `${salt}|${JSON.stringify(data)}`;
    return btoa(stringToEncode);
}

function decryptData(code) {
    try {
        const decoded = atob(code);
        const [salt, jsonStr] = decoded.split('|');
        return JSON.parse(jsonStr);
    } catch (e) {
        return null;
    }
}

// Algoritmo Secret Santa: Bijetividade e Não-Reflexividade
function performSecretSanta(participants) {
    let names = participants.map(p => p.name);
    let shuffled = [...names];
    let valid = false;

    while (!valid) {
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        valid = names.every((name, i) => name !== shuffled[i]);
    }

    const timestamp = new Date().toLocaleString('pt-BR');
    const drawId = generateDrawId();

    return names.map((userName, i) => ({
        name: userName,
        secretCode: encryptData({
            drawId: drawId,
            date: timestamp,
            owner: state.owner,
            friend: shuffled[i],
            version: 'OFFLINE_FREE_LOCAL'
        })
    }));
}

// --- PERSISTÊNCIA E LOGS ---

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

async function loadMovies() {
    try {
        const response = await fetch('./movieslist.json');
        movies = await response.json();
    } catch (e) {
        printLog('ERRO AO CARREGAR DATABASE.', 'text-red-500');
    }
}

function printLog(message, colorClass = '') {
    const logs = document.getElementById('terminal-logs');
    if (!logs) return;
    const p = document.createElement('p');
    p.className = `leading-relaxed text-xs ${colorClass}`;
    p.textContent = `>> ${message}`;
    logs.appendChild(p);
    logs.scrollTop = logs.scrollHeight;
}

async function printProgressBar(duration = 1500) {
    const logs = document.getElementById('terminal-logs');
    const p = document.createElement('p');
    p.className = 'text-terminal-green text-xs';
    logs.appendChild(p);
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const percent = Math.round((i / steps) * 100);
        p.textContent = `>> COMPILANDO: [${"█".repeat(i)}${"░".repeat(steps - i)}] ${percent}%`;
        logs.scrollTop = logs.scrollHeight;
        await new Promise(r => setTimeout(r, duration / steps));
    }
}

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- INTERFACE ---

function showAuthStep() {
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div class="flex flex-col">
            <label class="text-xs uppercase mb-2 opacity-50">Senha (091205):</label>
            <input type="text" id="auth-code" class="bg-transparent border-b border-terminal-border outline-none text-terminal-green w-full p-1 text-xs" autofocus autocomplete="off">
        </div>`;
    document.getElementById('auth-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value === '091205') {
            state.isAuthenticated = true;
            showMovieSelection();
        }
    });
}

function showMovieSelection() {
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div class="flex flex-col">
            <label class="text-xs uppercase mb-2 opacity-50">Codinome do Projeto:</label>
            <input type="text" id="movie-search" class="bg-transparent border-b border-terminal-border outline-none text-terminal-green w-full mb-4 text-xs p-1" placeholder="Filtrar...">
            <div id="movie-results" class="grid grid-cols-2 gap-2 text-[10px]"></div>
        </div>`;

    const searchInput = document.getElementById('movie-search');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = movies.filter(m => m.name.toLowerCase().includes(term)).slice(0, 4);
        document.getElementById('movie-results').innerHTML = filtered.map(m => `
            <div onclick="selectMovie('${m.id}', '${m.name}')" class="cursor-pointer p-2 border border-terminal-border hover:bg-zinc-900 uppercase">
                [${m.id}] ${m.name}
            </div>`).join('');
    });
    searchInput.dispatchEvent(new Event('input'));
}

window.selectMovie = (id, name) => {
    state.project = { id, name };
    saveLocal();
    renderParticipantForm();
};

function renderParticipantForm() {
    const inputZone = document.getElementById('input-zone');
    inputZone.innerHTML = `
        <div class="flex flex-col space-y-4">
            <p class="text-xs text-terminal-green uppercase font-bold">PROJETO: ${state.project.name}</p>
            <textarea id="bulk-names" rows="4" class="bg-black border border-terminal-border p-2 text-xs text-terminal-green outline-none font-mono" placeholder="Nomes (um por linha)..."></textarea>
            <button onclick="addBulkParticipants()" class="bg-terminal-green text-black font-bold text-[10px] py-2 uppercase hover:bg-emerald-400 transition-colors">Salvar Membros</button>
            <div id="participants-list" class="space-y-1 max-h-32 overflow-y-auto"></div>
            <button id="btn-sync" onclick="finalizeOfflineProject()" class="hidden border border-terminal-green text-terminal-green text-[10px] py-2 uppercase font-bold hover:bg-terminal-green hover:text-black transition-all">[ FINALIZAR E GERAR LINKS ]</button>
        </div>`;
    updateParticipantUI();
}

window.addBulkParticipants = () => {
    const textarea = document.getElementById('bulk-names');
    const names = textarea.value.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    names.forEach(name => {
        if (!state.participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            state.participants.push({ name, email: 'offline@storage.local' });
        }
    });
    textarea.value = '';
    updateParticipantUI();
    saveLocal();
};

function updateParticipantUI() {
    const list = document.getElementById('participants-list');
    list.innerHTML = state.participants.map((p, i) => `
        <div class="flex justify-between text-[10px] bg-zinc-900/50 p-1 border-l border-terminal-green">
            <span>> ${p.name.toUpperCase()}</span>
            <button onclick="removeParticipant(${i})" class="text-red-500">EXCLUIR</button>
        </div>`).join('');
    document.getElementById('btn-sync').classList.toggle('hidden', state.participants.length < 2);
}

window.removeParticipant = (i) => {
    state.participants.splice(i, 1);
    updateParticipantUI();
    saveLocal();
};

window.finalizeOfflineProject = async () => {
    printLog('EXECUTANDO ALGORITMO DE SORTEIO...', 'text-zinc-500');
    await printProgressBar(1500);

    const drawResults = performSecretSanta(state.participants);
    const inputZone = document.getElementById('input-zone');

    inputZone.innerHTML = `
        <div class="space-y-4 overflow-x-auto">
            <p class="text-[10px] text-terminal-green font-bold uppercase">Links de Distribuição Gerados:</p>
            <div class="border border-terminal-border min-w-[500px]">
                <table class="w-full text-[9px] text-left">
                    <tr class="bg-zinc-900 text-zinc-500 uppercase">
                        <th class="p-2 border-r border-terminal-border">Nome</th>
                        <th class="p-2 border-r border-terminal-border text-center">Zap</th>
                        <th class="p-2 border-r border-terminal-border text-center">Tele</th>
                        <th class="p-2 text-center">Local</th>
                    </tr>
                    ${drawResults.map(res => {
                        const baseUrl = `${window.location.origin}${window.location.pathname}?show=${res.secretCode}&hello=${encodeURIComponent(res.name)}`;
                        const message = encodeURIComponent(`Olá ${res.name.toUpperCase()}! Aqui está seu link secreto para o Amigo Secreto (${state.project.name}): ${baseUrl}`);

                        const zapUrl = `https://api.whatsapp.com/send?text=${message}`;
                        const teleUrl = `https://t.me/share/url?url=${baseUrl}&text=${encodeURIComponent(`Olá ${res.name.toUpperCase()}! Link do Amigo Secreto:`)}`;

                        return `
                        <tr class="border-t border-terminal-border hover:bg-zinc-900/40">
                            <td class="p-2 font-bold text-terminal-green">${res.name.toUpperCase()}</td>
                            <td class="p-2 text-center border-x border-terminal-border">
                                <a href="${zapUrl}" target="_blank" class="text-[#25D366] font-bold hover:underline">[WHATSAPP]</a>
                            </td>
                            <td class="p-2 text-center border-r border-terminal-border">
                                <a href="${teleUrl}" target="_blank" class="text-[#0088cc] font-bold hover:underline">[TELEGRAM]</a>
                            </td>
                            <td class="p-2 text-center">
                                <a href="${baseUrl}" class="text-white/40 hover:text-white underline">ABRIR</a>
                            </td>
                        </tr>`;
                    }).join('')}
                </table>
            </div>
            <div class="p-2 bg-zinc-950 border border-terminal-border text-[8px] text-zinc-500 italic">
                Aviso: Os links acima contêm os dados criptografados. Envie cada link apenas para a pessoa correspondente.
            </div>
            <button onclick="location.reload()" class="text-[10px] underline opacity-50 hover:opacity-100 uppercase">Novo Projeto</button>
        </div>`;

    printLog('SORTEIO FINALIZADO E DISPONÍVEL PARA ENVIO.', 'text-terminal-green');
};

// --- ROTEAMENTO E INÍCIO ---

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('show');
    const helloName = urlParams.get('hello');

    if (code) {
        const data = decryptData(code);
        if (data) {
            document.querySelector('.max-w-3xl').innerHTML = `
                <div class="p-6 md:p-10 text-center space-y-8">
                    <div class="space-y-1">
                        <p class="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Protocolo de Revelação</p>
                        <h2 class="text-terminal-green text-2xl font-bold tracking-tighter uppercase">OLÁ, ${helloName || 'PARTICIPANTE'}</h2>
                    </div>

                    <div class="space-y-4">
                        <p class="text-zinc-500 text-[10px] uppercase tracking-widest">O seu Amigo Secreto é:</p>
                        <div class="bg-zinc-900 py-10 border-y border-terminal-green/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                            <span class="text-white font-black text-4xl sm:text-5xl tracking-tighter uppercase">${data.friend}</span>
                        </div>
                    </div>

                    <div class="border border-red-900/30 bg-red-950/10 p-4 text-[11px] text-zinc-500 space-y-2 leading-relaxed italic text-left">
                        <p class="text-red-500/50 not-italic font-bold uppercase tracking-widest text-[9px] mb-1">Aviso de Integridade</p>
                        <p>
                            Este sorteio foi processado via <span class="text-zinc-300">VERSÃO GRATUITA</span>.
                            O sistema é um processador local e não armazena dados em nuvem. A gestão e a exatidão da lista de nomes são de inteira
                            responsabilidade do <span class="text-zinc-300">${data.owner}</span>.
                        </p>
                    </div>

                    <div class="text-[9px] text-left border border-terminal-border p-4 space-y-1 opacity-30 font-mono bg-black/50">
                        <p>ID: ${data.drawId}</p>
                        <p>DATA: ${data.date}</p>
                        <p>ORGANIZADOR: ${data.owner}</p>
                        <p>STATUS: DADOS_LOCAIS_GERIDOS_PELO_USUARIO</p>
                    </div>

                    <button onclick="window.location.href=window.location.pathname" class="w-full sm:w-auto text-[10px] border border-terminal-green px-10 py-4 text-terminal-green hover:bg-terminal-green hover:text-black transition-all font-bold uppercase tracking-widest">Sair do Terminal</button>
                </div>`;
            return;
        }
    }
    loadMovies();
    const ownerInput = document.getElementById('owner-input');
    if (ownerInput) {
        ownerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = e.target.value.trim();
                if (validateEmail(email)) {
                    const existing = getExistingData(email);
                    if (existing) {
                        state = existing;
                        printLog(`SESSÃO RECUPERADA: ${email}`, 'text-terminal-green');
                        setTimeout(() => state.project ? renderParticipantForm() : showMovieSelection(), 1000);
                    } else {
                        state.owner = email;
                        showAuthStep();
                    }
                }
            }
        });
    }
});