import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe ("Uber", () => {
    async function deployLoadFixture(){
        const [admin, reviewer, reviewer2, driver, driver2, passenger, passsenger2, passenger3]  = await ethers.getSigners();
        // const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        // const USDTHolder = "0x292f04a44506c2fd49bac032e1ca148c35a478c8";

        // await helpers.impersonateAccount(USDTHolder);
        // const impersonatedSigner = await ethers.getSigner(USDTHolder);

       //Interaction with the contracts
        const UberTokenC = await ethers.getContractFactory("UberToken");
        const ubertoken = await UberTokenC.connect(admin).deploy();

        // Interacting with the Uber Contract
        const Ubercontract = await ethers.getContractFactory("Uber");
        const uberr = await Ubercontract.connect(admin).deploy(ubertoken.address);

        const amt = await ethers.utils.parseEther("2");

        const transferToken = await ubertoken.connect(admin).transferFromContract(passenger3.address, amt);
        console.log("Transfer Uber token to user:", transferToken );

        const REVIEWER_ROLE = await uberr.REVIEWER_ROLE();
        const ADMIN_ROLE = await uberr.getRoleAdmin(REVIEWER_ROLE);

        await uberr.connect(admin).initialize();
        await uberr.connect(admin).grantRole(REVIEWER_ROLE, reviewer.address);
        
        return {admin, reviewer, reviewer2, driver, driver2, passenger,passsenger2, passenger3, uberr, ubertoken, REVIEWER_ROLE, ADMIN_ROLE}
    }

    describe("DriversRegistration", () => {
        it("Should register the driver and revert if driver has registered before", async function () {
            const {uberr, driver} = await loadFixture(deployLoadFixture);
            await uberr.connect(driver).driversRegister("Ayomide", 12345675);
            
            await expect (uberr.connect(driver).driversRegister("Ayomide", 12345675)).to.be.revertedWith("already registered");
        })

    })

    describe("PassengerRegistration", () => {
        it("Should register the passenger and revert if the passenger has registered before", async function () {
            const {uberr, passenger} = await loadFixture(deployLoadFixture);

            await uberr.connect(passenger).passengerRegistration();

            await expect (uberr.connect(passenger).passengerRegistration()).to.be.revertedWith("already registered")
        })
    })

    describe("ReviewDrivers", () => {
        it("Should approve the driver if driver has registered and met the requirements", async function(){
            const {uberr, reviewer, driver, passsenger2, REVIEWER_ROLE} = await loadFixture(deployLoadFixture);
            //Register the driver first to catch the state
            await uberr.connect(driver).driversRegister("CAS", 9753687);
        
            await uberr.connect(reviewer).reviewDriver(driver.address);
            await expect(uberr.connect(reviewer).reviewDriver(driver.address)).to.be.revertedWith("driver already approved");
        });
    })

    describe("CheckRoles", () => {
        it("Should revert if the address has not been granted REVIEWER_ROLE", async function(){
            const {uberr, admin, reviewer, reviewer2, driver, REVIEWER_ROLE} = await loadFixture(deployLoadFixture);
            await uberr.connect(driver).driversRegister("CAS", 89753687);
    
            const AccessControl = await ethers.getContractAt("IAccessControlUpgradeable", uberr.address);

            await AccessControl.connect(admin).grantRole(REVIEWER_ROLE, reviewer2.address);
    
            const HasRole =  await AccessControl.connect(admin).hasRole(REVIEWER_ROLE, reviewer2.address);

            //returns true/false if reviewer hasrole
            console.log("Checks if he address has role", HasRole)
    
            await uberr.connect(reviewer).reviewDriver(driver.address);
            
            await expect(uberr.connect(reviewer).reviewDriver(driver.address)).revertedWith("driver already approved");
        })
    })

    describe("OrderRide", () => {
        it("Should allow passenger to order a ride successfully", async function() {
            const {uberr, reviewer, driver2, passenger3, ubertoken} = await loadFixture(deployLoadFixture);

            //Getting balance of tokens of users
            const bal = await ubertoken.balanceOf(passenger3.address);
            console.log("Balance of User", bal);
  
            await uberr.connect(passenger3).passengerRegistration()
            await uberr.connect(driver2).driversRegister("Sayrarh", 7875322);

            await uberr.connect(reviewer).reviewDriver(driver2.address);
            await uberr.connect(passenger3).orderRide(driver2.address, 2345);

            await expect(uberr.connect(passenger3).orderRide(driver2.address, 2345)).revertedWith("you have active request");
            
        })
    })

    describe("DriverAcceptRide", () => {
        it("Should revert if no ride was requested", async function() {
            const {uberr, reviewer, driver2, passenger3, ubertoken} = await loadFixture(deployLoadFixture);

            await uberr.connect(passenger3).passengerRegistration()
            await uberr.connect(driver2).driversRegister("Sayrarh", 7875322);

            await uberr.connect(reviewer).reviewDriver(driver2.address);
            await uberr.connect(passenger3).orderRide(driver2.address, 2345);        

            await expect(uberr.connect(driver2).driverAcceptRide())
            .to.emit(uberr, "RideAccepted");
            
        })
    })

    describe("EndRide", () => {
        it("Should end a ride that already started and revert if no active ride", async function(){
            const{uberr, reviewer, driver, driver2, passenger3} = await loadFixture(deployLoadFixture);

            await uberr.connect(passenger3).passengerRegistration()
            await uberr.connect(driver).driversRegister("Sayrarh", 7875322);

            await uberr.connect(reviewer).reviewDriver(driver.address);
            await uberr.connect(passenger3).orderRide(driver.address, 2345);

            await uberr.connect(driver).driverAcceptRide();

            await uberr.connect(driver).endride();
            await expect(uberr.connect(driver).endride()).to.be.revertedWith("you have no active ride");
        })
    })
})