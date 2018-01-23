pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';

import './Bonificated.sol';
import './Whitelist.sol';
import './SkaraToken.sol';
import './VestingManager.sol';
import './CappedPreSale.sol';
import './PostSale.sol';


contract SkaraCrowdsale is 
  CappedCrowdsale, 
  FinalizableCrowdsale, 
  Bonificated,
  Whitelist,
  VestingManager, 
  CappedPreSale, 
  PostSale,
  Destructible 
  { 
  using SafeMath for uint256;

  //global
  uint256 public constant MAX_INVESTMENT = 2000 ether; //larger investment should go through custom presale setup process 

  //PreSale
  uint256 public constant MIN_PRESALE_INVESTMENT = 5 ether; 

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
  uint256 public constant DEAFULT_VESTING_CLIFF = 12 weeks; 
  uint256 public constant TEAM_VESTING_CLIFF = 3 years; 

  //finalization
  uint256 public constant SALE_ALLOCATION_PERCENTAGE = 70; 
  uint256 public constant POSTSALE_ALLOCATION_PERCENTAGE = 30; 
  uint256 public constant SAFETY_ALLOCATION = 1000;  //since postsale claimable token amounts may be rounded, a few tokens are allocated to handle decimal deviations
  
  address skaraWallet;
  uint256 endTime;
  mapping(address => uint256) postsalers; //post sale token beneficiaries

  
  event FinalClaim(uint256 amount);

  function SkaraCrowdsale(
      uint256 _cap,
      uint256 _presaleCap, 
      uint256 _investmentLow, 
      uint256 _investmentMedium, 
      uint256 _startTime, 
      uint256 _endTime, 
      uint256 _rate, 
      address _skaraWallet) public
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    CappedPreSale(_presaleCap, _startTime, MIN_PRESALE_INVESTMENT, MAX_INVESTMENT)
    Whitelist(_startTime, _cap, DEFAULT_BOUNDARY)
    Crowdsale(_startTime, _endTime, _rate, _skaraWallet)
    VestingManager(_endTime)
  {
    skaraWallet = _skaraWallet;
    endTime = _endTime;
    _setPresaleBonus(
      MIN_PRESALE_INVESTMENT,
      _investmentLow, 
      BONUS_PRESALE_LOW, 
      _investmentMedium, 
      BONUS_PRESALE_MEDIUM, 
      MAX_INVESTMENT, 
      BONUS_PRESALE_HIGH);
    _setOpenSaleBonus(
      _startTime, 
      BONUS_DURATION, 
      BONUS_DAY_ONE, 
      BONUS_DAY_TWO, 
      BONUS_DAY_THREE);
    setupFixedVestings(
      _investmentLow,
      DEAFULT_VESTING_CLIFF, 
      DEAFULT_VESTING_CLIFF,
      _investmentMedium, 
      DEAFULT_VESTING_CLIFF, 
      DEAFULT_VESTING_CLIFF.mul(2),
      MAX_INVESTMENT,
      DEAFULT_VESTING_CLIFF,
      DEAFULT_VESTING_CLIFF.mul(4));
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
    if(hasCustomTokenVesting(beneficiary)) {
      //was previously added to vesting list, has a custom vesting config
      TokenVesting customVesting = createTokenVesting(beneficiary);
      //mint tokens for vesting contract
      token.mint(customVesting, tokens);
    }
    else if(isValidPresaler(beneficiary, weiAmount)) {
      //presaler without custom config
      TokenVesting fixedVesting = createTokenVestingFromInvestment(beneficiary, weiAmount);
      //mint tokens for vesting contract
      token.mint(fixedVesting, tokens);
    }
    else {
      //mint tokens for beneficiary
      token.mint(beneficiary, tokens);
    }

    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFunds();
  }

  function setupPresaler(address who, uint256 amount, uint256 vestingDuration, uint256 bonus) public onlyOwner {
    _addPresaler(who, amount);
    _addVestingConfig(who, DEAFULT_VESTING_CLIFF, vestingDuration, false);
    _addCustomBonus(who, bonus);
  }

  function addTeamMember(address who, uint256 amount, uint256 vestingDuration, bool revokable) public onlyOwner {
    _addPostsaler(who, amount);
    _addVestingConfig(who, TEAM_VESTING_CLIFF, vestingDuration, revokable);
  }

  function addAdvisor(address who, uint256 amount, uint256 vestingDuration) public onlyOwner {
    _addPostsaler(who, amount);
    _addVestingConfig(who, DEAFULT_VESTING_CLIFF, vestingDuration, false);
  }

  function addBountyMember(address who, uint256 amount) public onlyOwner {
    _addPostsaler(who, amount);
  }

  /** 
  * Handles beneficiaries in diferent sale periods
  * @return true if the beneficiary can buy tokens
  */
  function validBeneficiary(address beneficiary) internal view returns (bool) {
    if(isPresalePeriod()) {
      return isValidPresaler(beneficiary, msg.value);
    } 
    
    if(isWhitelistPeriod()) {
      return isWhitelisted(beneficiary);
    }

    return true;
  }

    /**
  * Override CappedCrowdsale#validPurchase to add presale logic (allow buyTokens before _startTime)
  * has to check manually CappedCrowdsale#validPurchase (and other inheritances) 
  * since inheritance chain is broken in presale cases
  * @return true if the transaction can buy tokens
  */
  function validPurchase() internal view returns (bool) {

    if(isPresalePeriod()) {
      //presale
      bool nonZeroPurchase = msg.value != 0;
      bool withinPresaleCap = validCappedPresalePurchase(weiRaised, msg.value);
      
      return nonZeroPurchase && withinPresaleCap;
    }
    return super.validPurchase();
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
    if(hasCustomTokenVesting(who)) {
      //was previously added to vesting list, already has a custom vesting config
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
    require(hasCustomTokenVesting(beneficiary));
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
      FinalClaim(thisBalance);
    }
  }
  
}

