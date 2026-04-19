const i18n = key => chrome.i18n.getMessage(key);

const btn    = document.getElementById('btn-analyze');
const status = document.getElementById('status');

btn.textContent = i18n('btnLabel');

function setStatus(type, text) {
  status.className = `status-${type}`;
  status.textContent = text;
}

async function init() {
  setStatus('loading', i18n('checking'));
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.includes('chess.com')) {
    setStatus('warning', i18n('notChess'));
    return;
  }

  setStatus('ok', i18n('ready'));
  btn.disabled = false;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    setStatus('loading', i18n('extracting'));

    try {
      const [{ result: html }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const board = document.querySelector('wc-chess-board');
          return board ? board.outerHTML : null;
        }
      });

      if (!html) {
        setStatus('error', i18n('noBoard'));
        btn.disabled = false;
        return;
      }

      await chrome.storage.local.set({ pendingBoardHtml: html });

      const [existing] = await chrome.tabs.query({ url: 'https://chesscan.app/*' });
      if (existing) {
        await chrome.tabs.update(existing.id, { active: true });
        await chrome.windows.update(existing.windowId, { focused: true });
        chrome.tabs.sendMessage(existing.id, { type: 'INJECT_BOARD' });
      } else {
        await chrome.tabs.create({ url: 'https://chesscan.app/' });
      }

      window.close();
    } catch (err) {
      setStatus('error', err.message || i18n('error'));
      btn.disabled = false;
    }
  });
}

init();
