pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/SafeERC20.sol';

/**
 * @title SkaraEconomyDriver
 * @dev handles the blockchain-related game economics.
 */
contract SkaraEconomyDriver{
  using SafeMath for uint256;
  
  address public skaraWallet; 

  event TransferAndBurn(uint256 transfered, uint256 burned);

  function SkaraEconomyDriver(address _skaraWallet) public {
    skaraWallet = _skaraWallet;
  }
  
  /**
    * @dev Burns half of the _value tokens and transfers the rest to skara wallet
    * @param _value The total amount of token.
  */
  function transferAndBurn(BurnableToken token, uint256 _value) public {
    require(_value > 1); //greater than 2 so can be split
    uint256 half = _value.div(2);
    uint256 rest = _value.sub(half);

    SafeERC20.safeTransfer(token, skaraWallet, rest); //transfer the rest
    token.burn(half);

    TransferAndBurn(_value, half);
  }

}

