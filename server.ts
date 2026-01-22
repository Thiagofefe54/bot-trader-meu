import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import ccxt from 'ccxt';
import * as dotenv from 'dotenv';
import path from 'path';

// --- CONFIGURAÇÕES ---
dotenv.config();
const PORTA = 3000;
const PAR = 'SOL/USDT';    
const VALOR_COMPRA = 12.00; 

// --- VARIÁVEIS DO ROBÔ ---
let botLigado = false;
let comprei = false;
let precoPago = 0;
let carteira = { USDT: 0, BTC: 0 };
let lucroTotal = 0;

// --- SERVIDOR ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve os arquivos do site
app.use(express.static(path.join(__dirname, '.')));

// --- BINANCE ---
const exchange = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET,
    enableRateLimit: true
});

// --- QUANDO O SITE CONECTA ---
io.on('connection', (socket) => {
    console.log('💻 Site conectado!');
    enviarDados(); 

    socket.on('toggleBot', (ligar: boolean) => {
        botLigado = ligar;
        const msg = botLigado ? '🟢 SISTEMA INICIADO' : '🔴 SISTEMA PAUSADO';
        io.emit('log', { tipo: 'info', msg: msg });
        console.log(msg);
        if (botLigado) rodarRobo();
    });
});

// --- FUNÇÃO QUE RODA O ROBÔ ---
async function rodarRobo() {
    if (!botLigado) return;

    try {
        // 1. ATUALIZA SALDO E PREÇO
        const saldoRaw = await exchange.fetchBalance();
        const ticker = await exchange.fetchTicker(PAR);
        const precoAgora = ticker.last as number;

        // ATUALIZA A CARTEIRA
        carteira.USDT = saldoRaw.USDT ? saldoRaw.USDT.free : 0;
        carteira.BTC = saldoRaw.BTC ? saldoRaw.BTC.free : 0;
        
        // --- DETETIVE DE DINHEIRO (MOSTRA NO TERMINAL) ---
        // Se tiver BRL e não tiver USDT, avisa!
        if (carteira.USDT < 5 && saldoRaw['BRL'] && saldoRaw['BRL'].free > 10) {
            console.log(`⚠️ ALERTA: Você tem R$ ${saldoRaw['BRL'].free} REAIS, mas precisa converter para DÓLAR (USDT)!`);
            io.emit('log', { tipo: 'erro', msg: '⚠️ ERRO: Saldo está em REAIS. Converta para USDT na Binance!' });
        }

        enviarDados(); // Manda pro site

        // 2. LÓGICA DE COMPRA
        if (!comprei && carteira.USDT >= VALOR_COMPRA) {
            io.emit('log', { tipo: 'compra', msg: `🛒 Comprando $${VALOR_COMPRA} de BTC...` });
            
            // ORDEM REAL
            await exchange.createMarketBuyOrder(PAR, VALOR_COMPRA / precoAgora);
            
            comprei = true;
            precoPago = precoAgora;
            io.emit('log', { tipo: 'sucesso', msg: `✅ COMPRA FEITA! Preço: $${precoAgora}` });
        }
        
        // 3. LÓGICA DE VENDA (LUCRO 0.5%)
        else if (comprei && carteira.BTC > 0.0001) {
            const lucroPorcentagem = (precoAgora - precoPago) / precoPago;
            
            // Mostra status no log as vezes
            console.log(`Variando: ${(lucroPorcentagem * 100).toFixed(2)}%`);

            if (lucroPorcentagem >= 0.005) { 
                io.emit('log', { tipo: 'venda', msg: `🚀 VENDENDO COM LUCRO!` });
                
                // VENDA REAL
                await exchange.createMarketSellOrder(PAR, carteira.BTC);
                
                const lucroDolar = (carteira.BTC * precoAgora) - (carteira.BTC * precoPago);
                lucroTotal += lucroDolar;
                comprei = false;
                precoPago = 0;
                
                io.emit('log', { tipo: 'sucesso', msg: `💰 LUCRO NO BOLSO: $${lucroDolar.toFixed(2)}` });
                botLigado = false; 
                io.emit('statusBot', false);
            }
        }

    } catch (erro: any) {
        console.error("ERRO:", erro.message);
        io.emit('log', { tipo: 'erro', msg: `❌ ERRO NA BINANCE: ${erro.message}` });
        
        // Se for erro de IP, avisa
        if (erro.message.includes('IP')) {
            io.emit('log', { tipo: 'erro', msg: '🔒 ERRO DE IP: O IP do seu PC mudou ou não foi salvo.' });
        }
    }

    if (botLigado) setTimeout(rodarRobo, 5000);
}

function enviarDados() {
    io.emit('dados', {
        saldo: carteira.USDT.toFixed(2),
        lucro: lucroTotal.toFixed(2),
        ligado: botLigado
    });
}

// INICIA
server.listen(PORTA, () => {
    console.log(`\n🚀 SERVIDOR ONLINE: http://localhost:${PORTA}`);
    console.log("--------------------------------------------------");
});