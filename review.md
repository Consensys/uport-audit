# 1 - Table of Contents

<!-- TOC depthFrom:1 depthTo:2 withLinks:1 updateOnSave:1 orderedList:0 -->

- [1 - Table of Contents](#1-table-of-contents)
- [2 - Introduction](#2-introduction)
	- [2.1 Audit Goals](#21-audit-goals)
	- [2.2 Source Code](#22-source-code)
	- [2.3 Documentation](#23-documentation)
	- [2.4 Dynamic Testing](#24-dynamic-testing)
- [3 - General Findings](#3-general-findings)
	- [3.1 Critical](#31-critical)
	- [3.2 Major](#32-major)
	- [3.3 Medium](#33-medium)
	- [3.4 Minor](#34-minor)
- [4 Detailed Solidity Review Findings](#4-detailed-solidity-review-findings)
	- [4.1 UportRegistry.sol](#41-uportregistrysol)
	- [4.2 IdentityFactory.sol](#42-identityfactorysol)
	- [4.3 IdentityFactoryWithRecoveryKey.sol](#43-identityfactorywithrecoverykeysol)
	- [4.4 Owned](#44-owned)
	- [4.5 Proxy.sol](#45-proxysol)
	- [4.6 RecoverableController](#46-recoverablecontroller)
	- [4.6 RecoveryQuorum](#46-recoveryquorum)
- [5 Test Coverage Analysis](#5-test-coverage-analysis)
	- [5.1 General Discussion](#51-general-discussion)
- [Appendix 1 - Audit Participants](#appendix-1-audit-participants)
- [Appendix 2 - Terminology](#appendix-2-terminology)
	- [A.2.1 Coverage](#a21-coverage)
	- [A.2.2 Severity](#a22-severity)
- [Appendix 3 - Framework Components and Concepts](#appendix-3-framework-components-and-concepts)
	- [A.3.1 Proxy](#a31-proxy)
	- [A.3.2 Registry](#a32-registry)
- [Appendix 4 - Audit Details](#appendix-4-audit-details)
	- [A.4.1 File List](#a41-file-list)
	- [A.4.2 Line Count](#a42-line-count)
	- [A.4.3 File Signatures](#a43-file-signatures)
- [Appendix 4 - Test Battery Results](#appendix-4-test-battery-results)

<!-- /TOC -->



# 2 - Introduction

From March 4th through April 6th of 2016, ConsenSys conducted an internal security
audit of the uPort framework authored by the uPort team within ConsenSys.  The findings
of this audit are presented here in this document.

## 2.1 Audit Goals

### 2.1.1 Security

This audit focused on identifying security related issues within each
contract and within the system of contracts.


### 2.1.2 Sound Architecture

This audit evaluates the architecture of this system through the lens of
established smart contract best practices and general software best practices.

### 2.1.3 Code Correctness and Quality

This audit includes a full review of the contract source code.  The primary
areas of focus include:

* Correctness (does it do was it is supposed to do)
* Readability (How easily it can be read and understood)
* Sections of code with high complexity
* Identification of antipatterns
* Quantity and quality of test coverage



## 2.2 Source Code

The code being audited was from the [**uport-proxy** repository](https://github.com/uport-project/uport-proxy/tree/5979d3f121b5b89e58d6712d442f36750d8e37fd) under the **uport-project** github account.

https://github.com/uport-project/uport-proxy

The state of the source code at the time of the audit can be found under the commit hash `5979d3f121b5b89e58d6712d442f36750d8e37fd` which was tagged as `Merge branch 'recoverykey'`.

At a later point, an additional [**uport-registry** repository](https://github.com/uport-project/uport-registry/tree/2f64fc0410d5d3946b71d47378fada57d919c8be) was added to the review scope, again from the **uport-project** github account.

The state of this source code at the time of the audit can be found under the commit hash `2f64fc0410d5d3946b71d47378fada57d919c8be`.

Further details may be found in Appendix 4.

## 2.3 Documentation

The following documentation was available to the review team:

* The [February 2017 whitepaper](http://whitepaper.uport.me/uPort_whitepaper_DRAFT20170221.pdf)
	* This documentation was not originally provided to the review team, who initially were working from the [October 2016 whitepaper](http://whitepaper.uport.me/uPort_whitepaper_DRAFT20161020.pdf).
* The  [README](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/README.md) file for the Proxy repository
	* The Proxy README also contained a link to "[Proxy contracts and metatransactions with applications](https://docs.google.com/document/d/1fq0B0T5d0uTJM9rwcT0u2UUCPWzUSYx7GSvZidWVghI)".
* The [README](https://github.com/uport-project/uport-registry/tree/2f64fc0410d5d3946b71d47378fada57d919c8be/README.md) file for the Registry repository

## 2.4 Dynamic Testing

### Pre-existing tests

The pre-existing tests for https://github.com/uport-project/uport-proxy/ were executed using the truffle framework, run against contracts deployed on a local instance of testrpc.  There were no pre-existing tests available for https://github.com/uport-project/uport-registry/.

Test results of the pre-existing test battery are available in Appendix 5.

### Additional testing

In addition to the Uport teams tests, the review team also wrote additional tests in order to explore possible attack vectors, and better understand the contract interactions.

# 3 - General Findings

This section discusses general issues that apply to the contract (and test) code base. These issues are primarily related to architecture, security assumptions and other high level design decisions, and are essential to a thorough security review. Realizing that these decisions are made as part of a set of trade offs, the uPort team may decide not to take action on all of our findings. They should however clarify the rationale for such decisions.

## 3.1 Critical

No bugs or security vulnerabilities were found to be directly exploitable, and thus critical.

## 3.2 Major

### 3.2.1 Proxy funds at risk given user key compromise

The security model assumes that the user key can never be compromised, only lost.  If this assumption is violated then the device of this Smart Contract System (SCS) is completely compromised.

In the event of a key compromise, such as could result from user-protection override on a stolen device, all user funds held in the proxy are immediately at risk. Identity theft and impersonation also become temporarily possible.

#### Recommendations

1. Consider improving the security model by removing of the assumption that the user key can never be compromised but only lost.

	For example, the `RecoverableController.forward()` function could restrict withdrawal of funds a maximum amount per time period. This maximum could be set by uPort upon creation, and/or modified by the user afterwards. The benefits of such changes should be weighed against the cost of adding complexity to the contract system.

	An alternative approach, which would avoid additional complexity could be to encourage users to store funds in a multi-sig wallet in which the proxy contract is one of several owners.

2. The following features can be added to the mobile application. These features neither improve the contract security model, nor add complexity to the contract system.  Instead, these mobile application features directly help uPort meet the assumptions put in place by the contract security model.

	* uPort application user password
	* password required again at uPort contract operation
	* challenge/response requiring user to supply an application-known secret at contract operation
	* NOTE: most 2FA solutions are rendered invalid if a device is compromised

 3. The following restrictions should also be made clear to users and developers:

	* uPort security model is only supported via our mobile application library
	* uPort contracts are not to be used outside of this environment
	* jailbroken iOS devices render uPort application security model insecure
	* allowing external application installation on Android (typical developer setting) renders model insecure

4. The following attack vectors should be completely explored from a white hat perspective:
	* key management of iOS and Android mobile applications given full disassembly manipulation capabilities
	* application placed onto stolen device (Android in development mode, jailbroken iOS) to extract user key


### 3.2.2 The `userKey` appears is extremely powerful

Severity: **Medium**

The `userKey` has sole access to call on the following functions

* `forward`
* `signRecoveryChange()`
* `signControllerChange()`
* `signUserKeyChange()`

The design of the 3 `sign__Change()` functions make it such that an attacker who gains access to the userKey can have full ownership of the proxy contract as soon as the `longTimeLock` period has passed (suggested is 3 days).

Thus, if the userKey is stolen AND the rightful owner no longer has access to it (ie. stolen phone), the only way to prevent a complete and permanent theft of the proxy contract is for a majority of delegates to agree on a new `proposedUserKey`  before the end of the `longTimeLock` period.

Even if this is done in time, the new `userKey` will still need to pass `0x0` before the end of the `longTimeLock` period. This allows little margin for error.

An implicit design assumption is that uPort will be able to coordinate action by a sufficient number of delegates to return the Proxy its rightful owner within the `longTimeLock` period, and that the owner could cancel any pending changes from calls the attacker had made to `signRecoveryChange()`, `signControllerChange()`, `signUserKeyChange()`.

#### Recommendation

uPort's recovery features represent significant improvement over the status quo of complete dependence on the secure ownership of a single private key, these features also encourage a different set of user behaviors and expectations.

No changes are recommended to the contract system here, but we wish to underscore the importance of the surrounding systems. Particularly important is the security of mobile applications, and optimal communication with delegates to ensure the correct required actions are taken in a timely manner.

### 3.2.3 The `recoveryKey` is extremely powerful

Severity: **Medium**

Similar to the `userKey`, the `recoveryKey` has sole access to call on the following functions:
	    - `changeRecoveryFromRecovery()`
	    - `changeUserKeyFromRecovery()`

Thus, a majority of delegates cannot be stopped from changing the `userkey`. The advantage is that `userkey` loss/hack appears to always be stoppable by delegates if they act within the longTimeLock.

The disadvantage is that a majority of malicious or compromised delegates cannot be stopped from "destroying" an identity by forcibly changing the `userkey`.

According to the `IdentityFactoryWithRecoveryKey.sol` contract, there is an expectation for use cases in which this key would not be controlled by a quorum. In that case, the `recoveryKey` is even more powerful than the `userKey`, and would make it possible to steal the proxy contract permanently and immediately. (It is now our understanding that the `recoveryKey` is never intended to be a non-contract account, and this factory contract will not be used.)

#### Recommendations

Take reasonable steps to ensure that a `recoveryKey` never belongs to a non-contract account.

Carefully design the guidance provided to the user related to add delegate accounts. Possible configurations to prevent account take over by malicious delegates include:

* Providing the user with their own delegate key. It could be printed and stored offline as a mnemonic.
* The percentage of delegate signatures required could be effectively increased to greater than 50% +1, by adding “non-existent keys” such as `0x0000...` to the delegate list.

## 3.3 Medium

### 3.3.1 Lack of documentation

The review was made more difficult by a lack of documentation clarifying the reasoning and assumptions made during the design process.

#### Recommendation

Along with the whitepaper, mobile security design documentation should be created for both the Android and iOS applications. These documents should outline software libaries, and operating system specific technologies relied upon for keychain management and security.

### 3.3.2 Use an exact and consistent version of Solidity compiler

Contracts in the proxy repository currently specify any compiler version above 0.4.4, below 0.5.0.

		pragma solidity ^0.4.4;

In addition, the registry contract uses a different pragma from the other files. All files should use the same compiler version unless there is a clear reason, and comments or documentation explaining why.

#### Recommendation

Fix on a specific version, at minimum 0.4.9, as versions up to 0.4.10 include many bug fixes.


### 3.3.3 Protect users against known paths to "bricking" the contract system

There are many ways in which the contract system could be misused, either by user error, or as the result of social engineering.

Protecting the user against all known ways they can change their setup (with controller/quorum/userKey, etc) is not possible, and some of this protection is left to the front-end. However, there are scenarios where it is cheap in terms of gas, and obvious wrong choices that the smart SCS can enforce.

For example, changing the Proxy's owner to itself should could be prevented by slightly modifying the transfer function to:

```
function transfer(address _owner) onlyOwner {
	if (_owner == address(this)){
    	owner = _owner;
	}
}
```

The rest of the Ethereum ecosystem is unknown, but the smart contracts have relative knowledge about its own threat model, and it would be cheap to implement.

### 3.3.4 Prevent invalid contract inputs to the constructors

Severity: **Medium**

There are many scenarios where intentionally incorrect inputs can lead to complete "bricking" the contract system.

This mostly occurs during constructors that don't have any balances or checks. Notably the recovery quorum definitely could result in screw ups. Or examples where contracts reference other contracts that it shouldn't really be capable of doing. eg: doing a transfer on the proxy to the proxy itself. Which means that the "controller" is now the proxy as well. This bricks the identity. At minimum I would recommended that smart contracts should at least protect from obvious bricks, like setting ownership to itself.

#### Recommendation:

In general, this is a subjective choice: should the contract protect the users to some extent, or should the front-end do this?

### 3.3.6 Test procedures restricted to testrpc

The truffle.js configuration files contains only the default settings for the `development` network, which suggests that the test suite has only been run on `testrpc`.

#### Recommendation

For the sake of completeness, also run tests on the Ropsten or Kovan test networks.

### 3.3.5 Absence of assertion guards and emergency circuit breakers

There are no [assert guards](https://github.com/ConsenSys/smart-contract-best-practices/blob/b485067ece502e683b80b9a584e459e1096bf8cc/README.md#assert-guards) in the contract system to automatically identify when a contract is in an invalid state.

Similarly there is no ability to manually halt the Controller or Proxy or Quorum operations upon compromise via a [circuit breaker](https://github.com/ConsenSys/smart-contract-best-practices/#circuit-breakers-pause-contract-functionality).

#### Recommendation

We recognize that such additional fail safe features would come at the cost of added complexity.  Consider implementing a circuit breaker type fail safe, or document the rationale for not doing so.

## 3.4 Minor

### 3.4.1 On-chain visibility of state variables

All variables in the contract system have been made `public`. For example in [RecoverableController.sol](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoverableController.sol#L5-L20):

```
contract RecoverableController {
    uint    public version;
    Proxy   public proxy;

    address public userKey;
    address public proposedUserKey;
    uint    public proposedUserKeyPendingUntil;

    address public recoveryKey;
    address public proposedRecoveryKey;
    uint    public proposedRecoveryKeyPendingUntil;

    address public proposedController;
    uint    public proposedControllerPendingUntil;

    uint    public shortTimeLock;// use 900 for 15 minutes
    uint    public longTimeLock; // use 259200 for 3 days
```

There are no known risks to this, however obscuring state variables is a more conservative approach.

#### Recommendation

Provide documentation



# 4 Detailed Solidity Review Findings

## 4.1 UportRegistry.sol

Source File: [`contracts/UportRegistry.sol`](https://github.com/uport-project/uport-registry/tree/2f64fc0410d5d3946b71d47378fada57d919c8be/build/contracts)

### 4.1.1 The Registry code should be tested alongside the rest of the contract system

Severity: **Major**

The advantages of maintaining the Registry contract in a separate repository are not immediately apparent. Regardless of the motivation, the actual Registry code can and should be tested against the contracts in the Proxy repository and vice versa.

#### Recommendation

Use git's [submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) functionality to synchronize the Registry contract to the Proxy repository for testing.

### 4.1.2 Only one IPFS hash is tracked

Severity: **Minor**

The registry only supports tracking a single hash for each proxy, meaning that any updates to the blob mean having to rebuild the whole blob. If at some point, the registry is used for thousands of objects, attribute updates could become very cumbersome. There may also be race conditions. If it is supposed to only add info the blob, but you update it from different apps, then, you might end up overwriting information.

#### Recommendation

None. This is an architecture and design decision, with inherent tradeoffs. We also note that the registry is versioned and upgradeable.


## 4.2 IdentityFactory.sol

* Source File: [`contracts/IdentityFactory.sol`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/IdentityFactory.sol)

### 4.2.1 `CreateProxyWithControllerAndRecovery()` does not create a registry entry

Severity: **Medium**

A typical factory pattern would be expected to register the newly created proxy with the uPort registry at the time of creation, but the `IdentityFactory` contract only logs an `IdentityCreated` event, and maps the new proxy to the address which called the `CreateProxyWithControllerAndRecovery()` function. Presumably this address would belong to uPort.

This mapping would also be overwritten if the same sender account is used to create another proxy.

## 4.3 IdentityFactoryWithRecoveryKey.sol

* Source File: [`contracts/IdentityFactoryWithRecoveryKey.sol`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/IdentityFactoryWithRecoveryKey.sol)

The same findings as the IdentityFactory contract apply here, as well as.

_Note: After reviews were made, we were notified by the uPort team that this contract is obsolete, we include our observations here for completeness._

### 4.3.1 Architectural alignment suggests name update and contract addition.

Balanced with the security of the system is the ability for the user to manage their private keys.  It is not clear the motivation for the recoveryKey indirection found in this contract.

Severity: **Minor**

Architectural alignment suggests addition of a contract.  A new `IdentityFactory` contract which does *not* overwrite msg.sender as the `recoveryKey` may be useful in a perceived absence of an increased attack surface.  There is an advantage - from the perspective of user key management - to retain the ability for the initiator of the identity creation to later directly recover the identity.  If there is a perceived increase attack surface - for example, an increased likelihood of private key compromise - then an explicit statement of why this architectural simplification has not been implemented would be helpful.


## 4.4 Owned

* Source File: [`contracts/Owned.sol`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/Ownsed.sol)

The `Owned.sol` contract is inherited by the Proxy, which is the only contract which is never intended to be upgraded. For this reason simplicity of code is essential.

### 4.4.1 Unused or superfluous code exists in the Owned Contract

Severity: **Minor**

This `Owned.sol` contract is more complex than other examples the review team have seen previously. In our experience `Owned.sol` typically only has an `onlyOwner()` modifier, a `transfer()` function, and a constructor function which sets the owner address.

One example is WeiFund's [Owned.sol contract ](https://github.com/weifund/weifund-contracts/blob/master/src/contracts/utils/Owned.sol) which has already undergone peer review through a bug bounty.

By contrast, the reviewed version of `Owned.sol` includes:

* `modifier onlyOwner()`
* `modifier ifOwner(address sender) `
* `function isOwner(address addr) public returns(bool)`

The `ifOwner()` modifier is not used in any of the reviewed contracts. Although it is used in the example contracts, it is called as `ifOwner(msg.sender)` making it redundant with the `onlyOwner()` modifier.

Similarly, the `isOwner()` function is only used by the `onlyOwner()` modifier, which could easily implement the control logic without needing to call on the `isOwner()` function.

#### Recommendation:

Simplify this contract by removing the `ifOwner()` and `isOwner()` functions.

### 4.4.2 The `onlyOwner()` modifier does not throw

Severity: **Minor**

The typical `onlyOwner()` modifier throws if called by someone other than the owner. Throwing seems to be a slightly more conservative approach. We recognize that there may be reasons related to gas usage for not throwing.

#### Recommendation

Update access control logic to `throw` when called by an unauthorized party, or provide comments clarifying the motivation the existing pattern.

## 4.5 Proxy.sol

* Source File: [`contracts/Proxy.sol`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/Proxy.sol)

The proxy contract is intended to be permanent. It cannot be upgraded without changing, and serves as the user's unique identifier.

### 4.5.1 The proxy cannot to directly create a contract

Severity: **Medium***

The ability to publish a contract from the proxy is lacking. This decision may be somewhat less 'future-proof', if the need to publish a contract _directly_ from the proxy is someday deemed highly valuable.

Alternatively, the Uport team may elect to provide a generalized contract factory, which could create contracts using data provided by the user, forwarded to it from the proxy contract.

#### Recommendation

Provide documentation outlining the motivation for this design decision, and the alternative contract creation methods available to uPort users. We acknowledge that this would add considerable complexity to the contract design, particularly given solidity currently lacks the necessary high level syntax.

### 4.5.2 Proxy should allow option to specify gas amount

Severity: **Medium**

Whilst external accounts can set the gas they want to use, uPort proxies by default forward all the gas. This could cause issues when a user would prefer to not forward all the gas.

#### Recommendation

Forward all the gas by default, but provide the option (if set) to send only a specific amount of gas.

<!-- QUESTION: I'm not sure this makes sense. Why would a sender include more gas than the proxy is allowed to forward? -->

### 4.5.3 Obsolete comment included in the code

Severity: **Medium**

The comments state that stack depth is an issue. This is however, no longer an issue due to changes with Spurious Dragon HF.

#### Recommendation:

Remove the comment.

### 4.5.4 Use of a magic number for `delegate.deletedAfter` value

Severity: **Minor**

The `delegate.deletedAfter` value is [set to `31536000000000`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoveryQuorum.sol#L24) in the constructor. There is no indication where this number comes from.

#### Recommendation:

At minimum the significance of this value should be clarified in a comment. Setting the value in a constant would be further improve readability.

## 4.6 RecoverableController

Source File: [`contracts/RecoverableController.sol`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoverableController.sol)

### 4.6.1 Controller should send value to the proxy on `selfdestruct`

Severity: **Medium**

Although the `RecoverableController` is not intended to hold ether funds, there is no way to prevent this if they are [forcibly sent](https://github.com/ConsenSys/smart-contract-best-practices#remember-that-ether-can-be-forcibly-sent-to-an-account).

When the `changeController()` calls `suicide(proposedController)`, funds are forcibly sent to the `proposedController` contract, which presumably would also not be designed to hold funds.

#### Recommendation

Change to `selfdestruct(proxy)`.


### 4.6.2 The `suicide()` function is deprecated

Severity: **Medium**

Both Solidity's `suicide()` function and the EVM's `SUICIDE` opcode have been deprecated and replaced with to `selfdestruct()` and `SELFDESTRUCT` respectively.

This change was made to Solidity in [late 2015](https://github.com/ethereum/solidity/commit/a8736b7b271dac117f15164cf4d2dfabcdd2c6fd). Refer to [EIP6](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-6.md) for the motivation.

The Uport codebase is likely to be highly visible within the community, and the effort required to align with this decision is minor.

This is especially pertinent in a context which uses contracts as identities.

#### Recommendation

Use `selfdestruct()`.


### 4.6.3 Inconsistent event logging

Severity: **Minor**

The `changeUserKey()` function logs an event, but the other `changeRecoveryKey()` and `changeController()` functions do not. Given how similar these functions are otherwise, there is no clear reason for this.

#### Recommendation

Log an event in all of these functions, or do not log an event in any of them, or add comments explaining the rationale.

### 4.6.4 Possible overflow with timeLocks and pendingUntil

Severity: **Medium**

The `timeLock` values (`longTimeLock` and `shortTimeLock`) are "configurable" and can cause overflow of `pendingUntil`on line [41]( https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoverableController.sol#L41), [53]( https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoverableController.sol#L53), and [65]( https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoverableController.sol#L65).

The impact of an overflow here is that a "signed key change" could be made permanent (does not expire).

The following is a possible (although somewhat contrived) scenario:

1. Users create their identities using some identity factory by going to a uPort website
2. If the uPort website is compromised silently, it could be made to invoke the factories with timeLocks that would cause overflow
3. User identities are then created without the "signed key change" expirations/protections that were designed in the `RecoveryController`.

Also, overflowing timeLocks can affect the instant add and removal of delegates in [`RecoveryQuorum`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoveryQuorum.sol#L76)


## 4.6 RecoveryQuorum

* Source File: [`contracts/RecoveryQuorum.sol`](https://github.com/uport-project/uport-proxy/blob/5979d3f121b5b89e58d6712d442f36750d8e37fd/contracts/RecoveryQuorum.sol)

### 4.6.1 Delegate membership ceiling should be enforced in constructor

Severity: **Medium**

The maximum number of delegates (15) is not enforced in the constructor nor directly in `replaceDelegates()`. As a result it appears vulnerable to a delegate replacement attack as an attacker, via a malicious call to `replaceDelegates()`, can increase the gas required in each operation that parses the `delegateAddresses[]` array.  These operations are `changeUserKey()` and `replaceDelegates()`.  This would allow an attacker who has gained possession of a user device to prevent the ability of the original user to recover their identity.  Upon closer inspection this is prevented in `addDelegate()`.  Adding enforcement earlier more completely aligns the mental model of the coder and auditer.

Additionally, adding enforcement of membership boundaries earlier reduces any impact of large inbound arrays in the case of compromise of user key.

#### Recommendation

Prevent the creation of a RecoveryQuorum contract with more than the maximum allowed number of delegates.


### 4.6.2 ChangeUserKey() should use delegateIsCurrent(), not delegateRecordExists()

Severity: **Medium**

It is non-intuitive, and seems possibly incorrect, that any delegate in any state can sign a `userKeyChange`.

However, we could not identify any vulnerabilities as a result.

### 4.6.3 The onlyUserKey modifier does not throw when called by another key

Severity: **Medium**

Similar to the discussion of the `Owned.sol` contracts `onlyOwner()` modifier.

Considering that Uport is subsidizing the cost of execution, this may be a better design approach to reduce gas usage.

#### Recommendation

Update access control logic to `throw` when called by an unauthorized party, or provide comments clarifying the motivation the existing pattern.


### 4.6.4 Functions which do not modify state should be `constant`

Severity: **Minor**

The `collectedSignatures()` and `neededSignatures()` and functions do not modify state, so applying the `constant` label would make sense.

#### Recommendation

Although the `constant` keyword does not have an impact on the bytecode output, we feel it is helpful for readability, and should be consistently applied to any functions which do not modify state.


### 4.6.5 The garbage collector function creates griefing vectors

Although the intent is to keep the delegates around who are earmarked to be deleted (`deletedAfter`), this can cause several issues.

##### 4.6.5.2 Garbage collector griefing: Max delegates (15) griefing. Can't add new delegates until after `longTimeLock`

Severity: **Medium**

If there are 15 delegates already, then one can't add new delegates until first waiting `longTimeLock` for other delegates to be removed. The check to add delegates is length of 15 in `delegateAddresses`, but the garbage collector only removes them after `longTimeLock`.

Similarly, if there's say 8 delegates, you can't remove all 8 and add new 8 ones. The last new delegate won't be added as it would hit the 15 delegate limit.

#### 4.6.5.3 Garbage collector griefing: compromised `userKey` can grief delegates & open temporary security hole

Severity: **Medium**

If the `userKey` is compromised, the attacker can opt to replace delegates with their attackers. In this scenario, after `replaceDelegates()` is called, the pre-existing honest delegates are still valid for the duration of the `longTimeLock` window, and can still change the `userKey`. However, they've been ear-marked to be deleted. If the `userKey` is then replaced, the new `userKey` can delete the compromised delegates, but not re-add the honest delegates during the `longTimeLock` window.

This is because, although the honest delegates are earmarked to be deleted, their record still exists and thus `addDelegate()` does not re-add/reset the honest delegates. So after the initial attack, after `longTimeLock`, the attackers will be gone, but ALSO the honest delegates.

During this time, there will be zero delegates, which creates a security hole. If the `userKey` is compromised during this period, then there are no delegates to protect them. After this initial `longTimeLock`, re-adding the honest delegates will take *another* `longTimeLock`.

#### 4.6.5.1 Garbage collector griefing: `replaceDelegates` needs to be called after `longTimeLock` to fully flush deleted delegates

Severity: **Minor**

In order to fully flush delegates from `delegateAddresses` after their `deletedAfter` is done, then `replaceDelegates()` need to be called again, in order to get to the garbage collector that appropriately removes the delegates from `delegateAddresses` and destroys the records.

This is minor, since it's a stylistic change, because you want to essentially run the garbage collector, but you have to do this by calling `replaceDelegates()`.

#### Recommendations to address griefing issues

A few possible fixes are evident which could address this:

1. Accept, and document that the function maximum number of delegates is 7.
2. Adjust the logic to not count newly pending delegates towards the maximum.

The latter option would likely have a much greater impact on the level of complexity.

### 4.6.6 No ability to call `changeRecoveryFromRecovery()`

Severity: **Medium**

The `RecoveryQuorum` has no code which calls `RecoverableController.changeRecoveryFromRecovery()`. This suggests that the function may be solely for testing purposes.

#### Recommendation

Remove the `changeRecoveryFromRecovery()` function from RecoverableController.sol.


#### 4.6.7 Constructor should use `addDelegate()` to enforce duplicate & length checks.

Severity: **Medium**

When replacing delegates, there are checks to ensure that duplicates are not added, as well including length checks. This is not included in the constructor and can cause issues, especially the concern about duplicate delegates.

#### Recommendation

Consider implementing these checks in the controller.

### 4.6.8 Signatures carry across delegate changes

Severity: **Medium**

Signing changes happen on the pretense of an existing security threat model. When delegates change, signatures remain valid unless explicitly revoked. A delegate might have wished to undergo more stringent review if their strength changes from say 1/7 to 1/3.


### 4.6.9 Computationally expensive operations should be measured

The `replaceDelegates` function performs a number of array manipulations, including `garbageCollect`, and has a wide range of potential gas cost depending on the state of the delegates.

#### Recommendation

Upper end usage should be documented. There should also be explicitly tests for "worst case" scenarios. A goal is to minimize the risk of the contract locking itself up, and understand when low block gas limits would start endangering the contract to be able to evaluate the severity and likelihood of such scenarios, and how large the margin of safety is.


### 4.6.10 Deleting a Delegate struct

This needs verification. (TODO: check if "solidity is able to delete a struct without reseting each value initially")

`delete delegates[delegateAddresses[i]];` seems like it should work here:

The generated bytecode from the compiler may also save some gas.

# 5 Test Coverage Analysis

Testing is implemented using the truffle framework.

Automated measurement was done using [SolCover](https://github.com/JoinColony/solcover).

The quality of test coverage was also assessed by inspection of the code.

## 5.1 General Discussion

Many of the tests require long promise chains of, which can be difficult to read.

Consider using the `async/await` pattern when useful. An example can be found [here](https://github.com/OpenZeppelin/zeppelin-solidity/pull/97)


### 5.2 IdentityFactory

Test File: [`test/identityFactory.js`](https://github.com/uport-project/uport-proxy/tree/5979d3f121b5b89e58d6712d442f36750d8e37fd/test/identityFactory.js)

Coverage: 100%

#### Test Output

    * ✓ Correctly creates proxy, controller, and recovery contracts (1226ms)
		* ✓ Created proxy should have correct code
		* ✓ Created controller should have correct code
		* ✓ Created recoveryQuorum should have correct code
		* ✓ Mapping should have the same address as event
    * ✓ Created proxy should have correct state
    * ✓ Created controller should have correct state (96ms)
    * ✓ Created ID should have the following behavior (9176ms)
		* ✓ Non delegate signs and the userKey shouldn't change
		* ✓ Non delegate signs and the collectedSigs shouldn't increment
		* ✓ Added delegate has the correct state
		* ✓ Pending delegate signs, collectedSigs shouldn't reflect delegate sig
		* ✓ Pending delegate signs, changeUserKey no effect while pendingDelegate
		* ✓ After timeLock period collectedSigs should reflect the vote
		* ✓ changeUserKey should effect userKey after delegate has waited
		* ✓ After the recovery, signatures reset
    * ✓ Created ID should have the following behavior (12355ms)
 		* ✓ collectedSigs is zero, pending delegate and votes don't count
		* ✓ User key shouldn't change because 2 votes are pending
		* ✓ collectedSigs is two because 2 of the 4 votes are pending
		* ✓ User key shouldn't change because delegate1 already signed
		* ✓ collectedSigs shouldn't change because delegate1 already signed
		* ✓ collectedSigs is 4 because of votes from delegates 2, 3, 5 and 6
		* ✓ User key shouldn't change because recoveryUser1 only has 1 vote
		* ✓ User key should change because recoveryUser2 has 3 votes
		* ✓ collectedSigs is only 2 because delegate 1's vote gets reset after recover
		* ✓ User key change request fails due to 2 votes (not enough)
		* ✓ User key change succeeds in face of adversarial delegate deletion

#### Coverage Notes:

    During validation of created identity behavior (specifically validation that
    added delegate has the correct state (lines 126-129), parameterization of
    quorum.delegates array assignments such that access indexer labels are
    "delegateProposedUserKey" *and* "delegatePendingUntil" is a suspicious
    implementation pattern as indexer labels are typically drawn from a
    strictly-typed non-repeatable set.

    A better alignment between the mental model of the programmer (code exercised)
    and auditer (documentation of test output) is desired.  For example on line 184,
    "pending delegate votes dont count yet" provides tighter alignment if replaced with
    "collected signatures does not meet threshold, pending delegate votes dont count".
    Additional improvements to align mental models between the source code and the documented
    test results are available on lines 190, 194, 193, 198, 200, 207, 212, 217, 223,
    227, and 234.


* Coverage Rating: **good**


### 5.2 IdentityFactoryWithRecoveryKey

* Test File: `test/identityFactoryWithRecoveryKey.js`

* Repository: https://github.com/uport-project/uport-proxy/tree/master/

* Coverage

    * ✓ Correctly creates proxy and controller (855ms)
		* ✓ Created proxy should have correct code
		* ✓ Created controller should have correct code
		* ✓ Created recoveryQuorum should have correct code
		* ✓ Mapping should have the same address as event
    * ✓ Created proxy should have correct state
    * ✓ Created controller should have correct state (92ms)

* Coverage Rating:


### 5.3 Owned

* Test File: `test/owned.js`

* Repository: https://github.com/uport-project/uport-proxy/tree/master/

* Coverage

    * ✓ Is owned by creator (58ms)
		* ✓ Owner should be owner
		* ✓ Non-owner should not be owner
    * ✓ Non-owner can't change owner (78ms)
		* ✓ Owner should not be changed
    * ✓ Owner can change owner (59ms)
		* ✓ Owner should be changed

* Coverage Rating: **good**

* Coverage Notes: simple interface makes


### 5.4 Proxy

* Test File: `test/proxy.js`

* Repository: https://github.com/uport-project/uport-proxy/tree/master/

* Test Output

    * ✓ Owner can send transaction (78ms)
    * ✓ Receives transaction (240ms)
    * ✓ Event works correctly (58ms)
    * ✓ Non-owner can't send transaction (79ms)
    * ✓ Should throw if function call fails

* Coverage Notes:

    A better alignment between the mental model of the programmer (code exercised)
    and auditor (documented test results) is desired.  For example on lines 41-42
    and 57-59 a plain language explanation of the assertions being validated will
    aid any reviewer or auditor.

		https://github.com/uport-project/uport-proxy/issues/5

Since proxy.sol is the highest priority, it should have much more tests, possibly even bordering on the paranoid.

		Potential tests include the following, as well as mixing combinations of them:

		* different owners, including an external account, owner is transferred to 0, owner is transferred to address of proxy itself, external owner transferred to a contract, a contract owner transferred to an external account
		* differentdestination like 0, the owner itself, the proxy itself
		* different value, including negative, and 1 wei
		* proxy's balance is <, =, and > than value
		* different data, including length 0, 1, 2, some intermediate length, some large length


* Coverage Rating: **good**


### 5.5 RecoverableController

* Test File: `test/RecoverableController.js`

* Repository: https://github.com/uport-project/uport-proxy/tree/master/

* Coverage

    * ✓ Correctly deploys contract (453ms)
    * ✓ Only sends transactions from correct user (338ms)
		* ✓ User1 should be able to send transaction
		* ✓ User2 should not be able to send transaction
    * ✓ Updates userKey as user (3345ms)
		* ✓ Only user can set the proposedUserKey
		* ✓ New user key should now be cued up
		* ✓ UserKey should not change until changeUserKey is called
		* ✓ Should still not have changed user key unless changeUserKey is called after shortTimeLock period
		* ✓ ChangeUserKey Should affect userKey after shortTimeLock period
    * ✓ Updates userKey as recovery (134ms)
		* ✓ Only user can call changeUserKeyFromRecovery
		* ✓ New user should immediately take affect
    * ✓ Updates recovery as user (5311ms)
		* ✓ Only user can call signRecoveryChange
		* ✓ New recovery key should now be cued up
		* ✓ recovery key should not change until changeRecovery is called
		* ✓ Should still not have changed recovery key unless changeRecovery is called after longTimeLock period
		* ✓ ChangeRecovery Should affect recoveryKey after longTimeLock period
    * ✓ Updates recoveryKey as recovery (166ms)
		* ✓ Only recovery key can call changeRecoveryFromRecovery
		* ✓ New recoveryKey should immediately take affect
    * ✓ Correctly performs transfer (5315ms)
		* ✓ Only user can set the proposedController
		* ✓ New controller should now be cued up
		* ✓ proxy should not change until changeController is called
		* ✓ Should still not have changed controller unless changeController is called after longTimeLock period
		* ✓ ChangeController Should affect proxy ownership after longTimeLock period

* Coverage Notes:

    A better alignment between the mental model of the programmer (code exercised)
    and auditer (documented test results) is desired.  For example in the messages
    above, what makes User1 distinct from User2?  These simple additions will aid
    any reviewer or auditer.

* Coverage Rating: **good**


### 5.6 RecoveryQuorum

* Test File: `test/recoveryQuorum.js`

* Repository: https://github.com/uport-project/uport-proxy/tree/master/

* Coverage

    * ✓ Correctly deploys contract (667ms)
		* ✓ Controller's recoverKey should be the RQ's address
		* ✓ RQ's controller var should be the controller's address
    * ✓ Non-delegate can't sign recovery (195ms)
		* ✓ only delegates should be able to add to the number of collectedSigs
    * ✓ delegate can sign recovery (260ms)
		* ✓ Authorized delegate should add to the number of collectedSigs
    * ✓ delegate can't sign recovery twice (224ms)
		* ✓ Delegate that already sign should not be able to sign again
    * ✓ Insufficient signatures can not recover controller user key (429ms)
		* ✓ should keep track of how many votes user2 has (1)
		* ✓ User key in controller should not have changed
		* ✓ should not have changed since called previously
    * ✓ Enough signatures can recover controller user key (749ms)
		* ✓ collected sigs should be reset after changeUserKey
		* ✓ User key in controller should have been updated
		* ✓ Signatures should reset after a user key recovery
		* ✓ Signatures should have reset after a user key recovery
    * ✓ Only controller user can add delegates to quorum (13577ms)
		* ✓ Random user should not be able to add additional delegates to quorum
		* ✓ Controller userKey should be able to add additional delegates to quorum
		* ✓ This delegate exists from contract creation
		* ✓ inits to 1million years
		* ✓ Trying to add existing delegate should affect nothing
    * ✓ Newly added delegate's signature should not count towards quorum yet (1007ms)
		* ✓ New delegate should have been added by user
		* ✓ Signatures should have reset after a user key recovery
		* ✓ Newly added delegates should not be able to add valid signature yet
		* ✓ Proposed user should be set
		* ✓ controller userKey should not change because these delegates are too new
    * ✓ Allows you to remove a delegate, and add them back many times (7720ms)
		* ✓ starts with delegates
		* ✓ current delegates are still there, but deletion pending
		* ✓ after waiting and garbageCollection they are gone
		* ✓ immediately they are back
		* ✓ doubling up should change nothing
		* ✓ pending delegates are deleted immediately
		* ✓ old delegates are gone, and the new ones are present
    * ✓ protected against gasLimit attack. WARNING: strange error if gas is overspent (4271ms)
		* ✓ only first 15 delegates made it in
		* ✓ enough gas was present to recover
    * ✓ protected against gasLimit attack. WARNING: strange error if gas is overspent (3937ms)
		* ✓ 15 delegates from contract creation
		* ✓ enough gas was present to recover

* Coverage Notes:

    A better alignment between the mental model of the programmer (code exercised)
    and auditer (documented test results) is desired.  For example on lines 79-104
    a plain language explanation of the assertions being validated will aid any
    reviewer or auditer.

    Addition of an attempt to create a Quorum with greater than the allowed number of
    delegates and the ability to replace

* Coverage Rating: **good**


### 5.7 Additional Coverage

* Test File: `test/uportProxyIntegration.js`

* Repository: https://github.com/uport-project/uport-proxy/tree/master/

* Coverage


    * ✓ Create proxy, controller, and recovery contracts (549ms)
    * ✓ Use proxy for simple function call (116ms)
    * ✓ Proxy can receive and send Eth (1106ms)
		* ✓ proxy should initially have no value
		* ✓ then proxy contract should have received 1.5ETH value
		* ✓ coinbase should have less (1.5ETH value + gas)
		* ✓ coinbase should have received 1.4ETH value
    * ✓ Do a social recovery and do another function call (414ms)
		* ✓ this delegate should have record in quorum
		* ✓ this delegate should not have a record in quorum
		* ✓ this delegate should also be in the delegateAddresses array in quorum
		* ✓ User key of recoverableController should have been updated
    * ✓ Measures gas used by controller + proxy (106ms)


* Coverage Notes:

Useful additional tests spanning multiple contracts in the uPort SCS.

* Coverage Rating: **good**


### 5.8 UportRegistry

* Test File: none

* Repository: https://github.com/uport-project/uport-registry/tree/master/

* Coverage

None available.

* Coverage Notes: none

* Coverage Rating: **untested**


# Appendix 1 - Audit Participants

Security audit was performed by ConsenSys team members Simon de la Rouviere,
John Mardlin, Joseph Chow and Bill Gleim.

# Appendix 2 - Terminology

## A.2.1 Coverage

Measurement of the degree to which the source code is executed by the test suite.

### A.2.1.1 untested

No tests.


### A.2.1.2 low

The tests do not cover some set of non-trivial functionality.


### A.2.1.3 good

The tests cover all major functionality.


### A.2.1.4 excellent

The tests cover all code paths.


## A.2.2 Severity

Measurement of magnitude of an issue.


### A.2.2.1 minor

Minor issues are generally subjective in nature, or potentially deal with
topics like "best practices" or "readability".  Minor issues in general will
not indicate an actual problem or bug in code.

The maintainers should use their own judgement as to whether addressing these
issues improves the codebase.


### A.2.2.2 medium

Medium issues are generally objective in nature but do not represent actual
bugs or security problems.

These issues should be addressed unless there is a clear reason not to.


### A.2.2.3 major

Major issues will be things like bugs or security vulnerabilities.  These
issues may not be directly exploitable, or may require a certain condition to
arise in order to be exploited.

Left unaddressed these issues are highly likely to cause problems with the
operation of the contract or lead to a situation which allows the system to be
exploited in some way.


### A.2.2.4 critical

Critical issues are directly exploitable bugs or security vulnerabilities.

Left unaddressed these issues are highly likely or guaranteed to cause major
problems or potentially a full failure in the operations of the contract.


# Appendix 3 - Framework Components and Concepts

## A.3.1 Proxy

Proxy contracts are a way of maintaining a persistent identifier/address on a system. The Proxy contract will interact with other smart contract and it has access control that allows the user to replace and rotate private keys while maintaining a persistent identfier.

A proxy contract is a minimal contract that has the ability to act as a standard Ethereum account, i.e. it can send value transactions, make function calls, and potentially create new contracts (which may require factories). The proxy contract has an "owner" address (which can be a contract) and the proxy contract will only send transactions when asked to do so by the owner.

The proxy contract design allows the uPort system to maintain a persistent address (the address of the proxy contract) while having the ability to swap out the owner contract to allow for more refined access control such as multisig and the ability to revoke and replace the private keys controlling the owner contract.

Since the proxy contract will send transactions to interact with other contracts those contracts can use standard access controls like:

```
if(msg.sender == proxyContractAddress){
  // do stuff
}
```

An example of a proxy contract design originally proposed by Peter Borah and extended by d11e9 is the following:

```
contract Owned {
	address owner;
	modifier onlyOwner(){ if (isOwner(msg.sender)) _ }
	modifier ifOwner(address sender) { if(isOwner(sender)) _ }

	function Owned(){
    	owner = msg.sender;
	}

	function isOwner(address addr) public returns(bool) { return addr == owner; }

	function transfer(address _owner) onlyOwner {
    	owner = _owner;
	}
}

contract Proxy is Owned {
	function forward(address destination, uint value, bytes data) onlyOwner {
    	destination.call.value(value)(data);
	}
}
```

* Primary Source Files:
    * `Proxy.sol`
* Contracts
    * `Proxy`

## A.3.2 Registry

The uPort registry is a single contract where uport identities can 'self-attest' to data about themselves. This is done by uploading a json object to IPFS, and then signing the corresponding IPFS address into the registry contract.

Right now they are focusing on

* Full Name
* Profile Picture

They intend to support the full [Schema.org Person schema](http://schema.org/Person). The Full Name and Profile Picture is stored in IPFS as a JSON structure that corresponds to the schema.org schema:

```
{
   "@context": "http://schema.org/",
   "@type": "Person",
   "name": "Christian Lundkvist",
   "image": [{"@type": "ImageObject",
             "name": "avatar",
             "contentUrl" : "/ipfs/QmUSBKeGYPmeHmLDAEHknAm5mFEvPhy2ekJc6sJwtrQ6nk"}]
}
```

and an IPFS hash of this structure is stored in the contract as a `bytes` structure.

* Primary Source Files:
    * `UportRegistry.sol`
* Contracts
    * `UportRegistry`

# Appendix 4 - Audit Details

## A.4.1 File List

The following source files were included in the audit.

https://github.com/uport-project/uport-proxy/tree/master/contracts

* IdentityFactory.sol
* IdentityFactoryWithRecoveryKey.sol
* Lib1.sol
* Owned.sol
* Proxy.sol
* RecoverableController.sol
* RecoveryQuorum.sol
* TestRegistry.sol

Later, it was determined that `IdentityFactoryWithRecoveryKey.sol`, `MetaTxController.sol`,
and `TestRegistry.sol` are obsolete.  Inclusion of the first two files in the repository
did consume audit time, unfortunately, prior to determination that they are obsolete.

After that, it was determined that an additional repository with a single contract and no
test drivers is part of the uPort SCS and as such needed to be considered in the scope of
this audit.

https://github.com/uport-project/uport-registry/tree/master/contracts

* UportRegistry.sol

## A.4.2 Line Count

The line counts of the files at the time of the audit was as follows.

* IdentityFactory.sol: 25
* IdentityFactoryWithRecoveryKey.sol: 24
* Lib1.sol: 16
* MetaTxController.sol: 48
* Migrations.sol: 21
* Owned.sol: 18
* Proxy.sol: 33
* RecoverableController.sol: 84
* RecoveryQuorum.sol: 114
* TestRegistry.sol: 15
* UportRegistry.sol: 23
* ================
* Total line count: 398

## A.4.3 File Signatures

The SHA256 hash of each files at the time of the audit was as follows.

https://github.com/uport-project/uport-proxy/tree/master/contracts

```
$ shasum -a 256 *
be24c584a6b31b26ae22ebb28dfbdb2787f181fc1d5f042436c228b32c0011ad  IdentityFactory.sol
bca42d1e44e6fe4ace8fc1ba1e0296c23604c55b00070f24acd600543bd98377  IdentityFactoryWithRecoveryKey.sol
a349584d5193cebea1a067db8a6150a4d5cff1018fef4c5c80f32b32c770f5cf  Lib1.sol
0326d0263dd6989820788483b0953f86f84179d52d3fbdf5d369d3de99e7401d  MetaTxController.sol
529333d601cfa6d7f5df786a32703002bfd23549850d16f12cbe9948fb5d1378  Migrations.sol
20fb5b8de62265fe660d151b9815ad4c662c27a693baefec53888092f2f7d47d  Owned.sol
43979b68d4d82ec65a7443fcc13e397a1419ed4a3b5cc7faa0adb4806a75f12e  Proxy.sol
2b8d5bf29d3143017b4568619cdfc5f2f811ab5c3383bbb7551fad437492937b  RecoverableController.sol
84abdccc49809ed5ce21087d85b7a2ca43a9f248f2b08575c9bc75f0bc96e0f8  RecoveryQuorum.sol
1eb8d75788152f3a44c949666be9ed3d5a6c864cf89c13794b356d4b3865f568  TestRegistry.sol
```

https://github.com/uport-project/uport-registry/tree/master/contracts

```
$ shasum -a 256 *
479c877e1714f0c699c4853444c638188f2c2140e23d37f1e094939d9ecb6e0e  UportRegistry.sol
```

# Appendix 4 - Test Battery Results

In order for the tests to succeed, `testrpc` was initiated with 25 accounts.

```
testrpc --accounts 25
```

Results from the pre-existing test battery are provided here for reference.

```
Compiling ./contracts/IdentityFactory.sol...
Compiling ./contracts/IdentityFactoryWithRecoveryKey.sol...
Compiling ./contracts/Lib1.sol...
Compiling ./contracts/MetaTxController.sol...
Compiling ./contracts/Migrations.sol...
Compiling ./contracts/Owned.sol...
Compiling ./contracts/Proxy.sol...
Compiling ./contracts/RecoverableController.sol...
Compiling ./contracts/RecoveryQuorum.sol...
Compiling ./contracts/TestRegistry.sol...


  Contract: RecoverableController
    ✓ Correctly deploys contract (453ms)
    ✓ Only sends transactions from correct user (338ms)
    ✓ Updates userKey as user (3345ms)
    ✓ Updates userKey as recovery (134ms)
    ✓ Updates recovery as user (5311ms)
    ✓ Updates recoveryKey as recovery (166ms)
    ✓ Correctly performs transfer (5315ms)

  Contract: IdentityFactory
    ✓ Correctly creates proxy, controller, and recovery contracts (1226ms)
    ✓ Created proxy should have correct state
    ✓ Created controller should have correct state (96ms)
    ✓ Created ID should have the following behavior (9176ms)
    ✓ Created ID should have the following behavior (12355ms)

  Contract: IdentityFactoryWithRecoveryKey
    ✓ Correctly creates proxy and controller (855ms)
    ✓ Created proxy should have correct state
    ✓ Created controller should have correct state (92ms)

  Contract: Owned
    ✓ Is owned by creator (58ms)
    ✓ Non-owner can't change owner (78ms)
    ✓ Owner can change owner (59ms)

  Contract: Proxy
    ✓ Owner can send transaction (78ms)
    ✓ Receives transaction (240ms)
    ✓ Event works correctly (58ms)
    ✓ Non-owner can't send transaction (79ms)
    ✓ Should throw if function call fails

  Contract: RecoveryQuorum
    ✓ Correctly deploys contract (667ms)
    ✓ Non-delegate can't sign recovery (195ms)
    ✓ delegate can sign recovery (260ms)
    ✓ delegate can't sign recovery twice (224ms)
    ✓ Insufficient signatures can not recover controller user key (429ms)
    ✓ Enough signatures can recover controller user key (749ms)
    ✓ Only controller user can add delegates to quorum (13577ms)
    ✓ Newly added delegate's signature should not count towards quorum yet (1007ms)
    ✓ Allows you to remove a delegate, and add them back many times (7720ms)
    ✓ protected against gasLimit attack. WARNING: strange error if gas is overspent (4271ms)
    ✓ protected against gasLimit attack. WARNING: strange error if gas is overspent (3937ms)

  Contract: Uport proxy integration tests
    ✓ Create proxy, controller, and recovery contracts (549ms)
    ✓ Use proxy for simple function call (116ms)
    ✓ Proxy can receive and send Eth (1106ms)
    ✓ Do a social recovery and do another function call (414ms)
    ✓ Measures gas used by controller + proxy (106ms)


  39 passing (1m)
```
