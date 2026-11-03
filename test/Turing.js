const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  impersonateAccount,
  setBalance,
} = require("@nomicfoundation/hardhat-network-helpers");

const PROF = "0x502542668aF09fa7aea52174b9965A7799343Df7";
const um = ethers.utils.parseEther("1");
const dois = ethers.utils.parseEther("2");

describe("Turing", function () {
  async function deployFixture() {
    const signers = await ethers.getSigners();
    const Turing = await ethers.getContractFactory("Turing");
    const turing = await Turing.deploy();
    await turing.deployed();

    const [owner, nome1, nome2, nome3] = signers;
    return { turing, owner, nome1, nome2, nome3, signers };
  }

  async function profSigner() {
    await impersonateAccount(PROF);
    await setBalance(PROF, ethers.utils.parseEther("10"));
    return ethers.getSigner(PROF);
  }

  describe("Deploy", function () {
    it("nome e simbolo", async function () {
      const { turing } = await loadFixture(deployFixture);
      expect(await turing.name()).to.equal("Turing");
      expect(await turing.symbol()).to.equal("TUR");
      expect(await turing.decimals()).to.equal(18);
    });

    it("nao faz mint no construtor", async function () {
      const { turing } = await loadFixture(deployFixture);
      expect(await turing.totalSupply()).to.equal(0);
    });

    it("cadastra os usuarios iniciais", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      expect(await turing.users("roberta")).to.equal(PROF);
      expect(await turing.users("nome1")).to.equal(nome1.address);
      expect(await turing.codinomes(nome1.address)).to.equal("nome1");
      expect(await turing.getCodinomes()).to.deep.equal([
        "roberta",
        "nome1",
        "nome2",
        "nome3",
        "nome4",
        "nome5",
      ]);
    });

    it("votacao comeca ativa", async function () {
      const { turing } = await loadFixture(deployFixture);
      expect(await turing.voting()).to.equal(true);
    });
  });

  describe("onlyOwnerOrProf", function () {
    it("usuario comum nao pode chamar", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployFixture);
      const msg = "Somente owner ou professora";
      await expect(turing.connect(nome1).issueToken("nome2", um)).to.be.revertedWith(msg);
      await expect(turing.connect(nome1).votingOff()).to.be.revertedWith(msg);
      await expect(turing.connect(nome1).votingOn()).to.be.revertedWith(msg);
      await expect(
        turing.connect(nome1).updateUser("novo", nome2.address)
      ).to.be.revertedWith(msg);
    });

    it("professora pode chamar", async function () {
      const { turing, nome2 } = await loadFixture(deployFixture);
      const prof = await profSigner();
      await turing.connect(prof).issueToken("nome2", um);
      expect(await turing.balanceOf(nome2.address)).to.equal(um);
      await turing.connect(prof).votingOff();
      expect(await turing.voting()).to.equal(false);
    });
  });

  describe("updateUser", function () {
    it("nao aceita codinome vazio", async function () {
      const { turing, signers } = await loadFixture(deployFixture);
      await expect(turing.updateUser("", signers[6].address)).to.be.revertedWith(
        "Codinome vazio"
      );
    });

    it("adiciona codinome novo", async function () {
      const { turing, signers } = await loadFixture(deployFixture);
      await turing.updateUser("nome6", signers[6].address);
      expect(await turing.users("nome6")).to.equal(signers[6].address);
      expect(await turing.codinomes(signers[6].address)).to.equal("nome6");
      expect((await turing.getCodinomes()).length).to.equal(7);
    });

    it("atualiza o endereco de um codinome existente", async function () {
      const { turing, nome1, signers } = await loadFixture(deployFixture);
      await turing.updateUser("nome1", signers[6].address);
      expect(await turing.users("nome1")).to.equal(signers[6].address);
      expect(await turing.codinomes(nome1.address)).to.equal("");
      expect((await turing.getCodinomes()).length).to.equal(6);
    });
  });

  describe("issueToken", function () {
    it("faz mint para o codinome", async function () {
      const { turing, nome3 } = await loadFixture(deployFixture);
      await turing.issueToken("nome3", ethers.utils.parseEther("5"));
      expect(await turing.balanceOf(nome3.address)).to.equal(ethers.utils.parseEther("5"));
    });

    it("codinome precisa existir", async function () {
      const { turing } = await loadFixture(deployFixture);
      await expect(turing.issueToken("ninguem", um)).to.be.revertedWith(
        "Codinome nao existe"
      );
    });
  });

  describe("vote", function () {
    it("faz mint para o votado e emite evento", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployFixture);
      const qtde = ethers.utils.parseEther("1.5");
      await expect(turing.connect(nome1).vote("nome2", qtde))
        .to.emit(turing, "Voted")
        .withArgs("nome1", "nome2", qtde);
      expect(await turing.balanceOf(nome2.address)).to.equal(qtde);
      expect(await turing.hasVote("nome1", "nome2")).to.equal(true);
    });

    it("nao pode votar duas vezes no mesmo codinome", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await turing.connect(nome1).vote("nome2", um);
      await expect(turing.connect(nome1).vote("nome2", um)).to.be.revertedWith(
        "Ja votou nesse codinome"
      );
    });

    it("nao pode votar em si mesmo", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await expect(turing.connect(nome1).vote("nome1", um)).to.be.revertedWith(
        "Nao pode votar em si mesmo"
      );
    });

    it("quantidade entre 0 e 2", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      const msg = "Quantidade deve ser entre 0 e 2 Turings";
      await expect(turing.connect(nome1).vote("nome2", 0)).to.be.revertedWith(msg);
      await expect(turing.connect(nome1).vote("nome2", dois.add(1))).to.be.revertedWith(msg);
      await turing.connect(nome1).vote("nome2", dois);
    });

    it("usuario nao cadastrado nao vota", async function () {
      const { turing, owner, signers } = await loadFixture(deployFixture);
      await expect(turing.connect(signers[10]).vote("nome2", um)).to.be.revertedWith(
        "Usuario nao autorizado"
      );
      await expect(turing.connect(owner).vote("nome2", um)).to.be.revertedWith(
        "Usuario nao autorizado"
      );
    });

    it("codinome votado precisa existir e nao pode ser a professora", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await expect(turing.connect(nome1).vote("ninguem", um)).to.be.revertedWith(
        "Codinome nao existe"
      );
      await expect(turing.connect(nome1).vote("roberta", um)).to.be.revertedWith(
        "Nao pode votar na professora"
      );
    });

    it("nao vota com a votacao pausada", async function () {
      const { turing, nome1 } = await loadFixture(deployFixture);
      await turing.votingOff();
      await expect(turing.connect(nome1).vote("nome2", um)).to.be.revertedWith(
        "Votacao pausada"
      );
      await turing.votingOn();
      await turing.connect(nome1).vote("nome2", um);
    });

    it("ganha 1 Turing a cada 10 votos", async function () {
      const { turing, nome1, signers } = await loadFixture(deployFixture);
      for (let i = 6; i <= 11; i++) {
        await turing.updateUser("nome" + i, signers[i].address);
      }

      const alvos = ["nome2", "nome3", "nome4", "nome5", "nome6", "nome7", "nome8", "nome9", "nome10"];
      for (const alvo of alvos) {
        await turing.connect(nome1).vote(alvo, um);
      }
      expect(await turing.balanceOf(nome1.address)).to.equal(0);

      await turing.connect(nome1).vote("nome11", um);
      expect(await turing.balanceOf(nome1.address)).to.equal(um);
      expect(await turing.qtdeVotos("nome1")).to.equal(10);
    });
  });
});
