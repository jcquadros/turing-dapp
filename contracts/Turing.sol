// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Turing is ERC20, Ownable {
    mapping(string => address) public users;
    mapping(address => string) public codinomes;
    string[] public listaCodinomes;

    mapping(string => mapping(string => bool)) public hasVote;
    mapping(string => uint256) public qtdeVotos;

    bool public voting = true;

    event Voted(string from, string to, uint256 amount);

    modifier onlyOwnerOrProf() {
        require(msg.sender == owner() || msg.sender == users["roberta"], "Somente owner ou professora");
        _;
    }

    constructor() ERC20("Turing", "TUR") Ownable(msg.sender) {
        _setUser("roberta", 0x502542668aF09fa7aea52174b9965A7799343Df7);
        _setUser("nome1", 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _setUser("nome2", 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _setUser("nome3", 0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        _setUser("nome4", 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        _setUser("nome5", 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
    }

    function _setUser(string memory codinome, address user_addr) internal {
        address antigo = users[codinome];
        if (antigo == address(0)) {
            listaCodinomes.push(codinome);
        } else {
            delete codinomes[antigo];
        }
        users[codinome] = user_addr;
        codinomes[user_addr] = codinome;
    }

    function updateUser(string memory codinome, address user_addr) public onlyOwnerOrProf {
        require(bytes(codinome).length > 0, "Codinome vazio");
        require(user_addr != address(0), "Endereco invalido");
        require(bytes(codinomes[user_addr]).length == 0, "Endereco ja cadastrado");
        _setUser(codinome, user_addr);
    }

    function votingOn() public onlyOwnerOrProf {
        voting = true;
    }

    function votingOff() public onlyOwnerOrProf {
        voting = false;
    }

    function issueToken(string memory codinome, uint256 qtde) public onlyOwnerOrProf {
        require(users[codinome] != address(0), "Codinome nao existe");
        _mint(users[codinome], qtde);
    }

    function vote(string memory codinome, uint256 qtde) public {
        require(voting, "Votacao pausada");
        string memory eleitor = codinomes[msg.sender];
        require(bytes(eleitor).length > 0, "Usuario nao autorizado");
        require(users[codinome] != address(0), "Codinome nao existe");
        require(keccak256(bytes(codinome)) != keccak256(bytes("roberta")), "Nao pode votar na professora");
        require(users[codinome] != msg.sender, "Nao pode votar em si mesmo");
        require(qtde > 0 && qtde <= 2 * 10 ** 18, "Quantidade deve ser entre 0 e 2 Turings");
        require(!hasVote[eleitor][codinome], "Ja votou nesse codinome");

        hasVote[eleitor][codinome] = true;
        qtdeVotos[eleitor]++;
        _mint(users[codinome], qtde);

        if (qtdeVotos[eleitor] % 10 == 0) {
            _mint(msg.sender, 1 * 10 ** 18);
        }

        emit Voted(eleitor, codinome, qtde);
    }

    function getCodinomes() public view returns (string[] memory) {
        return listaCodinomes;
    }
}
