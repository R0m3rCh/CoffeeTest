
(function () {
  const vscode = acquireVsCodeApi();
  const browserSelect = document.querySelector('#browser-select');
  const currentBrowser = document.querySelector('#current-browser');
  const visibilityIcon = document.querySelector("#visibility-icon");

  browserSelect.addEventListener('change', () => {
    currentBrowser.innerText = `(${browserSelect.value})`;
    vscode.postMessage({
      command: 'browser',
      browser: browserSelect.value,
      headless: visibilityIcon.classList.contains('gg-eye-alt') ? false : true
    });
  });

  visibilityIcon.addEventListener('click', () => {
    visibilityIcon.classList.contains('gg-eye-alt')
      ? visibilityIcon.className = 'gg-eye'
      : visibilityIcon.className = 'gg-eye-alt';
    vscode.postMessage({
        command: 'browser',
        browser: browserSelect.value,
        headless: visibilityIcon.classList.contains('gg-eye-alt') ? false : true
      });
  });
}());
