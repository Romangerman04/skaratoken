pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/TokenVesting.sol';

/**
 * @title VestingManager
 * @dev manages the addresses whose tokens should be vested before transfer
 * with custom cliff and vesting time
 */

contract VestingManager is Ownable {
  
  event TokenVestingCreated(address beneficiary, uint256 duration, address vestingContract);

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

  function addVestingConfig(address who, uint256 _cliff, uint256 _duration, bool _revocable) public onlyOwner {
    VestingConfig memory config = VestingConfig(_cliff,  _duration,  _revocable);
    vestingConfigs[who] = config;
  }

  function createTokenVesting() public onlyVester returns(TokenVesting) {
    VestingConfig storage config = vestingConfigs[msg.sender];
    TokenVesting vesting = new TokenVesting(msg.sender, startVesting, config.cliff, config.duration, config.revocable);
    vestings[msg.sender] = vesting;
    TokenVestingCreated(msg.sender, config.duration, vesting);

    return vesting;
  }

  function hasTokenVesting(address who) public view returns(bool) {
    return vestingConfigs[who].cliff != 0;
  }

  function getVestingAddress(address who) public view returns(TokenVesting) {
    return vestings[who];
  }
}