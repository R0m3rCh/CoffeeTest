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
  
  ![Test Explorer](/img/img_01.png?raw=true "Test Explorer")

- Configure browser and its visibility
  
  ![Browser Configuration](/img/img_02.png?raw=true "Browser Configuration")

- Start debugger for test scripts
  
  ![Debugger](/img/img_03.png?raw=true "Debugger")

- Quickly navigate to the test script

  ![Navigation](/img/img_04.png?raw=true "Navigation")

- Run, debug and navigate to test explorer from the script file
  
  ![File Actions](/img/img_05.png?raw=true "File Actions")

## Limitations
- Currently only test scripts with the `.ts` extension are valid.
- Stopping the debugger or canceling a test run will not close the browser. This is because VSCode doesn't have the ability to control an external application.
