const ExperimentalToken = artifacts.require('ExperimentalToken');
const UserVault = artifacts.require('UserVault');
const UserVillage = artifacts.require('UserVillage');
const UserResources = artifacts.require('UserResources');
const UserBuildings = artifacts.require('UserBuildings');
const BuildingsData = artifacts.require('BuildingsData');

var buildingsMock = require('../mocks/buildings');
const { assertRevert } = require('./helpers/assertThrow');

contract('User Village Test', (accounts) => {
  let experimentalToken, userVault, userResources, buildingsData, userBuildings, userVillage = {};

  const Alice = accounts[0];
  const Bob = accounts[1];
  const Carol = accounts[2];
  const David = accounts[3];
  const ether = Math.pow(10, 18);
  const initialUserBuildings = [1, 2, 3];

  beforeEach(async () => {
    experimentalToken = await ExperimentalToken.new();
    userVault = await UserVault.new(experimentalToken.address);
    userResources = await UserResources.new();
    buildingsData = await BuildingsData.new();
    userBuildings= await UserBuildings.new(buildingsData.address);
    userVillage = await UserVillage.new(userVault.address,
                                        userResources.address,
                                        userBuildings.address);

    await userResources.setUserVillage(userVillage.address);
    await userBuildings.setUserVillage(userVillage.address);
    await userBuildings.setUserResources(userResources.address);
    await userVault.setUserVillage(userVillage.address);
    await userVillage.setBuildingsData(buildingsData.address);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[0].id,
      buildingsMock.initialBuildings[0].name,
      buildingsMock.initialBuildings[0].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[1].id,
      buildingsMock.initialBuildings[1].name,
      buildingsMock.initialBuildings[1].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[2].id,
      buildingsMock.initialBuildings[2].name,
      buildingsMock.initialBuildings[2].stats);
    await userVillage.setInitialBuildings(initialUserBuildings);
  })

  it('Create a village', async () =>  {
    await experimentalToken.approve(userVault.address, 1 * ether);
    const txData = await userVillage.create('My new village!', 'Cool player');
    assert.equal(txData.logs[0].event,'VillageCreated');
    assert.equal(txData.logs[0].args.owner, Alice);
    assert.equal(txData.logs[0].args.name,'My new village!');
    assert.equal(txData.logs[0].args.username,'Cool player');
  })

  it('Fail initUserResources from user villace create method', async () => {
    return assertRevert(async () => {
      await userResources.setUserVillage(Alice);
      await userResources.initUserResources(Alice);
      await userResources.setUserVillage(userVillage.address);
      await experimentalToken.approve(userVault.address, 1 * ether);
      await userVillage.create('Kokorico', 'Link');
    })
  })

  context('Existing Village period', async () => {
    beforeEach(async () => {
      await experimentalToken.approve(userVault.address, 1 * ether);
      await userVillage.create('My new village!', 'Cool player');
    })

    it('Create village from same user', async () => {
      return assertRevert(async () => {
        await experimentalToken.approve(userVault.address, 1 * ether);
        await userVillage.create('My second village!', 'Awesome player');
      })
    })

    it('Create village from account without e11', async () => {
      return assertRevert(async () => {
        await experimentalToken.approve(userVault.address, 1 * ether, {from: Bob})
        await userVillage.create('AccOneVillage','Bob', {from: Bob});
      })
    })

    it('Create village with taken Username', async () => {
      return assertRevert(async () => {
        await experimentalToken.transfer(Carol, 5 * ether);
        await experimentalToken.approve(userVault.address, 1 * ether, {from: Carol});
        await userVillage.create('AccTwoVillage','Cool player', {from: Carol});
      })
    })

    it('Create village with empty Village Name', async () => {
      return assertRevert(async () => {
        await experimentalToken.transfer(Carol, 5 * ether);
        await experimentalToken.approve(userVault.address, 1 * ether, {from: Carol});
        await userVillage.create('','Player Two', {from: Carol});
      })
    })

    it('Create village with empty Username', async () => {
      return assertRevert(async () => {
        await experimentalToken.transfer(Carol, 5 * ether);
        await experimentalToken.approve(userVault.address, 1 * ether, {from: Carol});
        await userVillage.create('Kokorico','', {from: Carol});
      })
    })

    it('Try to set initial buildings not from owner', async () => {
      return assertRevert(async () => {
        await userVillage.setInitialBuildings([2, 3], {from: Bob});
      })
    })

    it('Set initial buildings empty', async () => {
      await userVillage.setInitialBuildings([]);
    })

  })

});
