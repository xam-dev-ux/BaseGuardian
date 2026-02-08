// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificationRegistry
 * @notice Registry for BaseGuardian contract certifications with staking and challenges
 * @dev Allows BaseGuardian to certify safe contracts, stake reputation, and resolve challenges
 */
contract CertificationRegistry {

    // ===== Structs =====

    struct Certification {
        address contractAddress;     // Address of certified contract
        address guardian;            // BaseGuardian address
        string ipfsHash;             // IPFS hash of full analysis metadata
        uint256 riskScore;           // Risk score 0-100 (higher is safer)
        uint256 stakeAmount;         // ETH staked by guardian
        uint256 timestamp;           // Certification timestamp
        bool active;                 // Whether certification is active
        uint256 challengeCount;      // Number of challenges received
    }

    struct Challenge {
        address challenger;          // Address of challenger
        string reason;               // Reason for challenge
        uint256 bondAmount;          // ETH bonded by challenger
        uint256 timestamp;           // Challenge timestamp
        bool resolved;               // Whether challenge has been resolved
        bool valid;                  // Whether challenge was valid (only if resolved)
    }

    // ===== State Variables =====

    mapping(address => Certification) public certifications;
    mapping(address => Challenge[]) public challenges;
    mapping(address => uint256) public guardianStakes;

    address public owner;
    uint256 public totalCertifications;
    uint256 public totalChallenges;

    // ===== Constants =====

    uint256 public constant MIN_STAKE = 0.000001 ether;
    uint256 public constant CHALLENGE_BOND = 0.005 ether;
    uint256 public constant SLASH_PERCENTAGE = 50;
    uint256 public constant MIN_RISK_SCORE = 80;
    uint256 public constant MAX_RISK_SCORE = 100;

    // ===== Events =====

    event ContractCertified(
        address indexed contractAddress,
        address indexed guardian,
        string ipfsHash,
        uint256 riskScore,
        uint256 stakeAmount,
        uint256 timestamp
    );

    event CertificationChallenged(
        address indexed contractAddress,
        address indexed challenger,
        string reason,
        uint256 bondAmount,
        uint256 challengeIndex
    );

    event ChallengeResolved(
        address indexed contractAddress,
        uint256 challengeIndex,
        bool valid,
        uint256 slashAmount
    );

    event CertificationRevoked(
        address indexed contractAddress,
        string reason
    );

    event StakeWithdrawn(
        address indexed guardian,
        uint256 amount
    );

    // ===== Modifiers =====

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validRiskScore(uint256 _riskScore) {
        require(
            _riskScore >= MIN_RISK_SCORE && _riskScore <= MAX_RISK_SCORE,
            "Risk score must be between 80 and 100"
        );
        _;
    }

    // ===== Constructor =====

    constructor() {
        owner = msg.sender;
    }

    // ===== Certification Functions =====

    /**
     * @notice Certify a contract as safe
     * @param _contractAddress Address of contract to certify
     * @param _ipfsHash IPFS hash of full analysis metadata
     * @param _riskScore Risk score 80-100 (higher is safer)
     */
    function certify(
        address _contractAddress,
        string memory _ipfsHash,
        uint256 _riskScore
    ) external payable validRiskScore(_riskScore) {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(_contractAddress != address(0), "Invalid contract address");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(!certifications[_contractAddress].active, "Contract already certified");

        certifications[_contractAddress] = Certification({
            contractAddress: _contractAddress,
            guardian: msg.sender,
            ipfsHash: _ipfsHash,
            riskScore: _riskScore,
            stakeAmount: msg.value,
            timestamp: block.timestamp,
            active: true,
            challengeCount: 0
        });

        guardianStakes[msg.sender] += msg.value;
        totalCertifications++;

        emit ContractCertified(
            _contractAddress,
            msg.sender,
            _ipfsHash,
            _riskScore,
            msg.value,
            block.timestamp
        );
    }

    /**
     * @notice Challenge an existing certification
     * @param _contractAddress Address of certified contract
     * @param _reason Reason for challenge with evidence
     */
    function challenge(
        address _contractAddress,
        string memory _reason
    ) external payable {
        require(msg.value >= CHALLENGE_BOND, "Insufficient challenge bond");
        require(certifications[_contractAddress].active, "Contract not certified or certification revoked");
        require(bytes(_reason).length > 0, "Challenge reason required");

        challenges[_contractAddress].push(Challenge({
            challenger: msg.sender,
            reason: _reason,
            bondAmount: msg.value,
            timestamp: block.timestamp,
            resolved: false,
            valid: false
        }));

        certifications[_contractAddress].challengeCount++;
        totalChallenges++;

        uint256 challengeIndex = challenges[_contractAddress].length - 1;

        emit CertificationChallenged(
            _contractAddress,
            msg.sender,
            _reason,
            msg.value,
            challengeIndex
        );
    }

    /**
     * @notice Resolve a challenge (called by guardian after re-analysis)
     * @param _contractAddress Address of challenged contract
     * @param _challengeIndex Index of challenge in challenges array
     * @param _valid Whether challenge is valid
     */
    function resolveChallenge(
        address _contractAddress,
        uint256 _challengeIndex,
        bool _valid
    ) external onlyOwner {
        require(_challengeIndex < challenges[_contractAddress].length, "Invalid challenge index");

        Certification storage cert = certifications[_contractAddress];
        Challenge storage chall = challenges[_contractAddress][_challengeIndex];

        require(!chall.resolved, "Challenge already resolved");
        require(cert.active, "Certification not active");

        chall.resolved = true;
        chall.valid = _valid;

        uint256 slashAmount = 0;

        if (_valid) {
            // Challenge is valid - slash guardian stake
            slashAmount = (cert.stakeAmount * SLASH_PERCENTAGE) / 100;
            guardianStakes[cert.guardian] -= slashAmount;

            // Revoke certification
            cert.active = false;

            // Reward challenger with bond + slashed amount
            uint256 reward = chall.bondAmount + slashAmount;
            (bool success, ) = chall.challenger.call{value: reward}("");
            require(success, "Transfer to challenger failed");

            emit CertificationRevoked(_contractAddress, "Challenge validated");
        } else {
            // Challenge is invalid - return challenger's bond
            (bool success, ) = chall.challenger.call{value: chall.bondAmount}("");
            require(success, "Transfer to challenger failed");
        }

        emit ChallengeResolved(
            _contractAddress,
            _challengeIndex,
            _valid,
            slashAmount
        );
    }

    /**
     * @notice Manually revoke a certification (emergency use)
     * @param _contractAddress Address of certified contract
     * @param _reason Reason for revocation
     */
    function revokeCertification(
        address _contractAddress,
        string memory _reason
    ) external onlyOwner {
        require(certifications[_contractAddress].active, "Certification not active");

        certifications[_contractAddress].active = false;

        emit CertificationRevoked(_contractAddress, _reason);
    }

    // ===== Stake Management =====

    /**
     * @notice Withdraw available stake
     * @dev Guardian can only withdraw stake not locked in active certifications
     */
    function withdrawStake() external {
        uint256 totalStake = guardianStakes[msg.sender];
        require(totalStake > 0, "No stake to withdraw");

        // Calculate locked stake (from active certifications)
        uint256 lockedStake = getLockedStake(msg.sender);
        uint256 availableStake = totalStake - lockedStake;

        require(availableStake > 0, "All stake is locked in active certifications");

        guardianStakes[msg.sender] -= availableStake;

        (bool success, ) = msg.sender.call{value: availableStake}("");
        require(success, "Transfer failed");

        emit StakeWithdrawn(msg.sender, availableStake);
    }

    /**
     * @notice Calculate locked stake for a guardian
     * @param _guardian Address of guardian
     * @return Amount of stake locked in active certifications
     */
    function getLockedStake(address _guardian) public view returns (uint256) {
        // Note: This is a simplified version. In production, you'd want to track
        // active certifications per guardian to avoid iterating
        // For now, we assume all stake is locked if any certifications exist
        // A more sophisticated implementation would maintain a list of active certs per guardian

        return guardianStakes[_guardian]; // Simplified: all stake considered locked
    }

    // ===== View Functions =====

    /**
     * @notice Get certification details
     * @param _contractAddress Address of certified contract
     * @return Certification struct
     */
    function getCertification(address _contractAddress)
        external
        view
        returns (Certification memory)
    {
        return certifications[_contractAddress];
    }

    /**
     * @notice Get all challenges for a contract
     * @param _contractAddress Address of certified contract
     * @return Array of Challenge structs
     */
    function getChallenges(address _contractAddress)
        external
        view
        returns (Challenge[] memory)
    {
        return challenges[_contractAddress];
    }

    /**
     * @notice Get specific challenge details
     * @param _contractAddress Address of certified contract
     * @param _challengeIndex Index of challenge
     * @return Challenge struct
     */
    function getChallenge(address _contractAddress, uint256 _challengeIndex)
        external
        view
        returns (Challenge memory)
    {
        require(_challengeIndex < challenges[_contractAddress].length, "Invalid challenge index");
        return challenges[_contractAddress][_challengeIndex];
    }

    /**
     * @notice Check if contract is certified
     * @param _contractAddress Address to check
     * @return bool Whether contract has active certification
     */
    function isCertified(address _contractAddress) external view returns (bool) {
        return certifications[_contractAddress].active;
    }

    /**
     * @notice Get guardian's total stake
     * @param _guardian Address of guardian
     * @return uint256 Total stake amount
     */
    function getGuardianStake(address _guardian) external view returns (uint256) {
        return guardianStakes[_guardian];
    }

    /**
     * @notice Get contract balance
     * @return uint256 Contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ===== Admin Functions =====

    /**
     * @notice Transfer ownership
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    /**
     * @notice Fallback function to reject direct ETH transfers
     */
    receive() external payable {
        revert("Direct ETH transfers not accepted. Use certify() or challenge()");
    }
}
