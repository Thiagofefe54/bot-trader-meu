# Bot Trader Cripto

Estudo de automação de operações de criptomoedas com interface web.

![Status](https://img.shields.io/badge/status-n%C3%A3o%20finalizado-orange?style=flat-square)

**Tecnologias:** Node.js · TypeScript · Express · Socket.IO · CCXT

## Proposta e estado atual

A ideia é acompanhar múltiplas moedas e controlar uma estratégia pela interface. O projeto reúne experimentos de consulta, simulação e operação real. **Ainda não está finalizado e não está pronto para uso em produção.**

## Arquivos principais

| Arquivo | Finalidade |
|---|---|
| `index.ts` | Consulta pública de preço |
| `multi.ts` | Simulação de carteira com cotações externas |
| `real.ts` | Consulta autenticada de saldo |
| `server.ts` | Servidor da interface; pode emitir ordens reais |
| `index.html`, `script.js`, `style.css` | Interface web |

## Instalação

Requer Node.js com npm.

```sh
git clone https://github.com/Thiagofefe54/bot-trader-meu.git
cd bot-trader-meu
npm ci
npm run check
```

Para consultar uma cotação ou executar a simulação:

```sh
npm run quote
npm run simulate
```

A simulação roda continuamente; use Ctrl+C para encerrá-la. Não há promessa de resultado financeiro.

## Interface e configuração

Copie `.env.example` para `.env` e preencha suas próprias variáveis. `npm start` inicia o servidor em http://localhost:3000. O servidor fica limitado ao endereço local por padrão. A interface **não é um simulador**: acionar o bot com credenciais válidas pode comprar e vender ativos reais. Não publique o servidor nem compartilhe chaves.

## Pendências

- [ ] Separar operação real da simulação na interface.
- [ ] Implementar autenticação para os controles.
- [ ] Persistir e reconciliar posições e ordens após reinícios.
- [ ] Controlar quantidade por operação, taxas, precisão e limites da corretora.
- [ ] Revisar o lucro exibido e testar recuperação de falhas.

A venda atual ainda usa o saldo livre da moeda; pode incluir saldo anterior à execução do bot. A estratégia e a integração precisam de revisão antes de operar.

---

Projeto de [Thiago Feijó](https://github.com/Thiagofefe54).
