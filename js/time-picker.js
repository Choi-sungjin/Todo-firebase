// time-picker.js — 원형 시계(시침/분침) 타임 피커

(function () {
  var overlay = document.getElementById("time-picker-overlay");
  var face = document.getElementById("clock-face");
  var handHour = document.getElementById("clock-hand-hour");
  var handMinute = document.getElementById("clock-hand-minute");
  var displayEl = document.getElementById("time-picker-display");
  var titleEl = document.getElementById("time-picker-title");
  var applyBtn = document.getElementById("time-picker-apply");
  var btnModeHour = document.getElementById("time-picker-mode-hour");
  var btnModeMinute = document.getElementById("time-picker-mode-minute");
  var btnAM = document.getElementById("time-picker-am");
  var btnPM = document.getElementById("time-picker-pm");
  var btn24 = document.getElementById("time-picker-24");

  var _targetInput = null;
  var _hour = 0;
  var _minute = 0;
  var _mode = "hour"; // "hour" | "minute" — 드래그 시 움직일 바늘
  var _use24h = false; // true면 표시만 24시 형식
  var _dragging = null; // "hour" | "minute"
  var _clockRect = null;
  var _clockCenter = { x: 0, y: 0 };
  var _clockRadius = 100;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function parseInputValue(val) {
    if (!val || !val.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) return { h: 0, m: 0, s: 0 };
    var parts = val.split(":");
    return {
      h: parseInt(parts[0], 10) % 24,
      m: Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0)),
      s: parts[2] != null ? Math.min(59, Math.max(0, parseInt(parts[2], 10) || 0)) : 0
    };
  }

  function setHands() {
    var hDeg = (_hour % 12) * 30 + _minute * 0.5;
    var mDeg = _minute * 6;
    handHour.style.transform = "translateX(-50%) rotate(" + hDeg + "deg)";
    handMinute.style.transform = "translateX(-50%) rotate(" + mDeg + "deg)";
  }

  function updateDisplay() {
    if (_use24h) {
      displayEl.textContent = pad2(_hour) + ":" + pad2(_minute);
    } else {
      var h12 = _hour % 12;
      if (h12 === 0) h12 = 12;
      var ampm = _hour < 12 ? "오전" : "오후";
      displayEl.textContent = ampm + " " + h12 + ":" + pad2(_minute);
    }
  }

  function updateModeButtons() {
    if (btnModeHour) btnModeHour.classList.toggle("active", _mode === "hour");
    if (btnModeMinute) btnModeMinute.classList.toggle("active", _mode === "minute");
  }

  function updateAmPmButtons() {
    if (btnAM) btnAM.classList.toggle("active", _hour < 12);
    if (btnPM) btnPM.classList.toggle("active", _hour >= 12);
    if (btn24) btn24.classList.toggle("active", _use24h);
  }

  function angleFromCenter(clientX, clientY) {
    var x = clientX - _clockCenter.x;
    var y = clientY - _clockCenter.y;
    var angle = Math.atan2(y, x);
    var deg = (angle * 180 / Math.PI + 90 + 360) % 360;
    return deg;
  }

  function distanceFromCenter(clientX, clientY) {
    var x = clientX - _clockCenter.x;
    var y = clientY - _clockCenter.y;
    return Math.sqrt(x * x + y * y);
  }

  function applyAngle(deg, hand) {
    if (hand === "hour") {
      var h12 = Math.round(deg / 30) % 12;
      if (h12 < 0) h12 += 12;
      var isPM = _hour >= 12;
      if (h12 === 0) {
        _hour = isPM ? 12 : 0;
      } else {
        _hour = isPM ? 12 + h12 : h12;
      }
      if (_hour > 23) _hour = 23;
    } else if (hand === "minute") {
      _minute = Math.round(deg / 6) % 60;
      if (_minute < 0) _minute += 60;
    }
  }

  function openPicker(inputEl) {
    _targetInput = inputEl;
    var val = inputEl.value || "00:00";
    var p = parseInputValue(val);
    _hour = p.h;
    _minute = p.m;
    titleEl.textContent = inputEl.id === "start-time-input" ? "시작 시간" : "종료 시간";
    setHands();
    updateDisplay();
    updateModeButtons();
    updateAmPmButtons();
    overlay.classList.remove("hidden");
    _clockRect = face.getBoundingClientRect();
    _clockCenter.x = _clockRect.left + _clockRect.width / 2;
    _clockCenter.y = _clockRect.top + _clockRect.height / 2;
    _clockRadius = _clockRect.width / 2;
  }

  function closePicker() {
    overlay.classList.add("hidden");
    _targetInput = null;
    _dragging = null;
  }

  function applyTime() {
    if (_targetInput) {
      _targetInput.value = pad2(_hour) + ":" + pad2(_minute);
      _targetInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closePicker();
  }

  function onPointerDown(e) {
    e.preventDefault();
    _clockRect = face.getBoundingClientRect();
    _clockCenter.x = _clockRect.left + _clockRect.width / 2;
    _clockCenter.y = _clockRect.top + _clockRect.height / 2;
    _clockRadius = _clockRect.width / 2;
    _dragging = _mode;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var deg = angleFromCenter(clientX, clientY);
    applyAngle(deg, _dragging);
    setHands();
    updateDisplay();
    updateAmPmButtons();
  }

  function onPointerMove(e) {
    if (!_dragging) return;
    e.preventDefault();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var deg = angleFromCenter(clientX, clientY);
    applyAngle(deg, _dragging);
    setHands();
    updateDisplay();
    updateAmPmButtons();
  }

  function onPointerUp() {
    _dragging = null;
  }

  if (face) {
    face.addEventListener("mousedown", onPointerDown);
    face.addEventListener("touchstart", onPointerDown, { passive: false });
  }
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("touchmove", onPointerMove, { passive: false });
  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("touchend", onPointerUp);

  if (applyBtn) applyBtn.addEventListener("click", applyTime);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePicker();
  });

  if (btnModeHour) btnModeHour.addEventListener("click", function () {
    _mode = "hour";
    updateModeButtons();
  });
  if (btnModeMinute) btnModeMinute.addEventListener("click", function () {
    _mode = "minute";
    updateModeButtons();
  });
  if (btnAM) btnAM.addEventListener("click", function () {
    if (_hour >= 12) _hour -= 12;
    setHands();
    updateDisplay();
    updateAmPmButtons();
  });
  if (btnPM) btnPM.addEventListener("click", function () {
    if (_hour < 12) _hour += 12;
    setHands();
    updateDisplay();
    updateAmPmButtons();
  });
  if (btn24) btn24.addEventListener("click", function () {
    _use24h = !_use24h;
    updateDisplay();
    updateAmPmButtons();
  });

  for (var i = 1; i <= 12; i++) {
    var num = document.createElement("div");
    num.className = "clock-number";
    num.textContent = i;
    var deg = 90 - (i % 12) * 30;
    var rad = deg * Math.PI / 180;
    var r = 42;
    num.style.left = (50 + r * Math.cos(rad)) + "%";
    num.style.top = (50 - r * Math.sin(rad)) + "%";
    num.style.transform = "translate(-50%, -50%)";
    if (face) face.appendChild(num);
  }

  window.openTimePicker = function (inputEl) {
    if (inputEl && (inputEl.id === "start-time-input" || inputEl.id === "end-time-input")) {
      openPicker(inputEl);
    }
  };
  window.closeTimePicker = closePicker;

  var startInput = document.getElementById("start-time-input");
  var endInput = document.getElementById("end-time-input");
  function openOnClick(e, el) {
    e.preventDefault();
    if (el.disabled) return;
    openPicker(el);
  }
  if (startInput) {
    startInput.addEventListener("click", function (e) { openOnClick(e, startInput); });
    startInput.addEventListener("focus", function (e) { e.preventDefault(); if (!startInput.disabled) openPicker(startInput); });
  }
  if (endInput) {
    endInput.addEventListener("click", function (e) { openOnClick(e, endInput); });
    endInput.addEventListener("focus", function (e) { e.preventDefault(); if (!endInput.disabled) openPicker(endInput); });
  }
})();
