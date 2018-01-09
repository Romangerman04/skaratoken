pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title PreSale
 * @dev Manages a presale list of contributors with investment boundaries
 */
contract PostSale is Ownable {
  using SafeMath for uint256;

  event PostSaleClaim(address who, uint256 amount);

  mapping(address => uint256) postsalers; 
  mapping(address => uint256) postsalerReleases; 

  uint256 maxReleasable = 0;

  function _setupPostSale(uint256 postSaleAllocation) internal {
    maxReleasable = postSaleAllocation;
  }

  function addPostsaler(address who, uint256 amount) public onlyOwner {
    _addPostsaler(who, amount);
  }

  function _addPostsaler(address who, uint256 amount) internal {
    postsalers[who] = amount;
  }

  function removePostsaler(address who) public onlyOwner {
    _removePostsaler(who);
  }

  function _removePostsaler(address who) internal {
    delete postsalers[who];
  }

  function getPostsalerAmount(address who) public view returns (uint256) {
    uint256 amount = postsalers[who];
    return amount;
  }

  function getReleasableAmount() public view returns (uint256) {
    return maxReleasable;
  }

  function isPostsaler(address who) public view returns (bool) {
    return postsalers[who] != 0;
  }
  
  function _finishPostsaleClaim(address who, uint256 amount) internal {
    _removePostsaler(who);            // token claim completed, remove to prevent future claims
    postsalerReleases[who] = amount;  // store claim
    maxReleasable = maxReleasable.sub(amount);        // update total realeasable
    PostSaleClaim(who, amount);       // log event
  }



}