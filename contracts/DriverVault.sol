// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC20.sol";

contract DriverVault {
    address owner;
    IERC20 contractAddress;
    uint216 balance;
    constructor (address _owner, address _tokenAddress) {
        owner = _owner;
        contractAddress = IERC20(_tokenAddress);
    }

    modifier onlyOwner() {
        require (msg.sender == owner, "you aren't owner");
        _;
    }
    function withdraw (uint216 _amount) external onlyOwner {
        uint216 bal = uint216(IERC20(contractAddress).balanceOf(address(this)));
        require(bal > _amount, "Amount higher than balance");
        balance -= _amount;
        
        IERC20(contractAddress).transfer(msg.sender, _amount);
    }
}