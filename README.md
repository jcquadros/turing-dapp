# Turing dApp

Atividade 13 de Blockchains e Smart Contracts (UFES).

Token ERC-20 `Turing` (TUR), feito com OpenZeppelin, em que os alunos votam uns nos outros. Os tokens so sao criados quando alguem vota ou quando o owner/professora usa o `issueToken` (sem mint no construtor e sem limite de supply). O frontend e o React do Hardhat Boilerplate adaptado.

## Contrato

- `updateUser(codinome, endereco)`: cadastra ou atualiza um usuario (owner ou professora)
- `issueToken(codinome, qtde)`: emite Turings para um codinome (owner ou professora)
- `votingOn()` / `votingOff()`: liga e desliga a votacao (owner ou professora)
- `vote(codinome, qtde)`: vota em outro codinome com ate 2 TUR. Cada usuario vota uma vez em cada codinome, nao pode votar em si mesmo, e a cada 10 votos ganha 1 TUR

## Como rodar

Precisa de Node.js (usei a versao 24).

```
npm install
npx hardhat test
```

Em um terminal, sobe a blockchain local:

```
npx hardhat node
```

Em outro terminal, faz o deploy e sobe o frontend:

```
npx hardhat run scripts/deploy.js --network localhost
cd frontend
npm install
npm start
```

O frontend abre em http://localhost:3000.

## MetaMask

1. Adicionar a rede: RPC `http://127.0.0.1:8545`, chain id `31337`, moeda `ETH`
2. Importar as contas pela chave privada que aparece no `npx hardhat node`. A conta #0 e o owner e as contas #1 a #5 sao nome1 a nome5
3. Se reiniciar o node, limpar os dados de atividade da conta na MetaMask (Configuracoes > Avancado) e fazer o deploy de novo
