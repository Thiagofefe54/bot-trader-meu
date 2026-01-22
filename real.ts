import ccxt from 'ccxt';
import * as dotenv from 'dotenv';
// Carrega as senhas do arquivo .env
dotenv.config();

async function testeReal() {
    console.log("🔐 Conectando na carteira REAL da Binance...");

    // Verifica se as chaves existem
    if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_SECRET) {
        console.error("❌ ERRO: Faltam as chaves no arquivo .env!");
        return;
    }

    // Conecta usando as chaves
    const exchange = new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET
    });

    try {
        // Tenta ver o seu saldo (Isso prova que a chave funciona)
        const saldo = await exchange.fetchBalance();
        
        console.log("\n✅ CONEXÃO BEM SUCEDIDA!");
        console.log("-----------------------------------------");
        console.log(`💵 Dólares Livres (USDT): ${saldo.USDT ? saldo.USDT.free : 0}`);
        console.log(`₿  Bitcoins na carteira: ${saldo.BTC ? saldo.BTC.total : 0}`);
        console.log("-----------------------------------------");
        
        // AVISO SOBRE O MÍNIMO
        const saldoEmDolar = saldo.USDT ? saldo.USDT.free : 0;
        if (saldoEmDolar < 10) {
            console.log("⚠️ AVISO: Seu saldo está abaixo de 10 USDT.");
            console.log("   A Binance provavelmente vai bloquear ordens de compra.");
        } else {
            console.log("🚀 Saldo suficiente para operar!");
        }

    } catch (erro) {
        console.error("\n❌ A chave não funcionou. Verifique o arquivo .env", erro);
    }
}

testeReal();