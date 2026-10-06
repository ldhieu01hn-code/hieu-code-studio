(function () {
  'use strict';

  var fab = document.getElementById('care-fab');
  var panel = document.getElementById('care-panel');
  var aiBtn = document.getElementById('care-ai-btn');
  var aiPanel = document.getElementById('ai-chat-panel');
  var aiClose = document.getElementById('ai-chat-close');
  var aiForm = document.getElementById('ai-chat-form');
  var aiInput = document.getElementById('ai-chat-input');
  var aiLog = document.getElementById('ai-chat-log');

  if (!fab || !panel) return;

  function closeCarePanel() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
  }

  fab.addEventListener('click', function () {
    var willOpen = panel.hidden;
    panel.hidden = !willOpen;
    fab.setAttribute('aria-expanded', String(willOpen));
  });

  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
      closeCarePanel();
    }
  });

  if (!aiBtn || !aiPanel) return;

  var history = [];

  function appendBubble(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-' + role;
    bubble.textContent = text;
    aiLog.appendChild(bubble);
    aiLog.scrollTop = aiLog.scrollHeight;
    return bubble;
  }

  aiBtn.addEventListener('click', function () {
    closeCarePanel();
    aiPanel.hidden = false;
    aiInput.focus();
  });

  aiClose.addEventListener('click', function () {
    aiPanel.hidden = true;
  });

  aiForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = aiInput.value.trim();
    if (!message) return;

    appendBubble('user', message);
    history.push({ role: 'user', content: message });
    aiInput.value = '';
    aiInput.disabled = true;

    var loadingBubble = appendBubble('assistant', 'Đang trả lời...');
    loadingBubble.classList.add('chat-bubble-loading');

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, history: history })
    })
      .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (result) {
        loadingBubble.remove();

        if (result.ok && result.body.ok) {
          appendBubble('assistant', result.body.reply);
          history.push({ role: 'assistant', content: result.body.reply });
        } else {
          appendBubble('assistant', (result.body && result.body.error) || 'Có lỗi xảy ra, vui lòng thử lại.');
        }
      })
      .catch(function () {
        loadingBubble.remove();
        appendBubble('assistant', 'Không thể kết nối. Vui lòng thử lại hoặc nhắn Zalo trực tiếp.');
      })
      .finally(function () {
        aiInput.disabled = false;
        aiInput.focus();
      });
  });
})();
