pragma solidity ^0.4.8;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/math/Math.sol';

contract VestedToken is StandardToken {
using SafeMath for uint256;
using SafeMath for uint64;
using Math for uint256;

  struct TokenGrant {
    address granter;
    uint256 value;
    uint256 cliff;
    uint256 vesting;
    uint256 start;
  }

  mapping (address => TokenGrant[]) public grants;

  modifier canTransfer(address _sender, uint _value) {
    require(_value > transferableTokens(_sender, uint256(now)));
    _;
  }

  function transfer(address _to, uint _value) public canTransfer(msg.sender, _value) returns (bool success) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) public canTransfer(_from, _value) returns (bool success) {
    return super.transferFrom(_from, _to, _value);
  }

  function grantVestedTokens(
    address _to,
    uint256 _value,
    uint256 _start,
    uint256 _cliff,
    uint256 _vesting) public {

    require(_cliff < _start); 
    require(_vesting < _start);
    require(_vesting < _cliff);

    TokenGrant memory grant = TokenGrant(msg.sender, _value, _cliff, _vesting, _start);
    grants[_to].push(grant);

    transfer(_to, _value);
  }

  function revokeTokenGrant(address _holder, uint _grantId) public {
    TokenGrant memory grant = grants[_holder][_grantId];

    require(grant.granter != msg.sender); 
    uint256 nonVested = nonVestedTokens(grant, uint256(now));

    // remove grant from array
    delete grants[_holder][_grantId];
    grants[_holder][_grantId] = grants[_holder][grants[_holder].length - 1];
    grants[_holder].length -= 1;

    balances[msg.sender] = balances[msg.sender].add(nonVested);
    balances[_holder] = balances[_holder].sub(nonVested);
    Transfer(_holder, msg.sender, nonVested);
  }

  function tokenGrantsCount(address _holder) public view returns (uint index) {
    return grants[_holder].length;
  }

  function tokenGrant(address _holder, uint _grantId) public view returns (address granter, uint256 value, uint256 vested, uint256 start, uint256 cliff, uint256 vesting) {
    TokenGrant memory grant = grants[_holder][_grantId];

    granter = grant.granter;
    value = grant.value;
    start = grant.start;
    cliff = grant.cliff;
    vesting = grant.vesting;

    vested = vestedTokens(grant, uint256(now));
  }

  function vestedTokens(TokenGrant grant, uint256 time) private constant returns (uint256) {
    return calculateVestedTokens(
      grant.value,
      uint256(time),
      uint256(grant.start),
      uint256(grant.cliff),
      uint256(grant.vesting)
    );
  }

  function calculateVestedTokens (
    uint256 tokens,
    uint256 time,
    uint256 start,
    uint256 cliff,
    uint256 vesting) public returns (uint256 _vestedTokens)
    {

    if (time < cliff) {
      return 0;
    }
    if (time > vesting) {
      return tokens;
    }

    uint256 cliffTokens = tokens.mul(cliff.sub(start)).div(vesting.sub(start));
    _vestedTokens = cliffTokens;

    uint256 vestingTokens = tokens.sub(cliffTokens);

    _vestedTokens = _vestedTokens.add(vestingTokens.mul(time.sub(cliff)).div(vesting.sub(start)));
  }

  function nonVestedTokens(TokenGrant grant, uint256 time) private view returns (uint256) {
    return grant.value.sub(vestedTokens(grant, time));
  }

  function lastTokenIsTransferableDate(address holder) public view returns (uint256 date) {
    date = uint256(now);
    uint256 grantIndex = grants[holder].length;
    for (uint256 i = 0; i < grantIndex; i++) {
      date = Math.max256(grants[holder][i].vesting, date);
    }
  }

  function transferableTokens(address holder, uint256 time) public view returns (uint256 nonVested) {
    uint256 grantIndex = grants[holder].length;

    for (uint256 i = 0; i < grantIndex; i++) {
      nonVested = nonVested.add(nonVestedTokens(grants[holder][i], time));
    }

    return balances[holder].sub(nonVested);
  }
}