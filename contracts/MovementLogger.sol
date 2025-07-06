// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {TablelandDeployments} from "@tableland/evm/contracts/utils/TablelandDeployments.sol";
import {SQLHelpers} from "@tableland/evm/contracts/utils/SQLHelpers.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IDecisionRegistry {
    function pushCID(bytes32 cid) external;
}

contract MovementLogger {
    // ---- Immutable config ----
    IDecisionRegistry public immutable registry;
    address public immutable keeper;          // bot address allowed to log
    uint256 public immutable tableId;
    string  private constant PREFIX = "ai_movements";

    // ---- Events ----
    event MovementLogged(bytes32 indexed cid, uint256 id);

    // ---- Constructor ----
    constructor(address _registry, address _keeper) {
        registry = IDecisionRegistry(_registry);
        keeper   = _keeper;

        // crea la tabla una sola vez, columnas incluyen cid
        tableId = TablelandDeployments.get().create(
            address(this),
            SQLHelpers.toCreateFromSchema(
              "id integer primary key,"
              "cid text,"
              "vault text,"
              "src_chain integer,"
              "block_no integer,"
              "strategy text,"
              "reason text,"
              "updated_at text,"
              "amount text,"
              "risk_level text",
              PREFIX
            )
        );
    }

    // ---- Public log function ----
    function logMovement(
        bytes32 cid,
        address vault,
        uint256 srcChain,
        uint256 blockNo,
        address strategy,
        string  calldata reason,
        string  calldata updatedAt,
        string  calldata riskLevel,
        uint256 amount
    ) external {
        require(msg.sender == keeper, "not keeper");

        // 1. push CID into DecisionRegistry (FVM)
        registry.pushCID(cid);

        // 2. insert row into Tableland
        string memory idStr      = Strings.toString(block.number); // simple PK
        string memory cidStr     = Strings.toHexString(uint256(cid), 32);
        string memory vaultStr   = Strings.toHexString(vault);
        string memory stratStr   = Strings.toHexString(strategy);
        string memory amtStr     = Strings.toString(amount);

        TablelandDeployments.get().mutate(
            address(this),
            tableId,
            SQLHelpers.toInsert(
                PREFIX,
                tableId,
                "id,cid,vault,src_chain,block_no,strategy,reason,updated_at,amount,risk_level",
                string.concat(
                    idStr, ",",
                    SQLHelpers.quote(cidStr), ",",
                    SQLHelpers.quote(vaultStr), ",",
                    Strings.toString(srcChain), ",",
                    Strings.toString(blockNo), ",",
                    SQLHelpers.quote(stratStr), ",",
                    SQLHelpers.quote(reason), ",",
                    SQLHelpers.quote(updatedAt), ",",
                    SQLHelpers.quote(amtStr), ",",
                    SQLHelpers.quote(riskLevel)
                )
            )
        );

        emit MovementLogged(cid, block.number);
    }
}
