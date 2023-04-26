import * as vscode from 'vscode';
const browserTools = require('testcafe-browser-tools');

export class SettingsView implements vscode.WebviewViewProvider {
  public static readonly viewType = 'coffeeTest.settingsView';
  // private _view?: vscode.WebviewView;
  public extensionContext: vscode.ExtensionContext;

  constructor(
		private readonly _extensionUri: vscode.Uri,
    extensionContext: vscode.ExtensionContext
	) {
    this.extensionContext = extensionContext;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken): Promise<void> {
      // this._view = webviewView;
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          this._extensionUri
        ]
      };
      webviewView.webview.html = await this._getHtmlForWebView(webviewView.webview);
      webviewView.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'browser':
            this.extensionContext.globalState.update('browser', {name: message.browser, headless: message.headless});
            vscode.window.showInformationMessage(`Current Settings: ${message.browser} ${message.headless === true ? 'headless' : 'headed'}`);
            break;
        }
      });
  }

  private async  _getHtmlForWebView(webview: vscode.Webview) {
    const nonce = getNonce();
    const mainStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    const mainScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${mainStyleUri}" rel="stylesheet">
      <title>Browser Settings</title>
    </head>
    <body>
      <p>Browser Settings <b id="current-browser"></b></p>
      <div class="container">
        <select name="browser" id="browser-select">
          <option disabled selected value>shoose a browser</option>
          ${await getBrowserOptions()}
        </select>
        <i class="gg-eye-alt" id="visibility-icon"></i>
      </div>
      <script nonce="${nonce}" src="${mainScriptUri}" defer></script>
    </body>
    </html>`;
  }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

async function getBrowserOptions() {
  const installedBrowsers = await browserTools.getInstallations();
  if(Object.keys(installedBrowsers).length < 1) return '<option selected="true" disabled="disabled">No Browsers</option>';
  let browserOptions = ''
  for (const browser in installedBrowsers) {
    browserOptions += `<option value="${browser}">${browser}</option>`;
  }
  return browserOptions;
}
