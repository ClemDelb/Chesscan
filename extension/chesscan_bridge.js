async function injectBoard() {
  const { pendingBoardHtml } = await chrome.storage.local.get('pendingBoardHtml');
  if (!pendingBoardHtml) return;

  const textarea = document.getElementById('html-input');
  if (!textarea) return;

  textarea.value = pendingBoardHtml;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  await chrome.storage.local.remove('pendingBoardHtml');
}

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'INJECT_BOARD') injectBoard();
});

injectBoard();
