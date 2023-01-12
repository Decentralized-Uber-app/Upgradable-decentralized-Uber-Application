import { ethers } from "hardhat";

async function main() {

  //DEPLOYING THE UBER TOKEN CONTRACT
  const UberTokencontract = await ethers.getContractFactory("UberToken");
  const ubertoken = await UberTokencontract.deploy();

  await ubertoken.deployed();

  console.log(`Uber token contract is deployed to ${ubertoken.address}`);

  //DEPLOYING THE UBER CONTRACT
  const Ubercontract = await ethers.getContractFactory("Uber");
  const uber = await Ubercontract.deploy(ubertoken.address);

  await uber.deployed();

  console.log(`Uber contract is deployed to ${uber.address}`);

      
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