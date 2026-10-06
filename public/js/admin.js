(function () {
  'use strict';

  var form = document.getElementById('chat-test-form');
  var input = document.getElementById('chat-test-input');
  var log = document.getElementById('chat-test-log');

  if (!form) return;

  var history = [];

  function appendBubble(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-' + role;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function appendSystemNote(text) {
    var note = document.createElement('div');
    note.className = 'chat-bubble chat-bubble-system';
    note.textContent = text;
    log.appendChild(note);
    log.scrollTop = log.scrollHeight;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = input.value.trim();
    if (!message) return;

    appendBubble('user', message);
    history.push({ role: 'user', content: message });
    input.value = '';
    input.disabled = true;

    var loadingBubble = appendBubble('assistant', 'Đang trả lời...');
    loadingBubble.classList.add('chat-bubble-loading');

    fetch('/admin/api/chat-test', {
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

          if (result.body.wouldSaveLead) {
            var l = result.body.wouldSaveLead;
            appendSystemNote(
              '✓ Sẽ lưu lead — Tên: ' + l.name + ' · SĐT: ' + l.phone +
              (l.bookingDate ? ' · Ngày hẹn: ' + l.bookingDate : '') +
              (l.note ? ' · Ghi chú: ' + l.note : '')
            );
          }
        } else {
          appendSystemNote('Lỗi: ' + ((result.body && result.body.error) || 'Không thể kết nối AI.'));
        }
      })
      .catch(function () {
        loadingBubble.remove();
        appendSystemNote('Không thể kết nối tới máy chủ.');
      })
      .finally(function () {
        input.disabled = false;
        input.focus();
      });
  });
})();
