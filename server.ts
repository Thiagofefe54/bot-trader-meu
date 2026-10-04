import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import ccxt from 'ccxt';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const PORTA = process.env.PORT || 3000;

// --- CONFIGURAÇÃO INICIAL (Padrão) ---
let configClient = {
    pares: ['BTC/USDT'], // Começa só com Bitcoin pra não travar
    valorCompra: 12.00   // Valor padrão
};

let botLigado = false;
let cicloAtivo = false;
let indiceAtual = 0;
let lucroTotal = 0;
let memoriaMoedas: any = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '.')));

const exchange = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET,
    enableRateLimit: true
});

io.on('connection', async (socket) => {
    console.log('💻 Cliente Conectado!');
    enviarDados();

    // RECEBE A NOVA CONFIGURAÇÃO DO SITE
    socket.on('salvarConfig', (novaConfig) => {
        if (botLigado || cicloAtivo || Object.values(memoriaMoedas).some((m: any) => m.comprei)) {
            socket.emit('log', { tipo: 'erro', msg: 'Pause o bot e resolva posições abertas antes de alterar a configuração.' });
            return;
        }
        if (!novaConfig || !Array.isArray(novaConfig.pares) || novaConfig.pares.length === 0 ||
            !novaConfig.pares.every((p: unknown) => typeof p === 'string' && /^[A-Z0-9]+\/[A-Z0-9]+$/.test(p)) ||
            typeof novaConfig.valorCompra !== 'number' || !Number.isFinite(novaConfig.valorCompra) || novaConfig.valorCompra <= 0) {
            socket.emit('log', { tipo: 'erro', msg: 'Configuração inválida.' });
            return;
        }
        configClient = { pares: [...new Set(novaConfig.pares)] as string[], valorCompra: novaConfig.valorCompra };
        
        // Reinicia a memória das moedas novas
        memoriaMoedas = {};
        configClient.pares.forEach(par => {
            memoriaMoedas[par] = { comprei: false, precoPago: 0 };
        });
        
        io.emit('log', { tipo: 'info', msg: `⚙️ Configuração Atualizada! Moedas: ${configClient.pares.length} | Valor: $${configClient.valorCompra}` });
        enviarDados(); // Atualiza o front com os novos dados
    });

    socket.on('toggleBot', (ligar: boolean) => {
        if (typeof ligar !== 'boolean') return;
        if (ligar === botLigado) return;
        botLigado = ligar;
        const msg = botLigado ? '🚀 SISTEMA INICIADO' : '⏸️ SISTEMA PAUSADO';
        io.emit('log', { tipo: 'info', msg: msg });
        if (botLigado) rodarRobo();
    });
});

async function rodarRobo() {
    if (!botLigado || cicloAtivo) return;
    
    // Se o cliente desmarcou tudo, não roda
    if (configClient.pares.length === 0) {
        io.emit('log', { tipo: 'erro', msg: '⚠️ Nenhuma moeda selecionada!' });
        botLigado = false;
        enviarDados();
        return;
    }

    cicloAtivo = true;
    try {
        // Garante que o índice não estoure o tamanho da lista nova
        if (indiceAtual >= configClient.pares.length) indiceAtual = 0;

        const parAtual = configClient.pares[indiceAtual];
        const [MOEDA_BASE, MOEDA_COTACAO] = parAtual.split('/');

        // 1. DADOS DE MERCADO
        const ticker = await exchange.fetchTicker(parAtual);
        const precoAgora = ticker.last as number;
        
        // 2. SALDO
        const saldoRaw = await exchange.fetchBalance();
        const saldoDolar = saldoRaw[MOEDA_COTACAO] ? saldoRaw[MOEDA_COTACAO].free : 0;
        const saldoMoeda = saldoRaw[MOEDA_BASE] ? saldoRaw[MOEDA_BASE].free : 0;

        // Inicializa memória se não existir
        if (!memoriaMoedas[parAtual]) memoriaMoedas[parAtual] = { comprei: false, precoPago: 0 };
        const memoria = memoriaMoedas[parAtual];

        // ENVIA DADOS COMPLETOS PRO SITE
        io.emit('dados', { 
            saldo: saldoDolar.toFixed(2), 
            lucro: lucroTotal.toFixed(2), 
            ligado: botLigado,
            config: configClient, // Manda a config de volta pro site saber o que ta rolando
            moedaAtual: parAtual
        });

        console.log(`🔎 ${parAtual} ($${precoAgora})`);

        if (!botLigado) return;

        // --- COMPRA ---
        if (!memoria.comprei && saldoDolar >= configClient.valorCompra) {
            io.emit('log', { tipo: 'compra', msg: `🛒 ${parAtual}: Comprando a $${precoAgora}...` });
            await exchange.createMarketBuyOrder(parAtual, configClient.valorCompra / precoAgora);
            memoriaMoedas[parAtual].comprei = true;
            memoriaMoedas[parAtual].precoPago = precoAgora;
            io.emit('log', { tipo: 'sucesso', msg: `✅ ${MOEDA_BASE} COMPRADO!` });
        }

        // --- VENDA (0.5% Lucro) ---
        else if (memoria.comprei && saldoMoeda > 0) {
            const precoPago = memoria.precoPago;
            const lucroPorcentagem = (precoAgora - precoPago) / precoPago;

            if (lucroPorcentagem >= 0.005) {
                io.emit('log', { tipo: 'venda', msg: `🚀 ${parAtual}: LUCRO ${(lucroPorcentagem * 100).toFixed(2)}%! Vendendo...` });
                await exchange.createMarketSellOrder(parAtual, saldoMoeda);
                const lucroDolar = (saldoMoeda * precoAgora) - (saldoMoeda * precoPago);
                lucroTotal += lucroDolar;
                memoriaMoedas[parAtual].comprei = false;
                memoriaMoedas[parAtual].precoPago = 0;
                io.emit('log', { tipo: 'sucesso', msg: `💰 ${MOEDA_BASE} VENDIDO! Lucro: $${lucroDolar.toFixed(2)}` });
            }
        }

    } catch (erro: any) {
        console.log('Erro:', erro.message);
    } finally {
        indiceAtual++;
        if (botLigado) {
            setTimeout(() => { cicloAtivo = false; rodarRobo(); }, 3000);
        } else {
            cicloAtivo = false;
        }
    }
}

function enviarDados() {
    io.emit('statusBot', { ligado: botLigado, config: configClient });
}

server.listen(Number(PORTA), process.env.HOST || '127.0.0.1', () => {
    console.log(`SERVIDOR ON NA PORTA ${PORTA}`);
});
