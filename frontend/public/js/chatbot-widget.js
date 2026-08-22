// Floating chatbot widget -- talks to POST /api/chatbot/message.
// Include this after api.js on any page that has the chat-toggle / chat-panel markup.

(function () {
  const sessionKey = 'vs_chat_session';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem(sessionKey, sessionId);
  }

  const toggleBtn = document.getElementById('chat-toggle');
  const panel = document.getElementById('chat-panel');
  const messagesEl = document.getElementById('chat-messages');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  if (!toggleBtn || !panel) return; // widget markup not present on this page

  function appendMessage(sender, content) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    const span = document.createElement('span');
    span.textContent = content;
    div.appendChild(span);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function loadHistory() {
    try {
      const history = await apiRequest(`/chatbot/history/${sessionId}`, { auth: false });
      if (history.length === 0) {
        appendMessage('assistant', "Hello! I'm the Vakeel Sahab assistant. Ask me about our legal or website services.");
        return;
      }
      history.forEach(m => appendMessage(m.sender, m.content));
    } catch (_) {
      appendMessage('assistant', "Hello! I'm the Vakeel Sahab assistant. Ask me about our legal or website services.");
    }
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    appendMessage('user', text);
    inputEl.value = '';
    sendBtn.disabled = true;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg assistant';
    typingDiv.innerHTML = '<span>Typing...</span>';
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const data = await apiRequest('/chatbot/message', {
        method: 'POST',
        auth: true, // sends token if logged in; backend treats it as optional
        body: { sessionId, message: text },
      });
      typingDiv.remove();
      appendMessage('assistant', data.reply);
    } catch (err) {
      typingDiv.remove();
      appendMessage('assistant', "Sorry, I'm having trouble responding right now. Please try again or use the contact form.");
    } finally {
      sendBtn.disabled = false;
    }
  }

  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && messagesEl.children.length === 0) {
      loadHistory();
    }
  });
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
