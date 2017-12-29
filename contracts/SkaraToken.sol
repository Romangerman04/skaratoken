pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';


/**
 * @title SkaraToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a crowdsale contract.
 */
contract SkaraToken is MintableToken, BurnableToken {

  string public constant name = "Skara Token";
  string public constant symbol = "SKT";
  uint8 public constant decimals = 18;
  
  function SkaraToken() public {
  }
  
  
}

