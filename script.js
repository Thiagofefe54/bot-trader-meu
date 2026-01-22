const socket = io(); // Conecta no servidor local

let botLigado = false;

// Recebe atualização de saldo e lucro
socket.on('dados', (dados) => {
    document.getElementById('saldo-atual').innerText = `$ ${dados.saldo}`;
    document.getElementById('lucro-total').innerText = `+$ ${dados.lucro}`;
    atualizarBotao(dados.ligado);
});

// Recebe mensagens (logs)
socket.on('log', (log) => {
    adicionarLog(log.msg, log.tipo);
});

// Botão Ligar/Desligar
function alternarBot() {
    socket.emit('toggleBot', !botLigado);
}

function atualizarBotao(status) {
    botLigado = status;
    const btn = document.getElementById('btn-power');
    const statusTexto = document.getElementById('status-texto');

    if (botLigado) {
        btn.innerText = "PARAR SISTEMA 🛑";
        btn.classList.add('desligar');
        statusTexto.innerHTML = "ONLINE 🟢";
        statusTexto.className = "status-on";
    } else {
        btn.innerText = "LIGAR SISTEMA 🔌";
        btn.classList.remove('desligar');
        statusTexto.innerHTML = "DESLIGADO 🔴";
        statusTexto.className = "status-off";
    }
}

function adicionarLog(texto, tipo) {
    const box = document.getElementById('log-box');
    const hora = new Date().toLocaleTimeString();
    let cor = '#8b949e';

    if (tipo === 'compra') cor = '#e2b714';
    if (tipo === 'venda') cor = '#58a6ff';
    if (tipo === 'sucesso') cor = '#3fb950';
    if (tipo === 'erro') cor = '#da3633';

    const novaLinha = `<div class="log-item"><span style="color:#8b949e">[${hora}]</span> <span style="color:${cor}">${texto}</span></div>`;
    box.innerHTML += novaLinha;
    box.scrollTop = box.scrollHeight;
}