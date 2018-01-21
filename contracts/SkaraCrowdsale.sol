pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Bonificated.sol';
import './Whitelist.sol';
import './SkaraToken.sol';
import './VestingManager.sol';
import './CappedPreSale.sol';
import './PostSale.sol';


contract SkaraCrowdsale is CappedCrowdsale, FinalizableCrowdsale, Bonificated, Whitelist, VestingManager, CappedPreSale, PostSale { 
  using SafeMath for uint256;

  //PreSale
  uint256 public constant MIN_PRESALE_INVESTMENT = 5 ether; 
  uint256 public constant LOW_PRESALE_INVESTMENT = 100 ether; 
  uint256 public constant MEDIUM_PRESALE_INVESTMENT = 500 ether; 
  uint256 public constant MAX_PRESALE_INVESTMENT = 2000 ether; 

  //Whitelist
  uint256 public constant WHITELIST_DURATION = 2 days; 
  uint256 public constant DEFAULT_BOUNDARY = 5 ether; 

  //Bonificated
  uint256 public constant BONUS_PRESALE_LOW = 30; 
  uint256 public constant BONUS_PRESALE_MEDIUM = 35; 
  uint256 public constant BONUS_PRESALE_HIGH = 45; 
  uint256 public constant BONUS_DURATION = 3 days; 
  uint256 public constant BONUS_DAY_ONE = 15; 
  uint256 public constant BONUS_DAY_TWO = 10; 
  uint256 public constant BONUS_DAY_THREE = 5; 

  //vesting
  uint256 public constant PRE_SALE_VESTING_CLIFF = 12 weeks; 

  uint256 public constant ADVISORS_VESTING_CLIFF = 12 weeks; 
  uint256 public constant ADVISORS_VESTING_DURATION = 2 years; 

  uint256 public constant TEAM_VESTING_CLIFF = 3 years;  
  uint256 public constant TEAM_VESTING_DURATION = 3 years; //no vesting period, just lockup

  //finalization
  uint256 public constant SALE_ALLOCATION_PERCENTAGE = 70; 
  uint256 public constant POSTSALE_ALLOCATION_PERCENTAGE = 30; 
  uint256 public constant SAFETY_ALLOCATION = 1000;  //since postsale claimable token amounts may be rounded, a few tokens are allocated to handle decimal deviations
  
  address skaraWallet;
  uint256 endTime;
  mapping(address => uint256) postsalers; //post sale token beneficiaries

  
  event FinalClaim(uint256 amount);

  function SkaraCrowdsale(uint256 _cap, uint256 _presaleCap, uint256 _startTime, uint256 _endTime, uint256 _rate, address _skaraWallet) public
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    CappedPreSale(_presaleCap, _startTime, MIN_PRESALE_INVESTMENT, MAX_PRESALE_INVESTMENT)
    Whitelist(_startTime, _cap, DEFAULT_BOUNDARY)
    Bonificated(
      MIN_PRESALE_INVESTMENT, 
      BONUS_PRESALE_LOW,
      MEDIUM_PRESALE_INVESTMENT, 
      BONUS_PRESALE_MEDIUM, 
      MAX_PRESALE_INVESTMENT, 
      BONUS_PRESALE_HIGH, 
      _startTime, 
      BONUS_DURATION, 
      BONUS_DAY_ONE, 
      BONUS_DAY_TWO, 
      BONUS_DAY_THREE)
    Crowdsale(_startTime, _endTime, _rate, _skaraWallet)
    VestingManager(_endTime)
  {
    skaraWallet = _skaraWallet;
    endTime = _endTime;
  }

  function createTokenContract() internal returns (MintableToken) {
    return new SkaraToken();
  }

  // overriding Crowdsale#buyTokens to add presale, whitelist and bonus logic
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase()); 
    require(validBeneficiary(beneficiary)); 

    uint256 weiAmount = msg.value;
    
    //handle whitelist logic
    if(isDayOne()) {
      uint256 beneficiaryBoundary = getBoundary(beneficiary);
      require(weiAmount <= beneficiaryBoundary);
      _updateBoundary(beneficiary, weiAmount);
      _addToDayTwo(beneficiary);
    }
    
    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    //add bonus
    uint256 currentBonusMultiplier = getBonus(beneficiary, weiAmount).add(100);
    tokens = tokens.mul(currentBonusMultiplier).div(100);
    
    //update state
    weiRaised = weiRaised.add(weiAmount);

    //vesting
    if(hasTokenVesting(beneficiary)) {
      //was previously added to vesting list, already has a vesting config
      TokenVesting vesting = createTokenVesting(beneficiary);
      //mint tokens for vesting contract
      token.mint(vesting, tokens);
    }
    else{
      //mint tokens for beneficiary
      token.mint(beneficiary, tokens);
    }

    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFunds();
    
  }

  function setupPresaler(address who, uint256 amount, uint256 vestingDuration, uint256 bonus) public onlyOwner {
    _addPresaler(who, amount);
    _addVestingConfig(who, PRE_SALE_VESTING_CLIFF, vestingDuration, false);
    _addCustomBonus(who, bonus);
  }

  function addTeamMember(address who, uint256 amount) public onlyOwner {
    _addPostsaler(who, amount);
    _addVestingConfig(who, TEAM_VESTING_CLIFF, TEAM_VESTING_DURATION, true);
  }

  function addAdvisor(address who, uint256 amount) public onlyOwner {
    _addPostsaler(who, amount);
    _addVestingConfig(who, ADVISORS_VESTING_CLIFF, ADVISORS_VESTING_DURATION, false);
  }

  function addBountyMember(address who, uint256 amount) public onlyOwner {
    _addPostsaler(who, amount);
  }

  /** 
  * Handles beneficiaries in diferent sale periods
  * @return true if the beneficiary can buy tokens
  */
  function validBeneficiary(address beneficiary) internal view returns (bool) {
    if(now < startTime) {
      return isPresaler(beneficiary, msg.value);
    } 
    
    if(isWhitelistPeriod()) {
      return isWhitelisted(beneficiary);
    }

    return true;
  }

  /**
   * @dev Override FinalizableCrowdsale#finalization to add final token allocation
   */
  function finalization() internal {
    
    uint256 totalSale = token.totalSupply();
    uint256 total = totalSale.mul(100).div(SALE_ALLOCATION_PERCENTAGE);
    
    uint256 postsalersAllocation = POSTSALE_ALLOCATION_PERCENTAGE.mul(total).div(100);
    uint256 finalAllocation = postsalersAllocation.add(SAFETY_ALLOCATION);
    
    _setupPostSale(finalAllocation);

    super.finalization();
  }

  function claimFromPostsaler(address who) public {
    require(hasEnded());
    require(getReleasableAmount() > 0);
    require(isPostsaler(who));
  
    uint256 tokens = getPostsalerAmount(who);
    require(tokens > 0);

    //vesting
    if(hasTokenVesting(who)) {
      //was previously added to vesting list, already has a vesting config
      TokenVesting vesting = createTokenVesting(who);
      //mint tokens for vesting contract
      token.mint(vesting, tokens);
    }
    else {
      //mint tokens for beneficiary
      token.mint(who, tokens);
    }
    
    _finishPostsaleClaim(who, tokens); //will log the token claim and prevent future claims 
  }

  /**
  * Transfer of this contract balance to skara
  * used for claiming back tokens from revoked vesting contracts
  */
  function revokeVesting(address beneficiary) public onlyOwner {
    require(hasTokenVesting(beneficiary));
    TokenVesting vesting = getVestingAddress(beneficiary);
    vesting.revoke(token);
  }
   /**
  * Transfer of this contract balance to skara
  * used for claiming back tokens from revoked vesting contracts
  */
  function claimRest() public onlyOwner {
    uint256 thisBalance = token.balanceOf(this);

    if(thisBalance > 0) {
      token.transfer(skaraWallet, thisBalance);
    }
  }
  
}

