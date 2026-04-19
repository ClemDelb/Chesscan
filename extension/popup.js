const isFr = navigator.language.startsWith('fr');

const T = {
  checking:   isFr ? 'Vérification de l\'onglet…'              : 'Checking current tab…',
  notChess:   isFr ? 'Rendez-vous sur chess.com d\'abord.'     : 'Go to chess.com to analyze a position.',
  ready:      isFr ? 'chess.com détecté — prêt.'               : 'chess.com detected — ready.',
  extracting: isFr ? 'Extraction du plateau…'                  : 'Extracting board…',
  noBoard:    isFr ? 'Aucun plateau trouvé. Ouvre une partie.' : 'No board found. Open a game first.',
  btnLabel:   isFr ? 'Analyser la position'                    : 'Analyze position',
  error:      isFr ? 'Erreur inattendue.'                      : 'Unexpected error.',
};

const btn    = document.getElementById('btn-analyze');
const status = document.getElementById('status');

btn.textContent = T.btnLabel;

function setStatus(type, text) {
  status.className = `status-${type}`;
  status.textContent = text;
}

async function init() {
  setStatus('loading', T.checking);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.includes('chess.com')) {
    setStatus('warning', T.notChess);
    return;
  }

  setStatus('ok', T.ready);
  btn.disabled = false;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    setStatus('loading', T.extracting);

    try {
      const [{ result: html }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const board = document.querySelector('wc-chess-board');
          return board ? board.outerHTML : null;
        }
      });

      if (!html) {
        setStatus('error', T.noBoard);
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
      setStatus('error', err.message || T.error);
      btn.disabled = false;
    }
  });
}

init();
