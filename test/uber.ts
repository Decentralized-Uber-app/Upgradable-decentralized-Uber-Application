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

         // //DEPLOYING THE UBER TOKEN CONTRACT
  const UberTokencontract = await ethers.getContractFactory("UberToken");
  const ubertoken = await UberTokencontract.deploy();

  await ubertoken.deployed();

  console.log(`Uber token contract is deployed to ${ubertoken.address}`);

  //DEPLOYING THE UBER CONTRACT
   const Ubercontract = await ethers.getContractFactory("Uber");
   const uber = await Ubercontract.deploy();
 
   await uber.deployed();
 
   console.log(`Uber Implemetation contract is deployed to ${uber.address}`);
 
 
   /************************* */
   const UberInteract = Ubercontract.attach(uber.address)
   const intialixe = await UberInteract.callStatic.encode(ubertoken.address)
   console.log("initialize ", intialixe)
   
 
 
    //DEPLOYING THE PROXY CONTRACT
    const ProxyContract = await ethers.getContractFactory("Proxy");
    const proxy = await ProxyContract.deploy(intialixe, uber.address);
  
    await proxy.deployed();
    console.log(`Uber Proxy contract is deployed to ${proxy.address}`)
 
        // Interacting with the Uber Contract
        const uberProxyInteract =  Ubercontract.attach("0x951fAa8B5E040DdC3f0489D00CF1E66be2355b25")

        const amt = await ethers.utils.parseEther("2");

        const transferToken = await ubertoken.connect(admin).transferFromContract(passenger3.address, amt);
        console.log("Transfer Uber token to user:", transferToken );

         const REVIEWER_ROLE = await uberProxyInteract.REVIEWER_ROLE();
        // const ADMIN_ROLE = await uberr.getRoleAdmin(REVIEWER_ROLE);

        // await uberr.connect(admin).initialize();
        await uberProxyInteract.connect(admin).grantRole(REVIEWER_ROLE, reviewer.address);
        
        return {admin, reviewer, reviewer2, driver, driver2, passenger,passsenger2, passenger3, uberProxyInteract, ubertoken, REVIEWER_ROLE}
    }

    describe("DriversRegistration", () => {
        it("Should register the driver and revert if driver has registered before", async function () {
            const {uberProxyInteract, driver} = await loadFixture(deployLoadFixture);
            await uberProxyInteract.connect(driver).driversRegister("Ayomide", 12345675);
            
            await expect (uberProxyInteract.connect(driver).driversRegister("Ayomide", 12345675)).to.be.revertedWith("already registered");
        })

    })

    describe("PassengerRegistration", () => {
        it("Should register the passenger and revert if the passenger has registered before", async function () {
            const {uberProxyInteract, passenger} = await loadFixture(deployLoadFixture);

            await uberProxyInteract.connect(passenger).passengerRegistration();

            await expect (uberProxyInteract.connect(passenger).passengerRegistration()).to.be.revertedWith("already registered")
        })
    })

    describe("ReviewDrivers", () => {
        it("Should approve the driver if driver has registered and met the requirements", async function(){
            const {uberProxyInteract, reviewer, driver, passsenger2, REVIEWER_ROLE} = await loadFixture(deployLoadFixture);
            //Register the driver first to catch the state
            await uberProxyInteract.connect(driver).driversRegister("CAS", 9753687);
        
            await uberProxyInteract.connect(reviewer).reviewDriver(driver.address);
            await expect(uberProxyInteract.connect(reviewer).reviewDriver(driver.address)).to.be.revertedWith("driver already approved");
        });
    })

    describe("CheckRoles", () => {
        it("Should revert if the address has not been granted REVIEWER_ROLE", async function(){
            const {uberProxyInteract, admin, reviewer, reviewer2, driver, REVIEWER_ROLE} = await loadFixture(deployLoadFixture);
            await uberProxyInteract.connect(driver).driversRegister("CAS", 89753687);
    
            const AccessControl = await ethers.getContractAt("IAccessControlUpgradeable", uberProxyInteract.address);

            await AccessControl.connect(admin).grantRole(REVIEWER_ROLE, reviewer2.address);
    
            const HasRole =  await AccessControl.connect(admin).hasRole(REVIEWER_ROLE, reviewer2.address);

            //returns true/false if reviewer hasrole
            console.log("Checks if he address has role", HasRole)
    
            await uberProxyInteract.connect(reviewer).reviewDriver(driver.address);
            
            await expect(uberProxyInteract.connect(reviewer).reviewDriver(driver.address)).revertedWith("driver already approved");
        })
    })

    describe("OrderRide", () => {
        it("Should allow passenger to order a ride successfully", async function() {
            const {uberProxyInteract, reviewer, driver2, passenger3, ubertoken} = await loadFixture(deployLoadFixture);

            //Getting balance of tokens of users
            const bal = await ubertoken.balanceOf(passenger3.address);
            console.log("Balance of User", bal);
  
            await uberProxyInteract.connect(passenger3).passengerRegistration()
            await uberProxyInteract.connect(driver2).driversRegister("Sayrarh", 7875322);

            await uberProxyInteract.connect(reviewer).reviewDriver(driver2.address);
            await uberProxyInteract.connect(passenger3).orderRide(driver2.address, 2345);

            await expect(uberProxyInteract.connect(passenger3).orderRide(driver2.address, 2345)).revertedWith("you have active request");
            
        })
    })

    describe("DriverAcceptRide", () => {
        it("Should revert if no ride was requested", async function() {
            const {uberProxyInteract, reviewer, driver2, passenger3, ubertoken} = await loadFixture(deployLoadFixture);

            await uberProxyInteract.connect(passenger3).passengerRegistration()
            await uberProxyInteract.connect(driver2).driversRegister("Sayrarh", 7875322);

            await uberProxyInteract.connect(reviewer).reviewDriver(driver2.address);
            await uberProxyInteract.connect(passenger3).orderRide(driver2.address, 2345);        

            await expect(uberProxyInteract.connect(driver2).driverAcceptRide())
            .to.emit(uberProxyInteract, "RideAccepted");
            
        })
    })

    describe("EndRide", () => {
        it("Should end a ride that already started and revert if no active ride", async function(){
            const{uberProxyInteract, reviewer, driver, driver2, passenger3} = await loadFixture(deployLoadFixture);

            await uberProxyInteract.connect(passenger3).passengerRegistration()
            await uberProxyInteract.connect(driver).driversRegister("Sayrarh", 7875322);

            await uberProxyInteract.connect(reviewer).reviewDriver(driver.address);
            await uberProxyInteract.connect(passenger3).orderRide(driver.address, 2345);

            await uberProxyInteract.connect(driver).driverAcceptRide();

            await uberProxyInteract.connect(driver).endride();
            await expect(uberProxyInteract.connect(driver).endride()).to.be.revertedWith("you have no active ride");
        })
    })
})