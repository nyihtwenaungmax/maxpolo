const thread = document.getElementById('thread');
const empty = document.getElementById('empty');
const form = document.getElementById('form');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const main = document.getElementById('main');

// Auto-grow textarea
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
});

// Enter to send, Shift+Enter for newline
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// Starter prompt chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    input.value = chip.dataset.q;
    form.requestSubmit();
  });
});

function addMessage(role, text) {
  if (empty) empty.remove();
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.innerHTML = `<span class="role">${role === 'user' ? 'You' : 'Sun'}</span><div class="bubble"></div>`;
  msg.querySelector('.bubble').textContent = text;
  thread.appendChild(msg);
  main.scrollTop = main.scrollHeight;
  return msg;
}

function addThinking() {
  const msg = document.createElement('div');
  msg.className = 'msg bot thinking';
  msg.innerHTML = `<span class="role">Sun</span><div class="bubble">Thinking…</div>`;
  thread.appendChild(msg);
  main.scrollTop = main.scrollHeight;
  return msg;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  const thinkingEl = addThinking();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    
    thinkingEl.remove();
    addMessage('bot', data.reply || "I didn't get a response. Please try again.");
  } catch (err) {
    thinkingEl.remove();
    addMessage('bot', `Something went wrong reaching the knowledge base: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

// Register service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}
