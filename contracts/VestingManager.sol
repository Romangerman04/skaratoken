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

  mapping(address => VestingConfig) vestingConfigs; 
  mapping(address => TokenVesting) vestings; 

  function addVestingConfig(address beneficiary, uint256 _cliff, uint256 _duration, bool _revocable) public onlyOwner {
    _addVestingConfig(beneficiary, _cliff, _duration, _revocable);
  }

  function _addVestingConfig(address beneficiary, uint256 _cliff, uint256 _duration, bool _revocable) internal {
    VestingConfig memory config = VestingConfig(_cliff,  _duration,  _revocable);
    vestingConfigs[beneficiary] = config;
  }


  function createTokenVesting(address beneficiary) public onlyVester returns(TokenVesting) {
    VestingConfig storage config = vestingConfigs[beneficiary];
    TokenVesting vesting = new TokenVesting(beneficiary, startVesting, config.cliff, config.duration, config.revocable);
    vestings[beneficiary] = vesting;
    TokenVestingCreated(beneficiary, config.duration, vesting, vesting.owner());

    return vesting;
  }

  function hasTokenVesting(address beneficiary) public view returns(bool) {
    return vestingConfigs[beneficiary].cliff != 0;
  }

  function getVestingAddress(address beneficiary) public view returns(TokenVesting) {
    return vestings[beneficiary];
  }
}