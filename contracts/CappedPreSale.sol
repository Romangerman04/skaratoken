pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';

/**
 * @title PreSale
 * @dev Manages a presale list of contributors with investment boundaries
 */
contract CappedPreSale is Ownable {
  uint256 presaleCap;
  uint256 presaleEnd;
  uint256 minInvestment;
  uint256 maxInvestment;

  function CappedPreSale(uint256 _presaleCap, uint256 _presaleEnd, uint256 _minInvestment, uint256 _maxInvestment) public {
    presaleCap = _presaleCap;
    presaleEnd = _presaleEnd;
    minInvestment = _minInvestment;
    maxInvestment = _maxInvestment;
  }

  mapping(address => uint256) presalers; 

  function addPresaler(address investor, uint256 boundary) public onlyOwner {
    _addPresaler(investor, boundary);
  }

  function _addPresaler(address investor, uint256 boundary) internal {
    presalers[investor] = boundary;
  }

  function removePresaler(address investor) public onlyOwner {
    delete presalers[investor];
  }

  function getPresaleBoundary(address investor) public view returns (uint256) {
    uint256 boundary = presalers[investor];
    return boundary != 0 ? boundary : maxInvestment;
  }

  function isPresaler(address investor, uint256 investment) public view returns (bool) {
    //presaler if investment above minInvestment or present in presaler list
    return investment >= minInvestment || presalers[investor] != 0;
  }

  // overriding Crowdsale#validPurchase to add extra cap logic
  // @return true if investors can buy at the moment
  function validPurchase() internal view returns (bool) {
    if(now < presaleEnd)
    {
      bool withinCap = weiRaised.add(msg.value) <= presaleCap;
      return withinCap;
    }
    return super.validPurchase();
  }

}