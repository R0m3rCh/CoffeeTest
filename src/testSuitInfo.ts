import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { FixtureFileData } from './interfaces/TestSuite';
import { BrowserOptions } from './interfaces/settingsView';
import { TestInfo, TestSuiteInfo, TestRunStartedEvent, TestRunFinishedEvent, TestSuiteEvent, TestEvent } from 'vscode-test-adapter-api';

export async function loadTestCafeTests(testFiles: vscode.Uri[]) {
  let testCafeSuite: TestSuiteInfo = {
    type: 'suite',
    id: 'testCafeSuite',
    label: 'TestCafe Suite',
    children: []
  }

  for (let i = 0; i < testFiles.length; i++) {
    const fixtureFileData: FixtureFileData[] = await getTestFileData(testFiles[i].path);
    const fixtureInfo: TestSuiteInfo = {
      type: 'suite',
      id: fixtureFileData[0].name,
      label: fixtureFileData[0].name,
      children: [],
      tooltip: testFiles[i].path
    }

    testCafeSuite.children.push(fixtureInfo);
    fixtureFileData[0].tests.forEach(test => {
      const testCaseData: TestInfo = {
        type: 'test',
        id: test.name,
        label:test.name,
        file: testFiles[i].path,
        tooltip: `${testFiles[i].path} - ${test.name}`,
        line: test.loc.start.line -1,
        skipped: test.isSkipped
      }
      fixtureInfo.children.push(testCaseData);
    })
  }

  return testCafeSuite;
}

async function getTestFileData(file: string) {
  const testCafeEmbeddingUtils = require('testcafe').embeddingUtils;
  let testFileData: FixtureFileData[] = await testCafeEmbeddingUtils.getTypeScriptTestList(file);
  return testFileData;
}

export async function runTestCafeTests(
  workspace: vscode.WorkspaceFolder,
  runningTestProcess: childProcess.ChildProcess | undefined,
  testSuite: TestSuiteInfo,
	tests: string[],
	testStatesEmitter: vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>,
  browserOptions: BrowserOptions | undefined
): Promise<void> {
  for(const test of tests) {
    const node = findNode(testSuite, test);
    if (node) {
			await runNode(workspace, runningTestProcess, node, testStatesEmitter, browserOptions);
		}
  }
}

function findNode(searchNode: TestSuiteInfo | TestInfo, id: string): TestSuiteInfo | TestInfo | undefined {
	if (searchNode.id === id) {
		return searchNode;
	} else if (searchNode.type === 'suite') {
		for (const child of searchNode.children) {
			const found = findNode(child, id);
			if (found) return found;
		}
	}
	return undefined;
}

async function runNode(
  workspace: vscode.WorkspaceFolder,
  runningTestProcess: childProcess.ChildProcess | undefined,
	node: TestSuiteInfo | TestInfo,
	testStatesEmitter: vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>,
  browserOptions?: BrowserOptions
): Promise<void> {
	if (node.type === 'suite') {
		testStatesEmitter.fire(<TestSuiteEvent>{ type: 'suite', suite: node.id, state: 'running' });
		for (const child of node.children) {
			await runNode(workspace, runningTestProcess, child, testStatesEmitter, browserOptions);
		}
		testStatesEmitter.fire(<TestSuiteEvent>{ type: 'suite', suite: node.id, state: 'completed' });
	} else {

    




    return new Promise<void>((resolve, reject) => {




      const outputChannel = vscode.window.createOutputChannel('testcafe-logs');
      outputChannel.show();




      testStatesEmitter.fire(<TestEvent>{ type: 'test', test: node.id, state: 'running'});
			runningTestProcess = childProcess.spawn(`FILTER="${node.id}" BROWSER="${browserOptions?.name}" HEADLESS="${browserOptions?.headless}" npm test`, {shell: true, cwd: workspace.uri.path});
      runningTestProcess.stdout?.on('data', (data: Buffer) => {
        outputChannel.append(data.toString());
      })
			runningTestProcess.once('exit', (code) => {
        runningTestProcess = undefined;
        testStatesEmitter.fire(<TestEvent>{
          type: 'test', test: node.id, state: code === 0 ? 'passed' : code === 1 ? 'failed' : 'errored'
        });
				resolve();
			});
    });
	}
}
