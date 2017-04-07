require('./helpers.js')()


// Make sure to run `testrpc -a 25` so you have enough accounts.

// A test exploring the timeline of an attacker who gains access to the userKey.
// The steps are outlined in the unit test descriptions.


const IdentityFactory = artifacts.require('IdentityFactory')
const Proxy = artifacts.require('Proxy')
const RecoverableController = artifacts.require('RecoverableController')
const RecoveryQuorum = artifacts.require('RecoveryQuorum')

contract("IdentityFactory", (accounts) => {
  var identityFactory;
  var proxy;
  var deployedProxy;
  var deployedRecoverableController;
  var recoverableController;
  var testReg;
  var user1;
  var admin;

  var contractAddresses;
  var proxyAddress;
  var recoverableControllerAddress;
  var recoveryQuorumAddress;

  var delegateDeletedAfter =    0;
  var delegatePendingUntil =    1;
  var delegateProposedUserKey = 2;

  var shortTimeLock = 2;
  var longTimeLock = 7;

  before(() => {
    // Truffle deploys contracts with accounts[0]
    user1 = accounts[0];
    nobody = accounts[1];//has no authority
    recoveryUser1 = accounts[2];
    recoveryUser2 = accounts[3];
    delegate1 = accounts[4];
    delegate2 = accounts[5];
    delegate3 = accounts[6];
    delegate4 = accounts[7];
    delegates = [delegate1, delegate2, delegate3, delegate4];

    delegate5 = accounts[8];
    delegate6 = accounts[9];
    proxyDonor = accounts[10]; // for funding the proxy
    attackersOwnAddress = accounts[11]

    IdentityFactory.deployed().then((instance) => {
      identityFactory = instance
      return Proxy.deployed()
    }).then((instance) => {
      deployedProxy = instance
      return RecoverableController.deployed()
    }).then((instance) => {
      deployedRecoverableController = instance
      return RecoveryQuorum.deployed()
    }).then((instance) => {
      deployedRecoveryQuorum = instance
    })

  });

  it("First the setup, we create proxy, controller, and recovery quorum contracts", (done) => {
    // This code is taken right from the identityFactory.js tests
    var event = identityFactory.IdentityCreated({creator: nobody})
    event.watch((error, result) => {
      event.stopWatching();
      // Check that event has addresses to correct contracts
      proxyAddress = result.args.proxy;
      recoverableControllerAddress = result.args.controller;
      recoveryQuorumAddress = result.args.recoveryQuorum;

      assert.equal(web3.eth.getCode(proxyAddress),
                   web3.eth.getCode(deployedProxy.address),
                   "Created proxy should have correct code");
      assert.equal(web3.eth.getCode(recoverableControllerAddress),
                   web3.eth.getCode(deployedRecoverableController.address),
                   "Created controller should have correct code");
      assert.equal(web3.eth.getCode(recoveryQuorumAddress),
                   web3.eth.getCode(deployedRecoveryQuorum.address),
                   "Created recoveryQuorum should have correct code");
      proxy = Proxy.at(proxyAddress);
      recoverableController = RecoverableController.at(result.args.controller);
      // Check that the mapping has correct proxy address
      identityFactory.senderToProxy.call(nobody)
      .then((createdProxyAddress) => {
        assert(createdProxyAddress, proxy.address, "Mapping should have the same address as event");
        return recoverableController.userKey();
      }).then((userKey) => {
        assert.equal(userKey, user1);
        done();
      }).catch(done);
    });
    identityFactory.CreateProxyWithControllerAndRecovery(user1, delegates, longTimeLock, shortTimeLock, {from: nobody})
  });


  describe("Now then, what's the worst that can happen if an attacker gets access to our user key?", () =>{
    // first fund the proxy
    before( () => {
      // A generous donation is made to the proxy account!
      web3.eth.sendTransaction({from:proxyDonor, to:proxyAddress, value:web3.toWei(0.42, 'ether')});
      // create an alias to represent that the key is compromised.
      const compromisedUserKey = user1;
    });

    it("First, the attacker can immediately steal all the Ether funds held by the proxy", (done) => {
      // verify proxy has funds beforehand
      const proxyBalanceBefore = web3.eth.getBalance(proxyAddress);
      // get prior balance of attackers account
      const attackersBalanceBefore = web3.eth.getBalance(attackersOwnAddress);
      assert.ok( proxyBalanceBefore > 0, proxyBalanceBefore);
      recoverableController.forward(attackersOwnAddress, web3.toWei(0.42, 'ether'), '', {from: user1}).then((result) => {
        const proxyBalanceAfter = web3.eth.getBalance(proxyAddress);
        const stolenFunds = web3.eth.getBalance(attackersOwnAddress) - attackersBalanceBefore;
        assert.ok(proxyBalanceAfter == 0); // empty balance
        assert.ok(stolenFunds == web3.toWei(0.42, 'ether'), stolenFunds); // attacker has the funds
        done();
      }).catch(done);
    })

    it("Next, the attacker can propose a new userKey", (done) => {
      recoverableController.signUserKeyChange(attackersOwnAddress, {from: user1}).then((result) => {
        assert.ok(result !== null);
        return recoverableController.proposedUserKey();
      }).then((proposedUserKey) => {
        assert.equal(proposedUserKey, attackersOwnAddress);
        done();
      }).catch(done);
    });


    it("And finally, a few days later the attacker can finalize the transfer of ownership", (done) => {


      wait(longTimeLock + 1).then((result) => {
        return recoverableController.changeUserKey();
      }).then((result) => {
        return recoverableController.userKey();
      }).then((userKey) => {
        assert.equal(userKey,attackersOwnAddress);
        done();
      }).catch(done);
    });
  });
});
