// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC20.sol";
import "./Uber.sol";
contract PassengerVault {
    address owner;
    IERC20 contractAddress;
    uint216 balance;
    Uber uberAddress;
    constructor(address _owner, address _tokenAddress,address _uberAddress) {
        owner = _owner;
        contractAddress = IERC20(_tokenAddress);
        uberAddress = Uber(_uberAddress);
    }

    modifier onlyOwner() {
        require (msg.sender == owner, "you aren't owner");
        _;
    }

    function deposit(uint216 _amount) external onlyOwner{
        require(_amount > 0, "Can't be less than 0");
        IERC20(contractAddress).transferFrom(msg.sender, address(this), _amount);
        balance += _amount;
    }

    function withdraw(uint216 _amount) external onlyOwner {
        bool driveActive = Uber(uberAddress).isUserInRide(owner);
        require(driveActive == false, "You are still in a ride");
        uint216 bal = uint216(IERC20(contractAddress).balanceOf(address(this)));
        require(bal > _amount, "Amount higher than balance");
        balance -= _amount;
        IERC20(contractAddress).transfer(msg.sender, _amount);
    }

    function transferTodriver(address _addr, uint216 _amount) external {
        uint216 bal = uint216(IERC20(contractAddress).balanceOf(address(this)));
        require(bal > _amount, "Amount higher than balance");
        balance -= _amount;
        IERC20(contractAddress).transfer(_addr, _amount);
    }
}