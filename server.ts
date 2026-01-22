import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import ccxt from 'ccxt';
import * as dotenv from 'dotenv';
import path from 'path';

// --- CONFIGURAÇÕES ---
dotenv.config();
const PORTA = 3000;

// 👇 AQUI VOCÊ ESCOLHE A MOEDA (Pode ser BTC, SOL, DOGE, ETH...)
const PAR = 'SOL/USDT';     
const VALOR_COMPRA = 12.00; // Valor em Dólar por compra

// Separa os nomes automaticamente (Ex: Pega "SOL" e "USDT")
const [MOEDA_BASE, MOEDA_COTACAO] = PAR.split('/'); 

// --- VARIÁVEIS DO ROBÔ ---
let botLigado = false;
let comprei = false;
let precoPago = 0;
let carteira = { dolar: 0, moeda: 0 }; // Agora é genérico
let lucroTotal = 0;

// --- SERVIDOR ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '.')));

// --- BINANCE ---
const exchange = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET,
    enableRateLimit: true
});

// --- QUANDO O SITE CONECTA ---
io.on('connection', async (socket) => {
    console.log('💻 Site conectado! Atualizando dados...');
    
    // Já busca o saldo na hora que abre o site pra não ficar zerado
    await atualizarSaldo();
    enviarDados(); 

    socket.on('toggleBot', (ligar: boolean) => {
        botLigado = ligar;
        const msg = botLigado ? '🟢 SISTEMA INICIADO' : '🔴 SISTEMA PAUSADO';
        io.emit('log', { tipo: 'info', msg: msg });
        console.log(msg);
        if (botLigado) rodarRobo();
    });
});

// --- FUNÇÃO AUXILIAR PRA LER SALDO ---
async function atualizarSaldo() {
    try {
        const saldoRaw = await exchange.fetchBalance();
        // Pega o saldo da moeda que escolhemos lá em cima
        carteira.dolar = saldoRaw[MOEDA_COTACAO] ? saldoRaw[MOEDA_COTACAO].free : 0;
        carteira.moeda = saldoRaw[MOEDA_BASE] ? saldoRaw[MOEDA_BASE].free : 0;
    } catch (error) {
        console.log("Erro ao ler saldo (pode ser conexão)...");
    }
}

// --- LOOP DO ROBÔ ---
async function rodarRobo() {
    if (!botLigado) return;

    try {
        // 1. ATUALIZA DADOS
        await atualizarSaldo();
        const ticker = await exchange.fetchTicker(PAR);
        const precoAgora = ticker.last as number;

        enviarDados(); // Atualiza a tela do site

        // --- DETETIVE DE DINHEIRO ---
        // Se tiver pouco Dólar e tiver moeda comprada, ok. Se tiver tudo zerado, avisa.
        if (carteira.dolar < 5 && carteira.moeda == 0) {
            console.log(`⚠️ SALDO BAIXO EM DÓLAR!`);
        }

        // 2. LÓGICA DE COMPRA
        // Verifica se tem Dólar suficiente E se ainda não comprou
        if (!comprei && carteira.dolar >= VALOR_COMPRA) {
            io.emit('log', { tipo: 'compra', msg: `🛒 Comprando $${VALOR_COMPRA} de ${MOEDA_BASE}...` });
            
            // Compra a Mercado
            await exchange.createMarketBuyOrder(PAR, VALOR_COMPRA / precoAgora);
            
            comprei = true;
            precoPago = precoAgora;
            io.emit('log', { tipo: 'sucesso', msg: `✅ COMPRA DE ${MOEDA_BASE} FEITA! Preço: $${precoAgora}` });
        }
        
        // 3. LÓGICA DE VENDA (LUCRO 0.5%)
        // Verifica se já comprou E se tem moeda na carteira
        else if (comprei && carteira.moeda > 0) {
            const lucroPorcentagem = (precoAgora - precoPago) / precoPago;
            
            console.log(`Variando ${MOEDA_BASE}: ${(lucroPorcentagem * 100).toFixed(2)}%`);

            // SE BATER 0.5% DE LUCRO
            if (lucroPorcentagem >= 0.005) { 
                io.emit('log', { tipo: 'venda', msg: `🚀 VENDENDO ${MOEDA_BASE} COM LUCRO!` });
                
                // Vende TUDO o que tem da moeda
                await exchange.createMarketSellOrder(PAR, carteira.moeda);
                
                const lucroDolar = (carteira.moeda * precoAgora) - (carteira.moeda * precoPago);
                lucroTotal += lucroDolar;
                
                // Reseta para comprar de novo
                comprei = false;
                precoPago = 0;
                
                io.emit('log', { tipo: 'sucesso', msg: `💰 LUCRO NO BOLSO: $${lucroDolar.toFixed(2)}` });
                
                // Opcional: Desliga o bot após o lucro (se quiser que ele continue, apague as 2 linhas abaixo)
                botLigado = false; 
                io.emit('statusBot', false);
            }
        }

    } catch (erro: any) {
        console.error("ERRO:", erro.message);
        io.emit('log', { tipo: 'erro', msg: `❌ ERRO: ${erro.message}` });
    }

    // Roda de novo em 3 segundos (mais rápido pra Solana)
    if (botLigado) setTimeout(rodarRobo, 3000);
}

function enviarDados() {
    io.emit('dados', {
        saldo: carteira.dolar.toFixed(2),
        lucro: lucroTotal.toFixed(2),
        ligado: botLigado
    });
}

// INICIA
server.listen(PORTA, () => {
    console.log(`\n🚀 SERVIDOR ONLINE (${PAR}): http://localhost:${PORTA}`);
    console.log("--------------------------------------------------");
});