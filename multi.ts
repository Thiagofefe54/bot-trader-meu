import ccxt from 'ccxt';

// --- ⚙️ CONFIGURAÇÕES DO CLIENTE (O CHEFE) ---
const PARES = [
    'BTC/USDT', // Bitcoin
    'ETH/USDT', // Ethereum
    'SOL/USDT', // Solana
    'DOGE/USDT',// Dogecoin
    'XRP/USDT'  // Ripple
];

const SALDO_INICIAL_USDT = 1000.00; // Começamos com $1000 (Simulação)
const VALOR_POR_COMPRA = 200.00;    // O Bot gasta $200 em cada aposta
const PORCENTAGEM_LUCRO = 0.0001;   // 0.01% (Baixinho pra ele operar rápido agora)
const PORCENTAGEM_QUEDA = 0.0001;   // 0.01% (Caiu um tico, ele compra)

// --- 🏦 O COFRE (CARTEIRA) ---
let carteira: any = { 'USDT': SALDO_INICIAL_USDT };
let ultimaOperacao: any = {}; // Memória de preços

async function rodarMetralhadora() {
    const exchange = new ccxt.binance();
    console.log("\n🔥 BOT METRALHADORA LIGADO! 🔥");
    console.log(`💼 Saldo Inicial: $${SALDO_INICIAL_USDT}`);
    console.log(`👀 Vigiando: ${PARES.join(', ')}`);
    console.log("---------------------------------------------------\n");

    // Zera a memória inicial das moedas
    for (const par of PARES) {
        const moeda = par.split('/')[0];
        carteira[moeda] = 0;      
        ultimaOperacao[moeda] = 0; 
    }

    while (true) {
        // --- LOOP: OLHA UMA MOEDA DE CADA VEZ ---
        for (const par of PARES) {
            try {
                const moeda = par.split('/')[0]; 
                const ticker = await exchange.fetchTicker(par);
                const precoAtual = ticker.last as number;

                // 1. LÓGICA DE COMPRA (Tenho Dólar?)
                if (carteira['USDT'] >= VALOR_POR_COMPRA) {
                    
                    // Se nunca vi essa moeda, marco o preço de agora como base
                    if (ultimaOperacao[moeda] === 0) { ultimaOperacao[moeda] = precoAtual; }

                    // Regra: O preço caiu? (Promoção)
                    if (precoAtual <= ultimaOperacao[moeda] * (1 - PORCENTAGEM_QUEDA)) {
                        console.log(`\n📉 PROMOÇÃO EM ${moeda}! (Caiu para $${precoAtual})`);
                        
                        const quantidade = VALOR_POR_COMPRA / precoAtual; // Compra a fração
                        carteira['USDT'] -= VALOR_POR_COMPRA;
                        carteira[moeda] += quantidade;
                        ultimaOperacao[moeda] = precoAtual; // Novo preço base

                        console.log(`✅ COMPREI: ${quantidade.toFixed(4)} ${moeda}`);
                        console.log(`💵 Caixa: $${carteira['USDT'].toFixed(2)}`);
                    }
                }

                // 2. LÓGICA DE VENDA (Tenho a moeda e subiu?)
                if (carteira[moeda] > 0) {
                    if (precoAtual >= ultimaOperacao[moeda] * (1 + PORCENTAGEM_LUCRO)) {
                        console.log(`\n🚀 LUCRO EM ${moeda}! (Subiu para $${precoAtual})`);
                        
                        const valorVenda = carteira[moeda] * precoAtual;
                        carteira['USDT'] += valorVenda;
                        console.log(`💰 VENDI ${carteira[moeda].toFixed(4)} ${moeda} por $${valorVenda.toFixed(2)}`);
                        
                        carteira[moeda] = 0; // Zera a moeda
                        ultimaOperacao[moeda] = precoAtual; // Atualiza referência

                        console.log(`🤑 CAIXA TOTAL: $${carteira['USDT'].toFixed(2)}`);
                    }
                }

            } catch (erro) { } // Ignora erros de rede
            
            await new Promise(r => setTimeout(r, 200)); // Espera rápida
        }
    }
}

rodarMetralhadora();