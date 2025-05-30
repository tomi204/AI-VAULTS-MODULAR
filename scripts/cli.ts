#!/usr/bin/env node

import { spawn } from "child_process";
import { existsSync } from "fs";

const COMMANDS = {
  deploy: {
    description: "Deploy the complete vault system",
    script: "scripts/deploy.ts",
    examples: ["npx hardhat run scripts/cli.ts deploy"]
  },
  test: {
    description: "Run all unit tests",
    script: "test",
    examples: ["npx hardhat run scripts/cli.ts test"]
  },
  "test-integration": {
    description: "Run integration tests",
    script: "scripts/test-integration.ts",
    examples: ["npx hardhat run scripts/cli.ts test-integration"]
  },
  interact: {
    description: "Interactive CLI for deployed contracts",
    script: "scripts/interact.ts",
    examples: [
      "npx hardhat run scripts/cli.ts interact status",
      "npx hardhat run scripts/cli.ts interact deposit",
      "npx hardhat run scripts/cli.ts interact harvest"
    ]
  },
  compile: {
    description: "Compile all contracts",
    script: "compile",
    examples: ["npx hardhat run scripts/cli.ts compile"]
  },
  clean: {
    description: "Clean artifacts and cache",
    script: "clean",
    examples: ["npx hardhat run scripts/cli.ts clean"]
  }
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🏛️ Vault System CLI\n");

  if (!command || command === "help" || command === "--help" || command === "-h") {
    displayHelp();
    return;
  }

  if (!COMMANDS[command as keyof typeof COMMANDS]) {
    console.log(`❌ Unknown command: ${command}\n`);
    displayHelp();
    process.exit(1);
  }

  const commandConfig = COMMANDS[command as keyof typeof COMMANDS];
  
  try {
    console.log(`🚀 Running: ${commandConfig.description}\n`);
    
    if (command === "test") {
      await runHardhatCommand("test");
    } else if (command === "compile") {
      await runHardhatCommand("compile");
    } else if (command === "clean") {
      await runHardhatCommand("clean");
    } else if (command === "interact") {
      // Pass remaining args to interact script
      const interactArgs = args.slice(1);
      await runScript(commandConfig.script, interactArgs);
    } else {
      await runScript(commandConfig.script);
    }
    
  } catch (error) {
    console.error(`❌ Command failed:`, error);
    process.exit(1);
  }
}

async function runScript(scriptPath: string, args: string[] = []) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["hardhat", "run", scriptPath, "--", ...args], {
      stdio: "inherit",
      shell: true
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function runHardhatCommand(command: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["hardhat", command], {
      stdio: "inherit",
      shell: true
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Hardhat command exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

function displayHelp() {
  console.log("🔧 Available Commands:");
  console.log("=====================\n");

  Object.entries(COMMANDS).forEach(([cmd, config]) => {
    console.log(`📌 ${cmd.padEnd(20)} - ${config.description}`);
    config.examples.forEach(example => {
      console.log(`   Example: ${example}`);
    });
    console.log("");
  });

  console.log("🔗 Quick Start:");
  console.log("===============");
  console.log("1. npx hardhat run scripts/cli.ts compile");
  console.log("2. npx hardhat run scripts/cli.ts test");
  console.log("3. npx hardhat run scripts/cli.ts deploy");
  console.log("4. npx hardhat run scripts/cli.ts interact status");
  console.log("");

  console.log("💡 Tips:");
  console.log("========");
  console.log("• Use 'npx hardhat run scripts/cli.ts help' to see this help");
  console.log("• All commands support the --network flag for different networks");
  console.log("• Set environment variables for contract addresses when using interact");
  console.log("");
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 