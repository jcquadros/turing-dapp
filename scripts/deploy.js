const path = require("path");

async function main() {
  if (network.name === "hardhat") {
    console.warn(
      "Voce esta fazendo deploy na rede hardhat, que e apagada no fim do script." +
        " Use a opcao '--network localhost'"
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploy com a conta:", await deployer.getAddress());

  const Turing = await ethers.getContractFactory("Turing");
  const turing = await Turing.deploy();
  await turing.deployed();

  console.log("Endereco do Turing:", turing.address);

  saveFrontendFiles(turing);
}

function saveFrontendFiles(turing) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Turing: turing.address }, undefined, 2)
  );

  const TuringArtifact = artifacts.readArtifactSync("Turing");

  fs.writeFileSync(
    path.join(contractsDir, "Turing.json"),
    JSON.stringify(TuringArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
