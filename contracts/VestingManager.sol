pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/TokenVesting.sol';

/**
 * @title VestingManager
 * @dev manages the addresses whose tokens should be vested before transfer
 * with custom cliff and vesting time
 */

contract VestingManager is Ownable {
  
  event TokenVestingCreated(address beneficiary, uint256 duration, address vestingContract, address owner);

  uint256 startVesting;
  uint256 investmentLow; 
  uint256 cliffLow;
  uint256 durationLow; 
  uint256 investmentMedium;
  uint256 cliffMedium;
  uint256 durationMedium; 
  uint256 investmentHigh; 
  uint256 cliffHigh;
  uint256 durationHigh; 

  modifier onlyVester() {
    require(hasTokenVesting(msg.sender));
    _;
  }

  function VestingManager(uint256 _startVesting ) public {
    startVesting = _startVesting;
  }

  struct VestingConfig {
      uint256 cliff;
      uint256 duration;
      bool revocable;
  }

  mapping(address => VestingConfig) customVestingConfigs; 
  mapping(uint256 => VestingConfig) fixedVestingConfigs; 
  mapping(address => TokenVesting) vestings; 

  function setupFixedVestings(
    uint256 _investmentLow, 
    uint256 _cliffLow, 
    uint256 _durationLow, 
    uint256 _investmentMedium, 
    uint256 _cliffMedium, 
    uint256 _durationMedium, 
    uint256 _investmentHigh, 
    uint256 _cliffHigh, 
    uint256 _durationHigh
  ) internal {

    investmentLow = _investmentLow; 
    cliffLow = _cliffLow; 
    durationLow = _durationLow;
    investmentMedium = _investmentMedium;
    cliffMedium = _cliffMedium; 
    durationMedium = _durationMedium;
    investmentHigh = _investmentHigh;
    cliffHigh = _cliffHigh; 
    durationHigh = _cliffHigh; 
  }

  function addVestingConfig(address beneficiary, uint256 _cliff, uint256 _duration, bool _revocable) public onlyOwner {
    _addVestingConfig(beneficiary, _cliff, _duration, _revocable);
  }

  function _addVestingConfig(address beneficiary, uint256 _cliff, uint256 _duration, bool _revocable) internal {
    VestingConfig memory config = VestingConfig(_cliff,  _duration,  _revocable);
    customVestingConfigs[beneficiary] = config;
  }


  function createTokenVesting(address beneficiary) public onlyVester returns(TokenVesting) {
    VestingConfig storage config = customVestingConfigs[beneficiary];
    TokenVesting vesting = new TokenVesting(beneficiary, startVesting, config.cliff, config.duration, config.revocable);
    vestings[beneficiary] = vesting;
    TokenVestingCreated(beneficiary, config.duration, vesting, vesting.owner());

    return vesting;
  }

  function createTokenVestingFromInvestment(address beneficiary, uint256 investment) public onlyVester returns(TokenVesting) {
    VestingConfig storage config = customVestingConfigs[beneficiary];
    TokenVesting vesting = new TokenVesting(beneficiary, startVesting, config.cliff, config.duration, config.revocable);
    vestings[beneficiary] = vesting;
    TokenVestingCreated(beneficiary, config.duration, vesting, vesting.owner());

    return vesting;
  }

  function hasTokenVesting(address beneficiary) public view returns(bool) {
    return customVestingConfigs[beneficiary].cliff != 0;
  }

  function getVestingAddress(address beneficiary) public view returns(TokenVesting) {
    return vestings[beneficiary];
  }
}