// --- Utility: throttle updates ---
function throttle(fn, wait) {
  let lastTime = Date.now();
  return function (...args) {
    if ((lastTime + wait - Date.now()) < 0) {
      fn(...args);
      lastTime = Date.now();
    }
  };
}

// --- Get all user prompts ---
function getUserMessages() {
  return Array.from(document.querySelectorAll('div[data-message-author-role="user"]'));
}

// --- Create Sidebar ---
function createSidebar() {
  // Remove sidebar if already open
  const oldSidebar = document.getElementById('cgpt-sidebar-index');
  if (oldSidebar) oldSidebar.remove();

  const sidebar = document.createElement('div');
  sidebar.id = 'cgpt-sidebar-index';
  sidebar.style.cssText = `
    position: fixed; top: 0; right: 0; width: 340px; height: 100vh;
    background: #11111b; color: #fff;
    border-left: 2px solid #373737; z-index: 10000;
    display: flex; flex-direction: column;
    font-family: sans-serif;
    transition: background 0.2s, color 0.2s;
  `;

  // --- Header with Your Prompts, count & small refresh button
  const headerRow = document.createElement('div');
  headerRow.style.cssText = `
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px; font-size:1.15em; font-weight:bold;
    border-bottom: 1px solid #373737;
  `;

  const leftHeader = document.createElement('div');
  leftHeader.style.display = "flex";
  leftHeader.style.alignItems = "center";
  leftHeader.style.gap = "8px";

  const title = document.createElement('span');
  title.textContent = "Your Prompts ";

  const promptCount = document.createElement('span');
  promptCount.id = 'cgpt-prompt-count';
  promptCount.style.cssText = `font-weight: normal; font-size: 0.9em; color: #ccc;`;

  leftHeader.appendChild(title);
  leftHeader.appendChild(promptCount);

  // Small refresh button inside header
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = "↻";
  refreshBtn.title = "Refresh list";
  refreshBtn.style.cssText = `
    background: #28285a; color: white;
    padding: 2px 8px; font-size: 0.8em;
    border: none; border-radius: 6px;
    cursor: pointer;
  `;
  refreshBtn.onclick = updateSidebar;
  leftHeader.appendChild(refreshBtn);

  headerRow.appendChild(leftHeader);
  sidebar.appendChild(headerRow);

  // --- Search box, with dynamic text color on typing
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search prompts...';
  searchInput.id = 'cgpt-search-box';
  searchInput.style.cssText = `
    width: 92%; padding: 6px 8px; margin: 10px auto;
    border-radius: 6px; border: none; font-size: 0.9em; display:block;
    background: transparent; color: white; transition: color 0.24s;
  `;
  searchInput.addEventListener('input', function() {
    if (searchInput.value.trim()) {
      searchInput.classList.add("active-searching");
    } else {
      searchInput.classList.remove("active-searching");
    }
    updateSidebar();
  });
  // Initial state check
  if (searchInput.value.trim()) {
    searchInput.classList.add("active-searching");
  }
  sidebar.appendChild(searchInput);

  // --- Scrollable list of prompts
  const list = document.createElement('div');
  list.id = 'cgpt-index-list';
  list.style.flex = '1';
  list.style.overflowY = 'auto';
  list.style.padding = '0 14px 8px 14px';
  sidebar.appendChild(list);

  // --- Footer: Close (left), Clear (middle), Theme (right)
  const bottomBar = document.createElement('div');
  bottomBar.style.cssText = `
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    padding: 12px 14px; border-top: 1px solid #373737;
    gap: 8px;
  `;

  // Close button bottom-left
  const closeBtn = document.createElement('button');
  closeBtn.innerText = "×";
  closeBtn.title = "Close sidebar";
  closeBtn.style.cssText = `
    background:none; border:none; font-size:24px; color:#fff; cursor:pointer;
    padding: 2px 10px; border-radius: 50%; transition: background 0.18s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = "#23234b";
  closeBtn.onmouseout = () => closeBtn.style.background = "none";
  closeBtn.onclick = () => sidebar.remove();
  bottomBar.appendChild(closeBtn);

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.innerText = "Clear";
  clearBtn.title = "Clear search and reset list";
  clearBtn.style.cssText = `
    background: #444; color: white;
    padding: 6px 12px; font-size: 0.85em; cursor: pointer;
    border-radius: 6px; border: none;
  `;
  clearBtn.onclick = () => {
    searchInput.value = "";
    searchInput.classList.remove("active-searching");
    updateSidebar();
  };
  bottomBar.appendChild(clearBtn);

  // Theme toggle
  const themeToggle = document.createElement('button');
  themeToggle.id = 'cgpt-theme-toggle';
  themeToggle.innerText = 'Light Mode';
  themeToggle.title = "Toggle sidebar theme";
  themeToggle.style.cssText = `
    padding: 6px 12px; font-size: 0.85em; cursor: pointer;
    border-radius: 8px; border: none;
    background: #4a4a7b; color: white;
  `;
  themeToggle.onclick = () => toggleTheme(sidebar, themeToggle);
  bottomBar.appendChild(themeToggle);

  sidebar.appendChild(bottomBar);

  document.body.appendChild(sidebar);
  updateSidebar();
}

// --- Theme Toggle ---
function toggleTheme(sidebar, btn) {
  if (sidebar.classList.contains('light-theme')) {
    sidebar.classList.remove('light-theme');
    btn.innerText = 'Light Mode';
  } else {
    sidebar.classList.add('light-theme');
    btn.innerText = 'Dark Mode';
  }
}

// --- Populate Sidebar ---
function updateSidebar() {
  const list = document.getElementById('cgpt-index-list');
  const searchInput = document.getElementById('cgpt-search-box');
  const promptCount = document.getElementById('cgpt-prompt-count');
  if (!list) return;

  const filterText = searchInput?.value.trim().toLowerCase() || '';
  list.innerHTML = '';
  const prompts = getUserMessages();

  const filteredPrompts = prompts.filter(node =>
    node.innerText.toLowerCase().includes(filterText)
  );

  filteredPrompts.forEach((node) => {
    const text = node.innerText.trim().slice(0, 70).replace(/\n/g, ' ');
    const entry = document.createElement('div');
    entry.innerText = text || "(empty prompt)";
    entry.style.cssText = `
      padding:8px 6px;
      margin-bottom:4px;
      background:#23234b;
      border-radius:4px;
      cursor:pointer;
      font-size:0.95em;
      transition:background 0.1s;
    `;
    entry.onclick = () => {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.style.outline = '2px solid #04eafe';
      setTimeout(() => node.style.outline = '', 1800);
    };
    entry.onmouseover = () => entry.style.background = '#32326d';
    entry.onmouseout = () => entry.style.background = '#23234b';
    list.appendChild(entry);
  });

  if (promptCount) {
    promptCount.textContent = `(${filteredPrompts.length})`;
  }
}

// --- Mutation Observer for live updates ---
const throttledUpdate = throttle(updateSidebar, 1200);
const observer = new MutationObserver(throttledUpdate);

// --- Floating Index button (ALWAYS visible, top-right) ---
function addSidebarLauncher() {
  if (document.getElementById('cgpt-sidebar-launcher')) return;
  const btn = document.createElement('button');
  btn.id = 'cgpt-sidebar-launcher';
  btn.innerText = 'Index';
  btn.title = "Open ChatGPT Sidebar Index";
  btn.style.cssText = `
    position: fixed; top: 60px; right: 18px; z-index: 10001;
    background: #28285a; color: #fff;
    padding: 9px 18px;
    border-radius: 22px;
    font-weight: bold; border:none; cursor:pointer;
    box-shadow:0 2px 8px #0002;
  `;
  btn.onclick = createSidebar;
  document.body.appendChild(btn);
}

// --- Light Theme and search active style ---
const style = document.createElement('style');
style.textContent = `
  #cgpt-sidebar-index.light-theme {
    background: #f0f0f0 !important;
    color: #1a1a2e !important;
    border-left: 2px solid #ccc !important;
  }
  #cgpt-sidebar-index.light-theme #cgpt-index-list > div {
    background: #e0e0e0 !important;
    color: #1a1a2e !important;
  }
  #cgpt-sidebar-index.light-theme #cgpt-index-list > div:hover {
    background: #c0c0c0 !important;
  }
  #cgpt-sidebar-index.light-theme #cgpt-theme-toggle {
    background: #ddd !important;
    color: #1a1a2e !important;
  }
  #cgpt-sidebar-index.light-theme button { color: #1a1a2e !important; }

  #cgpt-search-box.active-searching {
    color: #42a3fa !important;
    font-weight: bold;
  }
  #cgpt-sidebar-index.light-theme #cgpt-search-box.active-searching {
    color: #20508d !important;
  }
`;
document.head.appendChild(style);

// --- Run ---
window.addEventListener('load', () => {
  addSidebarLauncher(); // Floating Index button always visible
  createSidebar();      // Auto-open on first load
  const chatContainer = document.querySelector('main') || document.body;
  if (chatContainer) {
    observer.observe(chatContainer, { childList: true, subtree: true });
  }
});
