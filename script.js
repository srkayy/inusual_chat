// ── Utilities ──────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0,2) || '?';
}

function generateAvatarColor(username) {
  const colors = ['#2563EB','#0891B2','#059669','#D97706','#DC2626','#9333EA','#0284C7','#0369A1'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function relativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'agora';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}min`;
  return `${Math.floor(diff/3600)}h`;
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-wrap');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  const iconColor = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#2563EB';
  toast.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Theme ──────────────────────────────────────────────────────────────────

const themeBtn = document.getElementById('theme-btn');

function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('icon-sun').style.display  = dark ? 'none' : '';
  document.getElementById('icon-moon').style.display = dark ? '' : 'none';
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
}

themeBtn.addEventListener('click', () => {
  setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
});

const savedTheme = (function(){ try { return localStorage.getItem('theme'); } catch { return null; } })();
setTheme(savedTheme === 'dark');


// ── Username & name uniqueness ─────────────────────────────────────────────
// In a real multi-user setup this would be server-side via Socket.io.
// Here we simulate it with a BroadcastChannel (works across tabs on same origin)
// so two tabs can't claim the same name.

const usernameInput  = document.getElementById('username-input');
const usernameStatus = document.getElementById('username-status');

// Set of names currently "claimed" by other tabs (populated via BroadcastChannel)
const otherTabNames = new Set();
let myRegisteredName = null;

// BroadcastChannel lets tabs on the same origin communicate
let bc;
try { bc = new BroadcastChannel('inusualchat_names'); } catch { bc = null; }

if (bc) {
  bc.onmessage = (e) => {
    if (e.data.type === 'claim')   otherTabNames.add(e.data.name.toLowerCase());
    if (e.data.type === 'release') otherTabNames.delete(e.data.name.toLowerCase());
    // Re-validate current input if another tab just claimed a name
    validateUsername(usernameInput.value.trim());
  };
}

function claimName(name) {
  if (myRegisteredName) releaseName(myRegisteredName);
  myRegisteredName = name;
  if (bc) bc.postMessage({ type: 'claim', name });
}

function releaseName(name) {
  if (bc) bc.postMessage({ type: 'release', name });
  myRegisteredName = null;
}

window.addEventListener('beforeunload', () => {
  if (myRegisteredName) releaseName(myRegisteredName);
});

function isNameTaken(name) {
  return otherTabNames.has(name.toLowerCase());
}

function validateUsername(name) {
  if (!name) {
    usernameInput.className = '';
    usernameStatus.textContent = '';
    usernameStatus.className = 'username-status';
    return false;
  }
  if (isNameTaken(name)) {
    usernameInput.className = 'input-error';
    usernameStatus.textContent = 'Nome em uso';
    usernameStatus.className = 'username-status err';
    return false;
  }
  usernameInput.className = 'input-ok';
  usernameStatus.textContent = '✓';
  usernameStatus.className = 'username-status ok';
  return true;
}

usernameInput.addEventListener('input', () => {
  validateUsername(usernameInput.value.trim());
});

usernameInput.addEventListener('change', () => {
  const name = usernameInput.value.trim();
  if (!name) return;
  if (isNameTaken(name)) {
    showToast('Este nome já está em uso. Escolha outro.', 'error');
    usernameInput.focus();
    return;
  }
  claimName(name);
  try { localStorage.setItem('username', name); } catch {}
});

// Restore saved username
const savedUsername = (function(){ try { return localStorage.getItem('username'); } catch { return null; } })();
if (savedUsername) {
  usernameInput.value = savedUsername;
  // Small delay so BroadcastChannel listeners from other tabs can register first
  setTimeout(() => {
    if (!isNameTaken(savedUsername)) {
      claimName(savedUsername);
      validateUsername(savedUsername);
    } else {
      usernameInput.value = '';
      showToast('Seu nome anterior já está em uso nesta sessão.', 'info');
    }
  }, 200);
}

function getCurrentUsername() {
  return usernameInput.value.trim() || 'Anônimo';
}

// ── Chat ───────────────────────────────────────────────────────────────────

const chatInput    = document.getElementById('chat-input');
const enviarBtn    = document.getElementById('enviar-btn');
const mensagensDiv = document.getElementById('chat-mensagens');

function appendMessage(username, text, type = 'user') {
  if (type === 'system') {
    const div = document.createElement('div');
    div.className = 'msg-sys';
    div.textContent = text;
    mensagensDiv.appendChild(div);
  } else {
    const color    = generateAvatarColor(username);
    const initials = getInitials(username);
    const ts       = Date.now();
    const div      = document.createElement('div');
    div.className  = 'msg';
    div.innerHTML  = `
      <div class="msg-av" style="background:${color}" aria-hidden="true">${initials}</div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-name">${escapeHtml(username)}</span>
          <span class="msg-time">${relativeTime(ts)}</span>
        </div>
        <div class="msg-text">${escapeHtml(text)}</div>
      </div>`;
    mensagensDiv.appendChild(div);
  }
  mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const name = usernameInput.value.trim();
  if (!name) {
    showToast('Digite seu nome antes de enviar uma mensagem.', 'error');
    usernameInput.focus();
    return;
  }
  if (isNameTaken(name)) {
    showToast('Seu nome está em uso por outra aba. Escolha outro.', 'error');
    usernameInput.focus();
    return;
  }

  appendMessage(name, text);
  chatInput.value = '';
}

enviarBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });


// ── Video URL validation ───────────────────────────────────────────────────

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|\?v=|v\/)|youtu\.be\/)([^&?#\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function isMp4Url(url) {
  // Accept direct .mp4 URLs or URLs with ?...format=mp4 etc.
  return /\.mp4(\?|$|#)/i.test(url) || /video\/mp4/i.test(url);
}

function classifyUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const ytId = extractVideoId(trimmed);
  if (ytId) return { type: 'youtube', id: ytId };
  if (isMp4Url(trimmed)) return { type: 'mp4', url: trimmed };
  return null;
}

// ── Player ─────────────────────────────────────────────────────────────────

const ytPlayer   = document.getElementById('youtube-player');
const mp4Player  = document.getElementById('mp4-player');

function showYouTube() {
  ytPlayer.style.display  = '';
  mp4Player.style.display = 'none';
  mp4Player.pause();
  mp4Player.src = '';
}

function showMp4() {
  ytPlayer.style.display  = 'none';
  mp4Player.style.display = '';
  ytPlayer.src = '';
}

function updatePlayer(item) {
  if (!item) { showYouTube(); ytPlayer.src = ''; return; }
  if (item.type === 'youtube') {
    showYouTube();
    ytPlayer.src = `https://www.youtube.com/embed/${item.id}?autoplay=1&controls=1&rel=0&enablejsapi=1`;
  } else if (item.type === 'mp4') {
    showMp4();
    mp4Player.src = item.url;
    mp4Player.play().catch(() => {});
  }
}

// ── Playlist ───────────────────────────────────────────────────────────────

const urlInput         = document.getElementById('video-url-input');
const addVideoBtn      = document.getElementById('add-video-btn');
const playlistContainer = document.getElementById('playlist-container');
const playlistCount    = document.getElementById('playlist-count');

let playlist     = [];
let currentIndex = -1;

async function fetchYouTubeTitle(videoId) {
  try {
    const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.title) return data.title;
    }
  } catch {}
  return `Vídeo ${videoId}`;
}

function thumbFor(item) {
  if (item.type === 'youtube') return `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`;
  return ''; // no thumbnail for mp4
}

function renderPlaylist() {
  playlistContainer.innerHTML = '';
  playlistCount.textContent = playlist.length;

  playlist.forEach((item, i) => {
    const isActive = i === currentIndex;
    const div = document.createElement('div');
    div.className = 'pl-item' + (isActive ? ' active' : '');
    div.setAttribute('role', 'listitem');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `${i+1}. ${item.title}`);

    const thumb = thumbFor(item);
    const thumbHtml = thumb
      ? `<img class="pl-thumb" src="${thumb}" alt="" loading="lazy">`
      : `<div class="pl-thumb pl-thumb-mp4" aria-hidden="true">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
         </div>`;

    div.innerHTML = `
      <span class="pl-num" aria-hidden="true">${isActive
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
        : i+1}</span>
      ${thumbHtml}
      <div class="pl-info">
        <div class="pl-title">${escapeHtml(item.title || 'Carregando...')}</div>
        ${isActive ? '<div class="pl-now">▶ Tocando agora</div>' : ''}
      </div>
      <button class="pl-remove" data-idx="${i}" aria-label="Remover ${escapeHtml(item.title || 'vídeo')}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;

    div.addEventListener('click', e => { if (!e.target.closest('.pl-remove')) playFromPlaylist(i); });
    div.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.target.closest('.pl-remove')) playFromPlaylist(i); });
    div.querySelector('.pl-remove').addEventListener('click', e => {
      e.stopPropagation();
      removeFromPlaylist(parseInt(e.currentTarget.dataset.idx));
    });

    playlistContainer.appendChild(div);
  });
}

async function addToPlaylist(url) {
  const classified = classifyUrl(url);
  if (!classified) {
    showToast('URL inválida. Use links do YouTube ou arquivos .mp4.', 'error');
    return false;
  }

  // Duplicate check
  const isDupe = playlist.some(item =>
    (item.type === 'youtube' && classified.type === 'youtube' && item.id === classified.id) ||
    (item.type === 'mp4'     && classified.type === 'mp4'     && item.url === classified.url)
  );
  if (isDupe) { showToast('Este vídeo já está na fila.', 'info'); return false; }

  const idx = playlist.length;
  const entry = { ...classified, title: classified.type === 'mp4' ? url.split('/').pop().replace(/\?.*/, '') : 'Carregando...' };
  playlist.push(entry);
  renderPlaylist();

  if (classified.type === 'youtube') {
    fetchYouTubeTitle(classified.id).then(title => {
      playlist[idx].title = title;
      renderPlaylist();
      showToast(`"${title}" adicionado à fila.`, 'success');
    });
  } else {
    showToast(`"${entry.title}" adicionado à fila.`, 'success');
  }

  if (playlist.length === 1) playFromPlaylist(0);
  return true;
}

function removeFromPlaylist(idx) {
  const wasPlaying = idx === currentIndex;
  playlist.splice(idx, 1);
  if (wasPlaying) {
    if (playlist.length > 0) {
      currentIndex = Math.min(idx, playlist.length - 1);
      updatePlayer(playlist[currentIndex]);
    } else {
      currentIndex = -1;
      updatePlayer(null);
    }
  } else if (idx < currentIndex) {
    currentIndex--;
  }
  renderPlaylist();
}

function playFromPlaylist(idx) {
  if (idx < 0 || idx >= playlist.length) return;
  currentIndex = idx;
  updatePlayer(playlist[idx]);
  renderPlaylist();
}

// Auto-advance: YouTube end event
window.addEventListener('message', e => {
  if (!e.data || typeof e.data !== 'string') return;
  if (e.data.includes('"event":"onStateChange"') && e.data.includes('"data":0')) advance();
});

// Auto-advance: MP4 end event
mp4Player.addEventListener('ended', advance);

function advance() {
  if (playlist.length === 0 || currentIndex < 0) return;
  playlist.splice(currentIndex, 1);
  if (playlist.length > 0 && currentIndex < playlist.length) {
    playFromPlaylist(currentIndex);
  } else {
    currentIndex = -1;
    updatePlayer(null);
    renderPlaylist();
  }
}

// Add video
function handleAddVideo() {
  const url = urlInput.value.trim();
  if (url) { addToPlaylist(url); urlInput.value = ''; }
}

addVideoBtn.addEventListener('click', handleAddVideo);
urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleAddVideo(); });
