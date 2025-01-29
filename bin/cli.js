#!/usr/bin/env node

const { findPatchedVersion } = require("../src/index");
const ora = require("ora").default; 

const args = process.argv.slice(2);

if (args.length !== 4) {
  console.error("Usage: patched-up <root-dependency> <root-version> <vulnerable-dependency> <desired-version>");
  process.exit(1);
}

const [rootDependency, rootVersion, vulnerableDependency, desiredVersion] = args;

// Start spinner
const spinner = ora("Searching for compatible versions...").start();

(async () => {
  try {
    const validVersions = await findPatchedVersion(rootDependency, rootVersion, vulnerableDependency, desiredVersion);
    spinner.succeed("Search completed successfully."); // Stop spinner with success
    if (validVersions.length > 0) {
      console.log(`\nFound compatible versions of ${rootDependency} that use ${vulnerableDependency}@${desiredVersion}:`);
      console.log(validVersions.join("\n"));
    } else {
      console.log("\nNo compatible versions found.");
    }
  } catch (error) {
    spinner.fail("Search failed."); // Stop spinner with failure
    console.error("\nError:", error.message);
    process.exit(1);
  }
})();
