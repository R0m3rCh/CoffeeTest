import * as vscode from 'vscode';
import { TestAdapter, TestLoadStartedEvent, TestLoadFinishedEvent, TestRunStartedEvent, TestRunFinishedEvent, TestSuiteEvent, TestEvent } from 'vscode-test-adapter-api';
import { Log } from 'vscode-test-adapter-util';
import { ChildProcess } from 'child_process';
import { BrowserOptions } from './interfaces/settingsView';
import { loadTestCafeTests, runTestCafeTests, testProcessPID } from './testSuitInfo';

export class TestCafeAdapter implements TestAdapter {
	private disposables: { dispose(): void }[] = [];
	private readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
	private readonly testStatesEmitter = new vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();
	private readonly autorunEmitter = new vscode.EventEmitter<void>();
	private runningTestProcess: ChildProcess | undefined;

	get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> { return this.testsEmitter.event; }
	get testStates(): vscode.Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> { return this.testStatesEmitter.event; }
	get autorun(): vscode.Event<void> | undefined { return this.autorunEmitter.event; }

	constructor(
		public readonly workspace: vscode.WorkspaceFolder,
		private readonly log: Log,
		public extensionContext: vscode.ExtensionContext
	) {
		this.log.info('Initializing testcafe adapter');
		this.disposables.push(this.testsEmitter);
		this.disposables.push(this.testStatesEmitter);
		this.disposables.push(this.autorunEmitter);
		this.disposables.push(vscode.workspace.onDidSaveTextDocument(async () => await this.load()));

	}

	async load(): Promise<void> {
		this.log.info('Loading testcafe tests');
		this.testsEmitter.fire(<TestLoadStartedEvent>{ type: 'started' });
		const testFiles = await vscode.workspace.findFiles('tests/**/*.ts');
		const loadedTests = await loadTestCafeTests(testFiles);
		this.testsEmitter.fire(<TestLoadFinishedEvent>{ type: 'finished', suite: loadedTests });
	}

	async run(tests: string[]): Promise<void> {
    if (this.runningTestProcess !== undefined) return;
    this.testStatesEmitter.fire(<TestRunStartedEvent>{ type: 'started', tests });
		const testFiles = await vscode.workspace.findFiles('tests/**/*.ts');
		const loadedTests = await loadTestCafeTests(testFiles);
		const browserOptions = this.extensionContext.globalState.get<BrowserOptions>('browser');
    await runTestCafeTests(this.workspace, this.runningTestProcess, loadedTests, tests, this.testStatesEmitter, browserOptions);
		this.testStatesEmitter.fire(<TestRunFinishedEvent>{ type: 'finished' });
	}

	async debug(tests: string[]): Promise<void> {
		const debuggerConfig: vscode.DebugConfiguration = {
			type: "node",
			request: "launch",
			name: "TestCafe Debugger",
			skipFiles: [
				"<node_internals>/**"
			],
			program: "${workspaceFolder}/runner.ts",
			runtimeArgs: ["-r", "ts-node/register"],
			env: {
				FILTER: tests[0],
				BROWSER: this.extensionContext.globalState.get<BrowserOptions>('browser')?.name,
				HEADLESS: false
			},
			cwd: "${workspaceFolder}"
		};
		await vscode.debug.startDebugging(this.workspace, debuggerConfig);
	}

	cancel(): void {
		testProcessPID.forEach(testProcess => process.kill(testProcess));
	}

	dispose(): void {
		this.cancel();
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables = [];
	}
}
