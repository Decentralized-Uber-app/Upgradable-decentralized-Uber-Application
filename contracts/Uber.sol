//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./proxiable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./PassengerVault.sol";
import "./DriverVault.sol";
import "./AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Uber is Initializable, AccessControlUpgradeable, Proxiable {
    
      // EVENTS
    event RideAccepted(address indexed _driverAddres, uint256 indexed _timePicked);

    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    // STATE VARIABLES //
    address admin;
    address[] driversAddress;
    address[] driverReviewers;
    address[] passengersAddress;
    address[] approvedDrivers;
    address tokenAddress;
    uint public driveFeePerTime;
    uint public driveFeePerDistance;

    uint public rideCount;


    function constructor1(address _tokenAddress) public {
        require(admin == address(0), "Already initalized");
        admin = msg.sender;
         tokenAddress = _tokenAddress;
    }

     function initialize() public initializer {
        require(msg.sender == admin, "not admin");

        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REVIEWER_ROLE, msg.sender);
    }

     function updateCode(address newCode) onlyOwner public {
        updateCodeAddress(newCode);
    }

    function encode(address _tokenAddress) external pure returns (bytes memory) {
        return abi.encodeWithSignature("constructor1(address)", _tokenAddress);
    }

        struct DriverDetails{
        address driversAddress;
        string driversName;
        uint112 driversLicenseIdNo;
        bool registered;
        bool approved;
        bool rideRequest; // When a user request for ride
        bool acceptRide; // Driver accepts requested
        bool booked; // When driver accepts ride
        uint timePicked;
        uint successfulRide;
        address currentPassenger;
        DriverVault vaultAddress;
    }

    struct PassengerDetails{
        address passengerAddress;
        bool registered;
        bool ridepicked;
        PassengerVault vaultAddress;
    }

    mapping(address => DriverDetails) driverDetails;
    mapping(address => PassengerDetails) passengerDetails;

        ///Drivers ////
    function driversRegister(string memory _drivername, uint112 _driversLicenseIdNo) public {
        DriverDetails storage dd = driverDetails[msg.sender];
        require(dd.registered == false, "already registered");
        dd.driversAddress = msg.sender;
        dd.driversName = _drivername;
        dd.registered = true;
        dd.driversLicenseIdNo = _driversLicenseIdNo;
        driversAddress.push(msg.sender); // Where are you pushing this. I can't find the array
    }

    function reviewDriver(address _driversAddress) public onlyRole(REVIEWER_ROLE){
        DriverDetails storage dd = driverDetails[_driversAddress];
        require(dd.driversAddress == _driversAddress, "Driver not registered");
        require(dd.approved == false, "driver already approved");
        dd.approved = true;

        // deploy a new driver vault contract for the driver whose address is passed
        DriverVault newVault = new DriverVault(_driversAddress, tokenAddress);
        dd.vaultAddress = newVault;
    }

    //Passenger////////
    function passengerRegistration() public {
        PassengerDetails storage pd = passengerDetails[msg.sender];
        require(pd.registered == false, "already registered");
        pd.passengerAddress = msg.sender;
        pd.registered = true;
        passengersAddress.push(msg.sender);

        // deploy a new passenger vault contract for the passenger whose address is passed
        PassengerVault newVault = new PassengerVault(msg.sender, tokenAddress, address(this));
        pd.vaultAddress = newVault;
    }

    function orderRide(address _driver, uint _distance) public {
        PassengerDetails storage pd = passengerDetails[msg.sender];
        DriverDetails storage DD = driverDetails[_driver];

        if(DD.rideRequest == true && DD.currentPassenger == msg.sender){
            revert("you have active request");
        }

        address passengerVault = address(pd.vaultAddress);
        uint estimatedDriveFee = calFeeEstimate(_distance);
        require(IERC20(tokenAddress).balanceOf(passengerVault) >= estimatedDriveFee, "Insufficient balance");
        require(pd.registered == true, "not registered");
        require(pd.ridepicked == false, "You have an active ride");
        
        require(DD.approved == true, "Driver approval pending");
        require(DD.booked == false, "Passenger booked");
        DD.rideRequest = true;
        DD.currentPassenger = msg.sender;
        pd.ridepicked = true;
    }

    function driverAcceptRide() public {
        DriverDetails storage DD = driverDetails[msg.sender];
        require(DD.registered == true, "not a driver");
        require(DD.rideRequest == true, "No ride requested");
        DD.booked = true;
        DD.timePicked = block.timestamp;
        rideCount += 1;

        emit RideAccepted(msg.sender, DD.timePicked);
    }
  

    function endride() public{
        DriverDetails storage dd = driverDetails[msg.sender];
        require(dd.registered == true, "not a driver");
        PassengerDetails storage pd = passengerDetails[dd.currentPassenger];
        require(dd.booked == true, "you have no active ride");
        uint amount = calcRealFee(dd.driversAddress);
        IERC20(tokenAddress).transferFrom(address(pd.vaultAddress), address(dd.vaultAddress), amount);
        dd.currentPassenger = address(0);
        dd.booked = false;
        dd.acceptRide = false;
        dd.rideRequest = false;
        dd.successfulRide += 1;
        pd.ridepicked = false;
    }

    function calFeeEstimate (uint _distance) public view returns(uint estimateFee) {
        estimateFee = _distance * driveFeePerDistance;
    }

    function isUserInRide (address _owner) public view returns (bool rideOngoing) {
        PassengerDetails memory pd = passengerDetails[_owner];
        rideOngoing = pd.ridepicked;
    }

    function calcRealFee(address driverAddress) internal view returns(uint256 amountToPay){
        DriverDetails storage dd = driverDetails[driverAddress];
        uint totalTime = block.timestamp - dd.timePicked;
        amountToPay = totalTime * driveFeePerTime;
    }


    function setRideFeePerTime (uint fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        driveFeePerTime = fee;
    }

    function setRideFeePerDistance (uint fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        driveFeePerDistance = fee;
    }


    function viewAllDrivers () external view returns(address[] memory) {
        return driversAddress;
    }
    function viewAllPassengers () external view returns(address[] memory) {
        return passengersAddress;
    }

    function changeTokenAddress(address _newTokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE){
        tokenAddress = _newTokenAddress;
    }

    modifier onlyOwner() {
        require(msg.sender == admin, "Only owner is allowed to perform this action");
        _;
    }
}