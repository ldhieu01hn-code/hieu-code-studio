(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(function (el) { observer.observe(el); });
  }

  // Contact form submit
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        name: form.name.value,
        phone: form.phone.value,
        service: form.service.value,
        message: form.message.value,
        website: form.website.value
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang gửi...';
      status.textContent = '';
      status.removeAttribute('data-state');

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
          if (result.ok && result.body.ok) {
            form.reset();
            status.textContent = 'Cảm ơn bạn! Le Hiep Studio sẽ liên hệ lại qua Zalo/SĐT sớm nhất.';
            status.setAttribute('data-state', 'ok');
          } else {
            status.textContent = (result.body && result.body.error) || 'Có lỗi xảy ra, vui lòng thử lại.';
            status.setAttribute('data-state', 'err');
          }
        })
        .catch(function () {
          status.textContent = 'Không thể kết nối. Vui lòng nhắn Zalo trực tiếp cho studio.';
          status.setAttribute('data-state', 'err');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Gửi thông tin';
        });
    });
  }
})();
