import path = require('path');
import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { FixtureFileData, TestEventCases } from './interfaces/TestSuite';
import { BrowserOptions } from './interfaces/settingsView';
import { TestInfo, TestSuiteInfo, TestRunStartedEvent, TestRunFinishedEvent, TestSuiteEvent, TestEvent } from 'vscode-test-adapter-api';

export let testProcessPID: number[] = [];
const isWindows = process.platform === 'win32';

export async function loadTestCafeTests(testFiles: vscode.Uri[]) {
  let testCafeSuite: TestSuiteInfo = {
    type: 'suite',
    id: 'testCafeSuite',
    label: 'TestCafe Suite',
    children: []
  }

  for (let i = 0; i < testFiles.length; i++) {
    const fixtureFileData: FixtureFileData[] = await getTestFileData(path.normalize(testFiles[i].fsPath));
    const fixtureInfo: TestSuiteInfo = {
      type: 'suite',
      id: fixtureFileData[0].name,
      label: fixtureFileData[0].name,
      children: [],
      tooltip: path.normalize(testFiles[i].fsPath)
    }

    testCafeSuite.children.push(fixtureInfo);
    fixtureFileData[0].tests.forEach(test => {
      const testCaseData: TestInfo = {
        type: 'test',
        id: test.name,
        label:test.name,
        file: path.normalize(testFiles[i].fsPath),
        tooltip: `${path.normalize(testFiles[i].fsPath)} - ${test.name}`,
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
      const testEvents: TestEventCases = {
        0: 'passed',
        1: 'failed',
        'undefined': 'errored'
      }
      const outputChannel = vscode.window.createOutputChannel('testcafe-logs');
      const childProcessOptions: Record<string, any> = {
        shell: true,
        cwd: path.normalize(workspace.uri.fsPath)
      }
      if (isWindows) {
        childProcessOptions.env = {
          FILTER: `${node.id}`,
          BROWSER: `${browserOptions?.name}`,
          HEADLESS: `${browserOptions?.headless}`
        }
      }

      outputChannel.show();
      testStatesEmitter.fire(<TestEvent>{ type: 'test', test: node.id, state: 'running'});
			runningTestProcess = childProcess.spawn(isWindows === false
        ? `FILTER="${node.id}" BROWSER="${browserOptions?.name}" HEADLESS="${browserOptions?.headless}" npx ts-node runner.ts`
        : 'npx ts-node runner.ts', childProcessOptions
      );
      testProcessPID.push(runningTestProcess.pid);
      runningTestProcess.stdout?.on('data', (data: Buffer) => {
        outputChannel.append(data.toString());
      })
			runningTestProcess.once('exit', (code) => {
        testProcessPID = testProcessPID.filter(item => item != runningTestProcess?.pid);
        runningTestProcess = undefined;
        testStatesEmitter.fire(<TestEvent>{
          type: 'test', test: node.id, state: code === null ? 'skipped' : testEvents[code]
        });
				resolve();
			});
    });
	}
}
