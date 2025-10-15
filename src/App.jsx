import { useEffect } from 'react';

const scriptSources = [
  '/js/Box2dWeb.min.js',
  '/js/Three.js',
  '/js/jquery.js',
  '/js/keyboard.js',
  '/js/maze.js',
  '/js/game.js'
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', reject, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.src = src;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.body.appendChild(script);
  });
}

export default function App() {
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (window.__labyrinthInitialized) {
        return;
      }

      try {
        for (const src of scriptSources) {
          await loadScript(src);
          if (cancelled) {
            return;
          }
        }

        if (!cancelled && typeof window.initializeLabyrinthGame === 'function') {
          window.initializeLabyrinthGame();
        }
      } catch (error) {
        console.error('Failed to load Gemma\'s Labyrinth', error);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="game-container">
      <div id="instructions"></div>
      <div id="help"></div>
      <div id="level"></div>
      <div id="coin-counter"></div>
      <button id="inventory-button" type="button"></button>
      <button id="shop-button" type="button"></button>
      <div id="menu-button"></div>

      <div id="touch-controls" role="group" aria-label="Touch movement controls">
        <button
          type="button"
          className="touch-control-button touch-up"
          data-touch-slot="up"
          data-direction="up"
          aria-label="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          className="touch-control-button touch-left"
          data-touch-slot="left"
          data-direction="left"
          aria-label="Move left"
        >
          ◀
        </button>
        <button
          type="button"
          className="touch-control-button touch-down"
          data-touch-slot="down"
          data-direction="down"
          aria-label="Move down"
        >
          ▼
        </button>
        <button
          type="button"
          className="touch-control-button touch-right"
          data-touch-slot="right"
          data-direction="right"
          aria-label="Move right"
        >
          ▶
        </button>
      </div>

      <div id="start-menu" className="menu-overlay">
        <div className="menu-panel">
          <h1 id="menu-title"></h1>
          <div className="menu-section">
            <label id="player-select-label" htmlFor="player-select"></label>
            <select id="player-select"></select>
            <button id="delete-player" type="button" className="danger"></button>
          </div>
          <div className="menu-section">
            <label id="create-player-heading" htmlFor="player-name-input"></label>
            <input type="text" id="player-name-input" placeholder="" />
            <button id="create-player" type="button"></button>
          </div>
          <div id="current-player-info"></div>
          <div id="menu-message"></div>
          <div className="menu-section">
            <h2 id="top-players-heading"></h2>
            <ul id="start-menu-toplist"></ul>
          </div>
          <div className="menu-buttons">
            <button id="start-game" type="button"></button>
            <button id="resume-game" type="button" className="secondary"></button>
            <button id="save-game" type="button" className="secondary"></button>
            <button id="load-game" type="button" className="secondary"></button>
            <button id="open-settings" type="button" className="secondary"></button>
            <button id="open-scoreboard" type="button" className="secondary"></button>
            <button id="open-inventory" type="button" className="secondary"></button>
            <button id="open-shop" type="button" className="secondary"></button>
          </div>
        </div>
      </div>

      <div id="settings-menu" className="menu-overlay">
        <div className="menu-panel">
          <h2 id="settings-title"></h2>
          <div className="settings-group">
            <label>
              <input id="settings-victory-llm" type="checkbox" />
              <span id="settings-victory-text"></span>
            </label>
          </div>
          <div className="settings-group">
            <label>
              <input id="settings-tilt-control" type="checkbox" />
              <span id="settings-tilt-label"></span>
            </label>
            <div id="settings-tilt-note" className="settings-note"></div>
          </div>
          <div className="settings-group">
            <label id="settings-language-label" htmlFor="settings-language"></label>
            <select id="settings-language">
              <option value="de"></option>
              <option value="en"></option>
            </select>
          </div>
          <div className="settings-group">
            <h3 id="settings-controls-heading"></h3>
            <p id="settings-controls-description" className="settings-note"></p>
            <div className="keybinding-grid">
              <div className="keybinding-row">
                <span className="keybinding-label" id="settings-key-up-label"></span>
                <button type="button" className="keybinding-button" data-direction="up"></button>
              </div>
              <div className="keybinding-row">
                <span className="keybinding-label" id="settings-key-down-label"></span>
                <button type="button" className="keybinding-button" data-direction="down"></button>
              </div>
              <div className="keybinding-row">
                <span className="keybinding-label" id="settings-key-left-label"></span>
                <button type="button" className="keybinding-button" data-direction="left"></button>
              </div>
              <div className="keybinding-row">
                <span className="keybinding-label" id="settings-key-right-label"></span>
                <button type="button" className="keybinding-button" data-direction="right"></button>
              </div>
              <div className="keybinding-row">
                <span className="keybinding-label" id="settings-key-bomb-label"></span>
                <button type="button" className="keybinding-button" data-direction="bomb"></button>
              </div>
            </div>
            <div id="settings-keybinding-message" className="settings-note"></div>
            <button id="settings-reset-keybindings" type="button" className="secondary keybinding-reset"></button>
          </div>

          <div className="settings-group">
            <h3 id="settings-touch-heading"></h3>
            <p id="settings-touch-description" className="settings-note"></p>
            <div className="touchbinding-grid">
              <div className="touchbinding-row">
                <label className="touchbinding-label" id="settings-touch-up-label" htmlFor="settings-touch-up"></label>
                <select id="settings-touch-up" className="touch-binding-select" data-slot="up">
                  <option value="up"></option>
                  <option value="down"></option>
                  <option value="left"></option>
                  <option value="right"></option>
                </select>
              </div>
              <div className="touchbinding-row">
                <label className="touchbinding-label" id="settings-touch-down-label" htmlFor="settings-touch-down"></label>
                <select id="settings-touch-down" className="touch-binding-select" data-slot="down">
                  <option value="up"></option>
                  <option value="down"></option>
                  <option value="left"></option>
                  <option value="right"></option>
                </select>
              </div>
              <div className="touchbinding-row">
                <label className="touchbinding-label" id="settings-touch-left-label" htmlFor="settings-touch-left"></label>
                <select id="settings-touch-left" className="touch-binding-select" data-slot="left">
                  <option value="up"></option>
                  <option value="down"></option>
                  <option value="left"></option>
                  <option value="right"></option>
                </select>
              </div>
              <div className="touchbinding-row">
                <label className="touchbinding-label" id="settings-touch-right-label" htmlFor="settings-touch-right"></label>
                <select id="settings-touch-right" className="touch-binding-select" data-slot="right">
                  <option value="up"></option>
                  <option value="down"></option>
                  <option value="left"></option>
                  <option value="right"></option>
                </select>
              </div>
            </div>
            <button id="settings-reset-touchbindings" type="button" className="secondary touchbinding-reset"></button>
          </div>
          <div className="menu-buttons">
            <button id="settings-save" type="button"></button>
            <button id="settings-cancel" type="button" className="secondary"></button>
          </div>
        </div>
      </div>

      <div id="scoreboard-menu" className="menu-overlay">
        <div className="menu-panel">
          <h2 id="scoreboard-title"></h2>
          <table>
            <thead>
              <tr>
                <th id="scoreboard-th-rank"></th>
                <th id="scoreboard-th-player"></th>
                <th id="scoreboard-th-level"></th>
                <th id="scoreboard-th-time"></th>
              </tr>
            </thead>
            <tbody id="scoreboard-body"></tbody>
          </table>
          <div className="menu-buttons">
            <button id="scoreboard-close" type="button" className="secondary"></button>
          </div>
        </div>
      </div>

      <div id="inventory-menu" className="menu-overlay">
        <div className="menu-panel inventory-panel">
          <h2 id="inventory-title"></h2>
          <div className="inventory-balance">
            <span id="inventory-coins-label"></span>: <span id="inventory-coins-value">0</span>
          </div>
          <div id="inventory-message" className="menu-message"></div>
          <div className="inventory-section">
            <h3 id="inventory-bombs-heading"></h3>
            <p id="inventory-bomb-count"></p>
            <button id="inventory-use-bomb" type="button"></button>
          </div>
          <div className="inventory-section">
            <h3 id="inventory-boosters-heading"></h3>
            <p id="inventory-no-boosters" className="inventory-empty"></p>
            <ul id="inventory-booster-list"></ul>
          </div>
          <div className="menu-buttons">
            <button id="inventory-open-shop" type="button"></button>
            <button id="inventory-close" type="button" className="secondary"></button>
          </div>
        </div>
      </div>

      <div id="shop-menu" className="menu-overlay">
        <div className="menu-panel shop-panel">
          <h2 id="shop-title"></h2>
          <div id="shop-description"></div>
          <div id="shop-balance"></div>
          <div id="shop-message" className="menu-message"></div>
          <ul id="shop-items"></ul>
          <div className="menu-buttons">
            <button id="shop-back" type="button" className="secondary"></button>
            <button id="shop-close" type="button" className="secondary"></button>
          </div>
        </div>
      </div>

      <div id="victory"></div>
    </div>
  );
}
