# Linter Summary

Linting was performed using [Solium](https://github.com/duaraghav8/Solium) on the unchanged proxy repository code.

The default Solium linter options were used, which correspond to the [official Solidity style guide](http://solidity.readthedocs.io/en/develop/style-guide.html#).

Output was generated using both the `gcc` and `pretty` options.

The errors were reviewed, and all were related to whitespace in some form.

__Recommendation:__ None of the errors or warnings suggest a significant issue for security purposes, but the use of a linter during standard testing is encouraged. This will help to improve the readability and maintainability of the code. 

The following error and warning counts were found:

## UportRegistry.sol

1 error, 11 warnings found.

## IdentityFactory.sol

5 warnings found.

## IdentityFactoryWithRecoveryKey.sol

5 warnings found.

## Lib1.sol

5 errors, 4 warnings found.

## Owned.sol

3 errors, 6 warnings found.

## Proxy.sol

1 warning found.

## RecoveryQuorum.sol

28 errors, 30 warnings found.

## RecoverableController.sol

11 errors, 13 warnings found.
