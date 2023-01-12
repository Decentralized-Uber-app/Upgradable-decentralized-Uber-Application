// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UberToken is ERC20("UberToken", "UBT") {
    
    address owner;

    constructor() {
        owner = msg.sender;
        _mint(address(this), 9000000e18);
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "no permission!");
        _;
    }

    function transferFromContract(address _to, uint256 amount) external onlyOwner {
        uint bal = balanceOf(address(this));
        require(bal >= amount, "You are transferring more than the amount available!");
        _transfer(address(this), _to, amount);
    }
}