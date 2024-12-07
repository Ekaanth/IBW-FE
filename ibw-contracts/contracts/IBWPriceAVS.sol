// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@eigenlayer/contracts/interfaces/IServiceManager.sol";
import "./CollateralManager.sol";

contract IBWPriceAVS is Ownable {
    IServiceManager public serviceManager;
    CollateralManager public collateralManager;
    
    uint256 public constant QUORUM_THRESHOLD = 2;
    uint256 public constant RESPONSE_WINDOW = 1 hours;
    
    struct LiquidationProposal {
        address user;
        uint256 timestamp;
        uint256 approvals;
        bool executed;
        mapping(address => bool) hasApproved;
    }
    
    mapping(uint256 => LiquidationProposal) public liquidationProposals;
    uint256 public currentProposalId;
    
    event LiquidationProposed(uint256 indexed proposalId, address user);
    event LiquidationApproved(uint256 indexed proposalId, address operator);
    event LiquidationExecuted(uint256 indexed proposalId, address user);
    
    constructor(
        address _serviceManager,
        address _collateralManager
    ) Ownable(msg.sender) {
        serviceManager = IServiceManager(_serviceManager);
        collateralManager = CollateralManager(_collateralManager);
    }
    
    modifier onlyOperator() {
        require(
            serviceManager.isOperator(msg.sender),
            "Only registered operators can call this function"
        );
        _;
    }
    
    function proposeLiquidation(address user) external onlyOperator {
        uint256 ratio = collateralManager.checkCollateralRatio(user);
        require(ratio < 200, "Position is safe");
        
        currentProposalId++;
        LiquidationProposal storage proposal = liquidationProposals[currentProposalId];
        proposal.user = user;
        proposal.timestamp = block.timestamp;
        proposal.approvals = 1;
        proposal.hasApproved[msg.sender] = true;
        
        emit LiquidationProposed(currentProposalId, user);
    }
    
    function approveLiquidation(uint256 proposalId) external onlyOperator {
        LiquidationProposal storage proposal = liquidationProposals[proposalId];
        require(block.timestamp <= proposal.timestamp + RESPONSE_WINDOW, "Response window closed");
        require(!proposal.executed, "Liquidation already executed");
        require(!proposal.hasApproved[msg.sender], "Already approved");
        
        proposal.approvals++;
        proposal.hasApproved[msg.sender] = true;
        
        emit LiquidationApproved(proposalId, msg.sender);
        
        if (proposal.approvals >= QUORUM_THRESHOLD) {
            collateralManager.burnExcessCollateral(proposal.user);
            proposal.executed = true;
            emit LiquidationExecuted(proposalId, proposal.user);
        }
    }
} 