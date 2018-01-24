pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title PreSale
 * @dev Manages a presale list of contributors with investment boundaries
 */
contract CappedPreSale is Ownable {
  using SafeMath for uint256;

  uint256 public presaleCap;
  uint256 public presaleEnd;
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

  function isValidPresaler(address investor, uint256 investment) public view returns (bool) {
    //presaler if current time within presale period, and is custom presaler or within investment boundaries
    return  isPresalePeriod() 
            && 
            (isCustomPresaler(investor) 
              || 
              (investment >= minInvestment || investment <= maxInvestment));
  }

  function isPresalePeriod() public view returns (bool) {
    return now < presaleEnd;
  }

  function isCustomPresaler(address investor) public view returns (bool) {
    return presalers[investor] != 0;
  }


  // add cap logic
  // @return true if investors can buy at the moment
  function validCappedPresalePurchase(uint256 weiRaised, uint256 investment) public view returns (bool) {
    bool withinCap = weiRaised.add(investment) <= presaleCap;
    bool withinInvestmentBoundaries = 
      investment >= minInvestment 
      && 
      investment <= maxInvestment;

    return  isPresalePeriod() 
            && 
            withinCap
            && 
            withinInvestmentBoundaries;
  }


}