# Skara Token Crowdsale

## Presentation

[SKARA](https://playskara.com/) is a new entertainment universe that includes a multiplayer competitive eSports platform, narrative role playing (RPG) games and mobile apps in a rich fantasy world described in a series of novels to be published January 2018.

We [propose](https://www.skaratoken.com/) embedding blockchain at the heart of the SKARA ecosystem, in order to decentralize the benefits of participating in the games, both casually and competitively. Connecting the rewards for participating in the SKARA community to the larger community is a huge benefit to everyone. We believe this is the future for gaming. 

## Technical definition

SkaraToken:

At the technical level [SkaraToken](contracts/SkaraToken.sol) is a ERC20-compliant token, derived from OpenZeppelin's [StandardToken](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/StandardToken.sol) that allows for token burning, which is a condition for our game economy flow. A draft of the burning process can be found at the [SkaraEconomyDriver](contracts/SkaraEconomyDriver.sol) contract.

SkaraCrowdsale

The token allocation is managed through the [SkaraCrowdsale](contracts/SkaraCrowdsale.sol) contract. The contract derives from OpenZeppelin's [Crowdsale](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) an adds some logic to handle the following features:

- [CappedCrowdsale](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/crowdsale/CappedCrowdsale.sol): The absolute maximum amount of ether the crowdsale will receive. Capped at 10 M€ at the contract deployment date.
- [VestingManager](contracts/VestingManager.sol): A Manager that controls the transferability of some of the tokens. On certain conditons, the token purchase flow deploys to the blockchain a custom [TokenVesting](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/TokenVesting.sol) contract as a token holder attached to a beneficiary. Those tokens will be partially releasable only after the cliff period is over and totally releasable at the end of the vesting period.
- [PreSale](contracts/PreSale.sol): Some investors are allowed to purchase tokens with custom conditions before the public token sale begins. This contract manages this pre-sale list and conditions.
- [PostSale](contracts/PostSale.sol): Some actors (team members, advisors, bounty program members) are beneficiaries of tokens allocated after the public token sale finishes. This contract manages this post-sale list and conditions.
- 
- [FinalizableCrowdsale](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/crowdsale/FinalizableCrowdsale.sol): Allows some finalization conditions to be executed after the sale ends such as extra token allocations to be used by the game as well as to be retained by team members, advisors, etc.
- [Whitelist](contracts/Whitelist.sol): The crowdsale includes a whitelist period in which only whitelisted investors will be able to buy tokens. The whitelist has been populated during the [pre-sale campaign](https://www.skaratoken.com/).
- [Bonificated](contracts/Bonificated.sol): In certain conditions a bonus will be applied, this contract manages the fixed and the custom bonuses.



## Contracts

Token:

- [SkaraToken.sol](/contracts/SkaraToken.sol): Main contract for the token. 


Sale:

- [SkaraCrowdsale.sol](contracts/SkaraCrowdsale.sol): The crowdsale manager.
- [VestingManager.sol](contracts/VestingManager.sol): The vesting schedule manager.
- [PreSale.sol](contracts/Presale.sol): The pre-sale list manager.
- [PostSale.sol](contracts/Presale.sol): The post-sale list manager.
- [Whitelist.sol](contracts/Whitelist.sol): The whitelist manager.
- [Bonificated.sol](contracts/Bonificated.sol): The bonus manager.

Game:
- [SkaraEconomyDriver.sol](contracts/SkaraEconomyDriver.sol): A draft for the future game economy manager. Currently shows the token burning feature
BonificatedBonificated