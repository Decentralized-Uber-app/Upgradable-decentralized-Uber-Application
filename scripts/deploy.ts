import { ethers } from "hardhat";

async function main() {
     const accounts = await ethers.getSigners()
      const contractOwner = accounts[0]
      const driver1 = accounts[1]

  //DEPLOYING THE UBER TOKEN CONTRACT
  const UberTokencontract = await ethers.getContractFactory("UberToken");
  const ubertoken = await UberTokencontract.deploy();

  await ubertoken.deployed();

  console.log(`Uber token contract is deployed to ${ubertoken.address}`);

  //DEPLOYING THE UBER CONTRACT
  const Ubercontract = await ethers.getContractFactory("Uber");
  const uber = await Ubercontract.deploy();

  await uber.deployed();

  console.log(`Uber contract is deployed to ${uber.address}`);


  /************************* */
  const UberInteract = Ubercontract.attach(uber.address)
  const intialixe = await UberInteract.callStatic.encode(ubertoken.address)
  console.log("initialize ", intialixe)
  


   //DEPLOYING THE PROXY CONTRACT
   const ProxyContract = await ethers.getContractFactory("Proxy");
   const proxy = await ProxyContract.deploy(intialixe, uber.address);
 
   await proxy.deployed();
 
   console.log(`Uber contract is deployed to ${proxy.address}`)


/******************INteract wiith*/
const uberProxyInteract =  Ubercontract.attach(proxy.address)
const driverReg = await uberProxyInteract.connect(driver1).driversRegister("isaac",  5);


const driversaddr = await uberProxyInteract.callStatic.viewAllDrivers();
console.log("drivers", driversaddr)

/*******************set ride fee */ //onlyadmin can do this
 await uberProxyInteract.setRideFeePerTime(20);

 /***************get fee*****/
 const getFee = await uberProxyInteract.callStatic.driveFeePerTime()
 console.log("get fee", getFee)

 /**********Get admin********** */
 const getAdmin = await uberProxyInteract.callStatic.admin()
 console.log("admin ", getAdmin)



      
    // // //Interaction with the contracts
    // const UberInteract = await ethers.getContractAt("Uber", uber.address);
    // const UberTokenInteract = await ethers.getContractAt("UberToken", ubertoken.address);

    // const amt = await ethers.utils.parseUnits("100")

    // const transferToken = await UberTokenInteract.transferFromContract("", amt);
  
    //  console.log("Transfer Uber token to user:", transferToken );

    //  //Getting balance of tokens of users
    //   const bal = await UberTokenInteract.balanceOf(valid1.address)

    //   console.log("Balance of User", bal);
   
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});