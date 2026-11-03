import React from "react";
import { ethers } from "ethers";

import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TuringForm } from "./TuringForm";
import { VotingControls } from "./VotingControls";
import { Ranking } from "./Ranking";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

const HARDHAT_CHAIN_ID = "0x7a69";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      codinome: undefined,
      balance: undefined,
      voting: undefined,
      isSuper: false,
      codinomes: [],
      ranking: [],
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (this.state.networkError) {
      return (
        <div className="container p-4">
          <div className="alert alert-danger">{this.state.networkError}</div>
        </div>
      );
    }

    if (!this.state.balance || this.state.voting === undefined) {
      return <Loading />;
    }

    const registrado = this.state.codinome !== "";
    const alunos = this.state.codinomes.filter((c) => c !== "roberta");

    return (
      <div className="container p-4">
        <h1>Turing (TUR)</h1>
        <p className="mb-1">
          Conta: <b>{this.state.selectedAddress}</b>
        </p>
        <p className="mb-1">
          Codinome: <b>{registrado ? this.state.codinome : "-"}</b>
          {this.state.isSuper && <span className="badge badge-dark ml-2">superusuario</span>}
        </p>
        <p>
          Saldo: <b>{ethers.utils.formatEther(this.state.balance)} TUR</b>
        </p>
        <p>
          Votacao:{" "}
          {this.state.voting ? (
            <span className="badge badge-success">ativa</span>
          ) : (
            <span className="badge badge-secondary">pausada</span>
          )}
        </p>

        <hr />

        {this.state.txBeingSent && (
          <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
        )}

        {this.state.transactionError && (
          <TransactionErrorMessage
            message={this._getRpcErrorMessage(this.state.transactionError)}
            dismiss={() => this._dismissTransactionError()}
          />
        )}

        {!registrado && !this.state.isSuper ? (
          <div className="alert alert-warning">
            Este endereco nao esta autorizado a usar o Turing.
          </div>
        ) : (
          <div className="row">
            <div className="col-md-6">
              {registrado ? (
                <TuringForm
                  titulo="Votar"
                  botao="Votar"
                  codinomes={alunos.filter((c) => c !== this.state.codinome)}
                  max="2"
                  onSubmit={(codinome, qtde) => this._sendTx("vote", codinome, qtde)}
                />
              ) : (
                <p className="text-muted">
                  Essa conta nao tem codinome cadastrado, entao nao pode votar.
                </p>
              )}

              {this.state.isSuper && (
                <>
                  <TuringForm
                    titulo="Emitir Turings"
                    botao="issueToken"
                    codinomes={alunos}
                    onSubmit={(codinome, qtde) =>
                      this._sendTx("issueToken", codinome, qtde)
                    }
                  />
                  <VotingControls
                    voting={this.state.voting}
                    votingOn={() => this._sendTx("votingOn")}
                    votingOff={() => this._sendTx("votingOff")}
                  />
                </>
              )}
            </div>
            <div className="col-md-6">
              <Ranking ranking={this.state.ranking} />
            </div>
          </div>
        )}
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    await this._checkNetwork();
    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      if (newAddress === undefined) {
        return this._resetState();
      }
      this._initialize(newAddress);
    });

    window.ethereum.on("chainChanged", () => window.location.reload());
  }

  async _initialize(userAddress) {
    this.setState({ ...this.initialState, selectedAddress: userAddress });

    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    this._turing = new ethers.Contract(
      contractAddress.Turing,
      TuringArtifact.abi,
      this._provider.getSigner(0)
    );

    const code = await this._provider.getCode(contractAddress.Turing);
    if (code === "0x") {
      this.setState({
        networkError: "Contrato nao encontrado nessa rede. Rode o deploy de novo.",
      });
      return;
    }

    this._startPollingData();
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateData().catch(console.error), 3000);
    this._updateData().catch(console.error);
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _updateData() {
    const endereco = this.state.selectedAddress;
    const turing = this._turing;

    const [balance, voting, codinome, owner, prof, lista] = await Promise.all([
      turing.balanceOf(endereco),
      turing.voting(),
      turing.codinomes(endereco),
      turing.owner(),
      turing.users("roberta"),
      turing.getCodinomes(),
    ]);

    const ranking = await Promise.all(
      lista.map(async (c) => {
        const addr = await turing.users(c);
        const saldo = await turing.balanceOf(addr);
        return { codinome: c, saldo };
      })
    );
    ranking.sort((a, b) => (b.saldo.gt(a.saldo) ? 1 : b.saldo.lt(a.saldo) ? -1 : 0));

    if (endereco !== this.state.selectedAddress) {
      return;
    }

    const isSuper =
      endereco.toLowerCase() === owner.toLowerCase() ||
      endereco.toLowerCase() === prof.toLowerCase();

    this.setState({ balance, voting, codinome, isSuper, codinomes: lista, ranking });
  }

  async _sendTx(funcao, codinome, qtde) {
    try {
      this._dismissTransactionError();

      let tx;
      if (codinome === undefined) {
        tx = await this._turing[funcao]();
      } else {
        tx = await this._turing[funcao](codinome, ethers.utils.parseEther(qtde));
      }
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transacao falhou");
      }

      await this._updateData();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER || error.code === "ACTION_REJECTED") {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error) {
    const texto =
      error.data?.message ||
      error.error?.data?.message ||
      error.error?.message ||
      error.reason ||
      error.message;

    const motivo =
      texto.match(/reverted with reason string '(.*)'/) ||
      texto.match(/execution reverted: (.*)/);

    return motivo ? motivo[1] : texto;
  }

  _resetState() {
    this.setState(this.initialState);
  }

  async _checkNetwork() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId === HARDHAT_CHAIN_ID) {
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: HARDHAT_CHAIN_ID,
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        this.setState({ networkError: "Troque a rede da MetaMask para localhost:8545" });
      }
    }
  }
}
