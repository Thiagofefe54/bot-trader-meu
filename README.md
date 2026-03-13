🤖 Dev Feijo — Bot Trader Cripto

Bot automatizado de compra e venda de criptomoedas com interface web, desenvolvido em TypeScript.


📌 Sobre o Projeto
Bot trader pessoal que realiza operações de compra e venda de criptomoedas de forma autônoma, conectado diretamente à API da Binance. Possui interface web para seleção da moeda desejada, sem necessidade de mexer no código.
Projeto iniciado com foco em Solana (SOL) e expandido para suporte a múltiplas criptomoedas.

✨ Funcionalidades

📈 Compra e venda automática de criptomoedas
🖥️ Interface web para seleção da moeda
🔗 Integração com a API oficial da Binance
🌐 Servidor local para comunicação entre interface e bot
💱 Suporte a múltiplas criptomoedas (SOL, e outras)


🛠️ Tecnologias
TecnologiaUsoTypeScriptLógica do bot e servidorNode.jsAmbiente de execuçãoHTML/CSSInterface webJavaScriptScripts da interfaceBinance APIDados de mercado e execução de ordens

📁 Estrutura do Projeto
feijosystems/
├── index.html        # Interface web
├── style.css         # Estilo da interface
├── script.js         # Scripts da interface
├── index.ts          # Entrada principal do bot
├── multi.ts          # Suporte a múltiplas moedas
├── real.ts           # Lógica de operações reais
├── server.ts         # Servidor local (interface <-> bot)
├── package.json      # Dependências
└── tsconfig.json     # Configuração TypeScript

⚙️ Como Rodar
bash# Clone o repositório
git clone https://github.com/feijosystems/feijosystems.git

# Instale as dependências
npm install

# Configure suas chaves da Binance
# Crie um arquivo .env com:
# BINANCE_API_KEY=sua_chave
# BINANCE_SECRET=seu_secret

# Rode o servidor
npx ts-node server.ts
Acesse http://localhost:3000 e escolha a moeda pela interface.

⚠️ Aviso
Este projeto foi desenvolvido para fins educacionais e de aprendizado. Operações com criptomoedas envolvem risco financeiro. Use com responsabilidade.

👨‍💻 Autor
Feito por Thiago Feijó — LinkedIn · GitHub
