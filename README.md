# CoffeeTest
This extension enables the execution of TestCafe scripts using a TypeScript [Runner](https://testcafe.io/documentation/402641/reference/testcafe-api/runner) file and the  [ts-node](https://www.npmjs.com/package/ts-node) package.

> **IMPORTANT**  
> This is only a personal project, it hasn't almost been tested and there are no plans to maintain or introduce new features.

## Requirements
 - You should have the [Test Explorer UI](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer) extension installed.
 - Add the [ts-node](https://www.npmjs.com/package/ts-node) package as a dependency on your TestCafe project.
 - The `BROWSER`, `HEADLESS` and `FILTER` environment variables should be present within your `runner.ts` file as well as the [filter method](https://testcafe.io/documentation/402657/reference/testcafe-api/runner/filter) set up (this is how the extension tells TestCafe which browser and test to use). **You can use this [tiny test framework](https://github.com/R0m3rCh/TinyTestFramework) as reference.**

## Features
- Visualize and execute tests from the test explorer
- Run and navigate to tests from the script file
- Quickly navigate to the test script
- Debug test scripts
- Configure browser and its visibility

## Limitations
- Currently only test scripts with the `.ts` extension are valid.
- Stopping the debugger or canceling a test run will not close the browser. This is because VSCode doesn't have the ability to control an external application.
