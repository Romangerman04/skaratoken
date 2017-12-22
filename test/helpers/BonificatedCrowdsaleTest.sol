pragma solidity ^0.4.18;


import '../../contracts/BonificatedCrowdsale.sol';


contract BonificatedCrowdsaleTest is BonificatedCrowdsale {

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
    BonificatedCrowdsale(_bonusStart, _bonusDuration, _startBonus)
  {
  }

}
