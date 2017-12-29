pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import '../../contracts/Bonificated.sol';


contract BonificatedCrowdsaleTest is Crowdsale, Bonificated{

  function BonificatedCrowdsaleTest (
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _bonusStart,
    uint256 _bonusDuration,
    uint256 _startBonus
  ) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    Bonificated(_bonusStart, _bonusDuration, _startBonus)
  {
  }

}
