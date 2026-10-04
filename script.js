const socket = io();

// ELEMENTOS DA TELA
const btnPower = document.getElementById('btnPower');
const btnSettings = document.getElementById('btnSettings');
const modalSettings = document.getElementById('modalSettings');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const gridMoedas = document.getElementById('gridMoedas');
const inputValor = document.getElementById('inputValor');
const resumoFinanceiro = document.getElementById('resumoFinanceiro');
const logsDiv = document.getElementById('logs');
const saldoEl = document.getElementById('saldo');
const lucroEl = document.getElementById('lucro');

let sistemaLigado = false;
let saldoAtual = 0; // Guardamos o saldo pra fazer a conta

// LISTA DE MOEDAS DISPONÍVEIS (Adicione mais aqui se quiser)
const LISTA_MOEDAS = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT',
    'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'TRX/USDT',
    'LINK/USDT', 'MATIC/USDT', 'LTC/USDT', 'SHIB/USDT', 'UNI/USDT'
];

// --- 1. GERA OS CHECKBOXES ---
function gerarOpcoesMoedas() {
    gridMoedas.innerHTML = '';
    LISTA_MOEDAS.forEach(par => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" value="${par}" class="moeda-check" onchange="calcularPrevisao()">
            <span>${par.split('/')[0]}</span>
        `;
        gridMoedas.appendChild(div);
    });
}
gerarOpcoesMoedas();

// --- 2. CONTROLE DO MODAL ---
btnSettings.onclick = () => modalSettings.classList.remove('hidden');
btnCancelar.onclick = () => modalSettings.classList.add('hidden');

// --- 3. CÁLCULO FINANCEIRO (O "Aviso" que você pediu) ---
inputValor.addEventListener('input', calcularPrevisao);

function calcularPrevisao() {
    const checks = document.querySelectorAll('.moeda-check:checked');
    const valorPorMoeda = parseFloat(inputValor.value) || 0;
    const totalNecessario = checks.length * valorPorMoeda;

    resumoFinanceiro.innerText = `Selecionadas: ${checks.length} | Necessário: $${totalNecessario.toFixed(2)}`;

    if (totalNecessario > saldoAtual) {
        resumoFinanceiro.innerText += " (SALDO INSUFICIENTE ⚠️)";
        resumoFinanceiro.classList.add('erro');
        btnSalvar.disabled = true;
        btnSalvar.style.opacity = '0.5';
    } else {
        resumoFinanceiro.classList.remove('erro');
        btnSalvar.disabled = false;
        btnSalvar.style.opacity = '1';
    }
}

// --- 4. SALVAR CONFIGURAÇÃO ---
btnSalvar.onclick = () => {
    const checks = document.querySelectorAll('.moeda-check:checked');
    const selecionadas = Array.from(checks).map(c => c.value);
    const valor = parseFloat(inputValor.value);

    if (selecionadas.length === 0) {
        alert("Selecione pelo menos uma moeda!");
        return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
        alert('Informe um valor de compra maior que zero.');
        return;
    }

    // Manda pro Servidor
    socket.emit('salvarConfig', { pares: selecionadas, valorCompra: valor });
    modalSettings.classList.add('hidden');
};

// --- 5. SOCKET E ATUALIZAÇÕES ---
btnPower.onclick = () => {
    sistemaLigado = !sistemaLigado;
    socket.emit('toggleBot', sistemaLigado);
    atualizarVisual(sistemaLigado);
};

function atualizarVisual(ligado) {
    if (ligado) {
        btnPower.innerHTML = '<span class="icon">🛑</span> PARAR';
        btnPower.classList.add('active');
        document.getElementById('statusBadge').innerText = "OPERANDO 🟢";
        document.getElementById('statusBadge').className = "status-badge online";
    } else {
        btnPower.innerHTML = '<span class="icon">⚡</span> INICIAR';
        btnPower.classList.remove('active');
        document.getElementById('statusBadge').innerText = "PAUSADO 🔴";
        document.getElementById('statusBadge').className = "status-badge offline";
    }
}

socket.on('dados', (data) => {
    saldoAtual = parseFloat(data.saldo); // Atualiza saldo pra conta do modal
    saldoEl.innerText = `$ ${data.saldo}`;
    lucroEl.innerText = `+$ ${data.lucro}`;
    document.getElementById('moedaAtualBadge').innerText = `🔎 ${data.moedaAtual || '...'}`;
    
    // Atualiza estado do botão se vier do server
    if (sistemaLigado !== data.ligado) {
        sistemaLigado = data.ligado;
        atualizarVisual(sistemaLigado);
    }
});

socket.on('log', (data) => {
    const div = document.createElement('div');
    div.className = `log-line ${data.tipo}`;
    div.innerText = `[${new Date().toLocaleTimeString()}] ${data.msg}`;
    logsDiv.appendChild(div);
    logsDiv.scrollTop = logsDiv.scrollHeight;
});

socket.on('statusBot', (data) => {
    sistemaLigado = Boolean(data.ligado);
    atualizarVisual(sistemaLigado);
});
