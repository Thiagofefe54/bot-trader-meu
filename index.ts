import ccxt from 'ccxt';

async function teste() {
    console.log("-----------------------------------");
    console.log("🚀 O BOT LIGOU NA PASTA NOVA!");
    
    const binance = new ccxt.binance();
    const ticker = await binance.fetchTicker('BTC/USDT');
    
    console.log(`💎 Bitcoin agora: $${ticker.last}`);
    console.log("-----------------------------------");
}

teste();
