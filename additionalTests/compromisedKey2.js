require('./helpers.js')()


// Make sure to run `testrpc -a 25` so you have enough accounts.

// A test exploring the potential for an attacker who has access to the userKey, to remove delegates, thus gaining equal control
// over the proxy with the original owner.
// Further detail is provided after the test setup.


const Proxy = artifacts.require('Proxy')
const RecoverableController = artifacts.require('RecoverableController')
const RecoveryQuorum = artifacts.require('RecoveryQuorum')

const LOG_NUMBER_1 = 1234;
const LOG_NUMBER_2 = 2345;

contract("RecoveryQuorum", (accounts) => {
  var userSigner;
  var proxySigner;

  var recoverableController;
  var recoveryQuorum;
  var user1;
  var user2;
  var recovery1;
  var delegateList;

  var delegateDeletedAfter =    0;
  var delegatePendingUntil =    1;
  var delegateProposedUserKey = 2;

  var shortTimeLock = 2; // Testing doesn't seem to utilize EVM ffwding
  var longTimeLock  = 5; //
  var fiveDays = 5*24*60*60*1000 // milliseconds

  before(() => {
    user1 = accounts[0];
    user2 = accounts[1];
    recovery1 = accounts[2];
    delegateList = [
      accounts[3],
      accounts[4],
      accounts[5],
      accounts[6]
    ];
    largeDelegateList = [
      accounts[2],
      accounts[3],
      accounts[4],
      accounts[5],
      accounts[6],
      accounts[7],
      accounts[8],
      accounts[9],
      accounts[10],
      accounts[11],
      accounts[12],
      accounts[13],
      accounts[14],
      accounts[15],
    ];
    Proxy.deployed().then((instance) => {
      proxy = instance
    })
  });

  it("Correctly deploys contract", (done) => {
    RecoverableController.new(proxy.address, user1, longTimeLock, shortTimeLock, {from: recovery1})
    .then((newRC) => {
      recoverableController = newRC;
      return proxy.transfer(recoverableController.address, {from: accounts[0]});
    }).then(() => {
      return RecoveryQuorum.new(recoverableController.address, delegateList);
    }).then((newRQ) => {
      recoveryQuorum = newRQ;
      return recoverableController.changeRecoveryFromRecovery(recoveryQuorum.address, {from: recovery1});
    }).then(() => {
      return recoverableController.recoveryKey.call();
    }).then((RCrecoveryKey) => {
      assert.equal(RCrecoveryKey, recoveryQuorum.address, "Controller's recoverKey should be the RQ's address")
      return recoveryQuorum.controller.call();
    }).then((RCcontroller) => {
      assert.equal(RCcontroller, recoverableController.address, "RQ's controller var should be the controller's address")
      return recoveryQuorum.controller();
    }).then((controllerAddress) => {
      assert.equal(controllerAddress, recoverableController.address);
      return recoveryQuorum.delegates.call(delegateList[0]);
    }).then((delegate) => {
      assert.isAbove(delegate[delegateDeletedAfter].toNumber(), 0);
      return recoveryQuorum.delegates.call(delegateList[1]);
    }).then((delegate) => {
      assert.isAbove(delegate[delegateDeletedAfter].toNumber(), 0);
      return recoveryQuorum.delegates.call(delegateList[2]);
    }).then((delegate) => {
      assert.isAbove(delegate[delegateDeletedAfter].toNumber(), 0);
      return recoveryQuorum.delegates.call(delegateList[3]);
    }).then((delegate) => {
      assert.equal(delegate[delegateProposedUserKey], 0x0);
      assert.equal(delegate[delegatePendingUntil].toNumber(), 0);
      assert.isAtLeast(delegate[delegateDeletedAfter].toNumber(), 31536000000000);//million years
      return recoveryQuorum.delegates.call(user1);
    }).then((delegate) => {
      assert.equal(delegate[delegateDeletedAfter].toNumber(), 0);
      return recoveryQuorum.delegates.call(user2);
    }).then((delegate) => {
      assert.equal(delegate[delegateDeletedAfter].toNumber(), 0);
      return recoveryQuorum.delegates.call(recovery1);
    }).then((delegate) => {
      assert.equal(delegate[delegateDeletedAfter].toNumber(), 0);
      return recoveryQuorum.delegates.call(0x0);
    }).then((delegate) => {
      assert.equal(delegate[delegateDeletedAfter].toNumber(), 0);
      done();
    }).catch(done);
  });


// Possible vector:
// With only a compromised userKey, replace delegates with zero delegates.
// The owner would then have to re-add their delegates, but they will be locked to a longTimeLock until active (pendingUntil).
// The compromised userKey then replaces delegates again with zero delegates.
// Rinse, repeat.
// This gives no time for delegates to sign a recovery change.
// In the controller, the signUserKeyChange will then the battle for regaining control, since it is a shortTimeLock.


  describe("Now then, what's the worst that can happen if an attacker gets access to our user key?", () => {

    it("With only a compromised userKey, remove all the delegates and replace them with zero delegates.", (done) => {
      recoveryQuorum.replaceDelegates(delegateList,[], {from: user1}).then(() => {
        return recoveryQuorum.delegates.call(delegateList[0]);
      }).then((delegate0) => {
        // Verify that deletion was successful by checking the deleteAfter date on our delegates.
        const deletedAfter =  delegate0[delegateDeletedAfter].toNumber()*1000;
        // deletedAfter should be just under 5 days from now
        assert.ok(deletedAfter - Date.now() <  fiveDays);
        // deletedAfter should be in the future
        assert.ok(deletedAfter > Date.now());
        debugger; // point of confusion: at this breakpoint, in the debugger repl, run:
        // > Date(deletedAfter)
        // it will give very close to the current time.
        return recoveryQuorum.delegates.call(delegateList[1]);
      }).then((delegate1) => {
        // do it again for the other 3 delegates.
        const deletedAfter =  delegate1[delegateDeletedAfter].toNumber()*1000 ;
        assert.ok(deletedAfter - Date.now() <  fiveDays);
        // assert.ok(deletedAfter > Date.now());
        return recoveryQuorum.delegates.call(delegateList[2]);
      }).then((delegate2) => {
        const deletedAfter =  delegate2[delegateDeletedAfter].toNumber()*1000
        assert.ok(deletedAfter - Date.now() <  fiveDays);
        // assert.ok(deletedAfter > Date.now());
        return recoveryQuorum.delegates.call(delegateList[3]);
      }).then((delegate3) => {
        const deletedAfter =  delegate3[delegateDeletedAfter].toNumber()*1000
        assert.ok(deletedAfter - Date.now() <  fiveDays);
        // assert.ok(deletedAfter > Date.now());
        done();
      }).catch(done);
    });

    it("Next, the attacker can propose a new userKey", (done) => {
      // console.log(`They propose changing to ${accounts[16]}`);
      recoverableController.signUserKeyChange(accounts[16], {from: user1}).then((result) => {
        assert.ok(result !== null);
        return recoverableController.proposedUserKey();
      }).then((proposedUserKey) => {
        assert.equal(proposedUserKey, accounts[16]);
        done();
      }).catch(done);
    });


    it("With the clock ticking, 3 of the 4 delegates intervene to set the userKey to a new one belonging to the rightful owner .", (done) => {
      // console.log(`The new owner should be ${user2}`);
      recoveryQuorum.signUserChange(user2, {from: delegateList[0]}).then((result) => {
        assert.ok(result != null);
        return recoveryQuorum.signUserChange(user2, {from: delegateList[1]})
      }).then((result) => {
        assert.ok(result != null);
        // this should be the last signature we need
        return recoveryQuorum.signUserChange(user2, {from: delegateList[2]})
      }).then((result) => {
        assert.ok(result != null);
        done();
      }).catch(done);
    });

    it("The userKey has been changed to the rightful owner's new key.", (done) => {
      recoverableController.userKey.call().then((userKey) => {
        assert.equal(userKey, user2, "User key in controller should have been updated.");
        // console.log(`3 of 4 delegates have signed, and the new owner is now ${userKey}`);
        done();
      }).catch(done);
    });

    it("And the controller's proposedUserKey has been changed to the rightful owner's new key.", (done) => {
      recoverableController.proposedUserKey.call().then((proposedUserKey) => {
        assert.equal(proposedUserKey, '0x0000000000000000000000000000000000000000');
        // console.log(`And the proposedUserKey is reset to ${proposedUserKey}`);
          done();
      }).catch(done);
    });
  });
});
