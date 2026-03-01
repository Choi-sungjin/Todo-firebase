// app.js — 메인 로직 (Firebase 실시간 리스닝 + 스케줄 차트 연동)

const today = new Date();

/** 로컬 날짜 기준 YYYY-MM-DD (오늘 시간 기준, 타임존 반영) */
function getLocalDateStr(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

document.getElementById("header-date").textContent = today.toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long"
});

function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  var btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
function initThemeToggle() {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.textContent = getTheme() === "dark" ? "☀️" : "🌙";
  btn.addEventListener("click", function () {
    var next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  });
}
initThemeToggle();

let currentTab = "today";
let selectedSubtasks = [];
let currentTemplate = null;
let editingTodoId = null;
window.selectedTodoId = null;
window.expandedTodoId = null;
window.filterByDate = null;

listenTodos(function (todos) {
  renderTodos(todos);
  if (typeof window.renderChart === "function") window.renderChart();
});

// 탭이 다시 활성화될 때(다른 탭에서 돌아올 때) 바로 목록·차트 다시 그리기
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    renderTodos(getTodosArray());
    if (typeof window.renderChart === "function") window.renderChart();
  }
});

// 창에 포커스 돌아올 때도 반영 (다른 창에서 돌아온 경우)
window.addEventListener("focus", function () {
  renderTodos(getTodosArray());
  if (typeof window.renderChart === "function") window.renderChart();
});

initSchedule();

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentTab = tab.dataset.tab;
    window.filterByDate = null;
    renderTodos(getTodosArray());
  });
});

document.getElementById("open-modal").addEventListener("click", openModal);
document.getElementById("close-modal").addEventListener("click", closeModal);

(function () {
  var overlay = document.getElementById("modal-overlay");
  var modal = document.getElementById("modal");
  var mouseDownOnOverlay = false;
  var pointerDownOnModal = false;
  // 포인터가 모달(또는 내부)에서 시작했으면 overlay 클릭으로 닫지 않음 (드래그 후 화면 밖에서 떼면 닫히는 문제 방지)
  overlay.addEventListener("mousedown", function (e) {
    pointerDownOnModal = modal && modal.contains(e.target);
    mouseDownOnOverlay = (e.target === overlay);
  }, true);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay && mouseDownOnOverlay && !pointerDownOnModal) closeModal();
    mouseDownOnOverlay = false;
    pointerDownOnModal = false;
  });
  overlay.addEventListener("touchstart", function (e) {
    pointerDownOnModal = modal && modal.contains(e.target);
    mouseDownOnOverlay = (e.target === overlay);
  }, true);
})();

function openModal() {
  if (typeof window._hideChartTooltip === "function") window._hideChartTooltip();
  openModalWithDate(getLocalDateStr(today));
}

/** 전체일정에서 날짜 클릭 시 해당 날짜로 새 할일 등록용 (항상 빈 폼으로 열기) */
function openModalWithDate(dateStr) {
  editingTodoId = null;
  if (typeof window._hideChartTooltip === "function") window._hideChartTooltip();
  resetForm();
  document.getElementById("modal-title").textContent = "새 할일";
  document.getElementById("add-btn").textContent = "추가하기";
  const startEl = document.getElementById("start-date-input");
  const deadlineEl = document.getElementById("deadline-input");
  var d = dateStr || getLocalDateStr(today);
  if (startEl) startEl.value = d;
  if (deadlineEl) deadlineEl.value = d;
  document.getElementById("todo-input").value = "";
  document.getElementById("modal-overlay").classList.remove("hidden");
  setTimeout(function () {
    document.getElementById("todo-input").focus();
  }, 300);
}
window.openModalWithDate = openModalWithDate;

/** 해당 날짜에 시작일/마감일이 있는 할일만 반환 */
function getTodosForDate(dateStr) {
  var arr = typeof getTodosArray === "function" ? getTodosArray() : [];
  return arr.filter(function (t) {
    return t.deadline === dateStr || t.startDate === dateStr;
  });
}

/** YYYY-MM-DD → "YYYY년 M월 D일" */
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  var parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return parts[0] + "년 " + parseInt(parts[1], 10) + "월 " + parseInt(parts[2], 10) + "일";
}

var _dateChoiceDateStr = null;

/** 전체일정에서 날짜 클릭: 할일 있으면 선택 팝업, 없으면 바로 새 할일 모달 */
function onScheduleDateClick(dateStr) {
  var todosOnDate = getTodosForDate(dateStr);
  if (todosOnDate.length > 0) {
    _dateChoiceDateStr = dateStr;
    document.getElementById("date-choice-title").textContent = formatDateLabel(dateStr) + " 할일";
    document.getElementById("date-choice-overlay").classList.remove("hidden");
  } else {
    openModalWithDate(dateStr);
  }
}
window.onScheduleDateClick = onScheduleDateClick;

function closeDateChoicePopup() {
  document.getElementById("date-choice-overlay").classList.add("hidden");
  _dateChoiceDateStr = null;
}

(function initDateChoicePopup() {
  document.getElementById("date-choice-view").addEventListener("click", function () {
    if (_dateChoiceDateStr) {
      window.filterByDate = _dateChoiceDateStr;
      closeDateChoicePopup();
      currentTab = "all";
      document.querySelectorAll(".tab").forEach(function (t) {
        t.classList.toggle("active", t.dataset.tab === "all");
      });
      renderTodos(getTodosArray());
      var el = document.getElementById("todo-list");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  document.getElementById("date-choice-add").addEventListener("click", function () {
    var dateStr = _dateChoiceDateStr;
    closeDateChoicePopup();
    if (dateStr) openModalWithDate(dateStr);
  });
  document.getElementById("date-choice-close").addEventListener("click", closeDateChoicePopup);
  document.getElementById("date-choice-overlay").addEventListener("click", function (e) {
    if (e.target.id === "date-choice-overlay") closeDateChoicePopup();
  });
  document.getElementById("date-filter-clear").addEventListener("click", function () {
    window.filterByDate = null;
    renderTodos(getTodosArray());
  });
})();

function openModalForEdit(id) {
  var todo = getTodosArray().find(function (t) { return t.id === id; });
  if (!todo) return;
  editingTodoId = id;
  document.getElementById("modal-title").textContent = "할일 수정";
  document.getElementById("add-btn").textContent = "저장";
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("todo-input").value = todo.title || "";
  document.getElementById("category-select").value = todo.category || "";
  document.getElementById("priority-select").value = todo.priority || "medium";
  document.getElementById("start-date-input").value = todo.startDate || "";
  document.getElementById("deadline-input").value = todo.deadline || "";
  var allDayEl = document.getElementById("all-day-checkbox");
  var startTimeEl = document.getElementById("start-time-input");
  var endTimeEl = document.getElementById("end-time-input");
  var isAllDay = todo.allDay === true || (todo.allDay !== false && !todo.startTime && !todo.endTime);
  if (allDayEl) allDayEl.checked = isAllDay;
  if (startTimeEl) {
    startTimeEl.value = todo.startTime || "09:00";
    startTimeEl.disabled = isAllDay;
  }
  if (endTimeEl) {
    endTimeEl.value = todo.endTime || "18:00";
    endTimeEl.disabled = isAllDay;
  }
  document.getElementById("memo-input").value = todo.memo || "";
  document.getElementById("autocomplete-list").classList.add("hidden");
  document.getElementById("template-suggestion").classList.add("hidden");
  var subs = Array.isArray(todo.subtasks) ? todo.subtasks : [];
  renderSubtaskChips(subs);
  selectedSubtasks = subs.slice();
  document.getElementById("subtask-chips").querySelectorAll(".subtask-chip").forEach(function (c) { c.classList.add("selected"); });
  document.getElementById("subtask-suggestion").classList.remove("hidden");
  setTimeout(function () {
    document.getElementById("todo-input").focus();
  }, 300);
}
window.openModalForEdit = openModalForEdit;

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  editingTodoId = null;
  resetForm();
}

function resetForm() {
  document.getElementById("todo-input").value = "";
  document.getElementById("category-select").value = "";
  document.getElementById("priority-select").value = "medium";
  document.getElementById("memo-input").value = "";
  var allDayEl = document.getElementById("all-day-checkbox");
  var startTimeEl = document.getElementById("start-time-input");
  var endTimeEl = document.getElementById("end-time-input");
  if (allDayEl) {
    allDayEl.checked = true;
    if (startTimeEl) { startTimeEl.value = "09:00"; startTimeEl.disabled = true; }
    if (endTimeEl) { endTimeEl.value = "18:00"; endTimeEl.disabled = true; }
  }
  var autocompleteList = document.getElementById("autocomplete-list");
  autocompleteList.classList.add("hidden");
  autocompleteList.innerHTML = "";
  var templateSuggestion = document.getElementById("template-suggestion");
  templateSuggestion.classList.add("hidden");
  var templateName = document.getElementById("template-name");
  if (templateName) templateName.textContent = "";
  var subtaskSuggestion = document.getElementById("subtask-suggestion");
  subtaskSuggestion.classList.add("hidden");
  var subtaskChips = document.getElementById("subtask-chips");
  if (subtaskChips) subtaskChips.innerHTML = "";
  selectedSubtasks = [];
  currentTemplate = null;
}

var input = document.getElementById("todo-input");
input.addEventListener("input", function () {
  var val = input.value.trim();
  if (!val) {
    document.getElementById("autocomplete-list").classList.add("hidden");
    return;
  }
  var suggs = getAutoComplete(val);
  renderAutocomplete(suggs);
  var cat = detectCategory(val);
  if (cat) document.getElementById("category-select").value = cat;
  var tmpl = matchTemplate(val);
  if (tmpl) {
    currentTemplate = tmpl;
    document.getElementById("template-name").textContent = tmpl.title;
    document.getElementById("template-suggestion").classList.remove("hidden");
  } else {
    document.getElementById("template-suggestion").classList.add("hidden");
  }
  var subs = getSubtasks(val);
  if (subs.length) renderSubtaskChips(subs);
  else document.getElementById("subtask-suggestion").classList.add("hidden");
});

function renderAutocomplete(items) {
  var list = document.getElementById("autocomplete-list");
  if (!items.length) {
    list.classList.add("hidden");
    return;
  }
  list.innerHTML = items.map(function (i) {
    return "<li>" + i + "</li>";
  }).join("");
  list.classList.remove("hidden");
  list.querySelectorAll("li").forEach(function (li) {
    li.addEventListener("click", function () {
      input.value = li.textContent;
      input.dispatchEvent(new Event("input"));
      list.classList.add("hidden");
    });
  });
}

function renderSubtaskChips(subs) {
  var container = document.getElementById("subtask-chips");
  selectedSubtasks = [];
  container.innerHTML = subs.map(function (s) {
    return '<div class="subtask-chip" data-sub="' + s.replace(/"/g, "&quot;") + '">' + s + "</div>";
  }).join("");
  document.getElementById("subtask-suggestion").classList.remove("hidden");
  container.querySelectorAll(".subtask-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      chip.classList.toggle("selected");
      var sub = chip.dataset.sub;
      if (chip.classList.contains("selected")) {
        selectedSubtasks.push(sub);
      } else {
        selectedSubtasks = selectedSubtasks.filter(function (s) {
          return s !== sub;
        });
      }
    });
  });
}

document.getElementById("apply-template").addEventListener("click", function () {
  if (!currentTemplate) return;
  input.value = currentTemplate.title;
  document.getElementById("category-select").value = currentTemplate.category;
  document.getElementById("priority-select").value = currentTemplate.priority;
  renderSubtaskChips(currentTemplate.subtasks || []);
  document.getElementById("template-suggestion").classList.add("hidden");
});

(function initAllDayCheckbox() {
  var allDayEl = document.getElementById("all-day-checkbox");
  var startTimeEl = document.getElementById("start-time-input");
  var endTimeEl = document.getElementById("end-time-input");
  if (!allDayEl || !startTimeEl || !endTimeEl) return;
  allDayEl.addEventListener("change", function () {
    var checked = allDayEl.checked;
    startTimeEl.disabled = checked;
    endTimeEl.disabled = checked;
    if (checked) {
      startTimeEl.value = "00:00";
      endTimeEl.value = "23:59";
    } else if (startTimeEl.value === "00:00" && endTimeEl.value === "23:59") {
      startTimeEl.value = "09:00";
      endTimeEl.value = "18:00";
    }
  });
})();

document.getElementById("add-btn").addEventListener("click", function () {
  var title = input.value.trim();
  if (!title) {
    input.style.background = "#ffe5e5";
    setTimeout(function () {
      input.style.background = "";
    }, 600);
    return;
  }
  var allDayEl = document.getElementById("all-day-checkbox");
  var allDay = allDayEl ? allDayEl.checked : true;
  var startTimeEl = document.getElementById("start-time-input");
  var endTimeEl = document.getElementById("end-time-input");
  var payload = {
    title: title,
    category: document.getElementById("category-select").value || "",
    priority: document.getElementById("priority-select").value || "medium",
    startDate: document.getElementById("start-date-input").value || "",
    deadline: document.getElementById("deadline-input").value || "",
    allDay: allDay,
    startTime: allDay ? "" : (startTimeEl ? startTimeEl.value : ""),
    endTime: allDay ? "" : (endTimeEl ? endTimeEl.value : ""),
    memo: document.getElementById("memo-input").value || "",
    subtasks: Array.isArray(selectedSubtasks) ? selectedSubtasks : []
  };
  function onError(e) {
    console.error("저장 오류:", e);
    var msg = (e && (e.code || e.message)) ? (e.code + ": " + (e.message || "")) : String(e);
    alert("저장에 실패했습니다.\n\n" + msg + "\n\n네트워크와 Firebase 콘솔 → Realtime Database → 규칙 탭을 확인해 주세요.");
  }
  try {
    if (editingTodoId) {
      var p = updateTodo(editingTodoId, payload);
      refreshUI();
      closeModal();
      if (p && typeof p.then === "function") p.catch(onError);
    } else {
      addTodo(payload);
      refreshUI();
      closeModal();
    }
  } catch (e) {
    onError(e);
  }
});

function refreshUI() {
  renderTodos(getTodosArray());
  if (typeof window.renderChart === "function") window.renderChart();
}

function renderTodos(todosObj) {
  var list = document.getElementById("todo-list-cards");
  var empty = document.getElementById("empty-state");
  var todos = Array.isArray(todosObj) ? todosObj : Object.values(todosObj || {});

  var filterBar = document.getElementById("date-filter-bar");
  if (filterBar) filterBar.classList.add("hidden");

  var todayStr = getLocalDateStr(today);
  if (currentTab === "today") {
    todos = todos.filter(function (t) {
      return t.deadline === todayStr || t.startDate === todayStr;
    });
  } else if (currentTab === "tomorrow") {
    var tomorrowDate = new Date(today);
    tomorrowDate.setDate(today.getDate() + 1);
    var tomorrowStr = getLocalDateStr(tomorrowDate);
    todos = todos.filter(function (t) {
      return t.deadline === tomorrowStr || t.startDate === tomorrowStr;
    });
  } else if (currentTab === "past") {
    todos = todos.filter(function (t) {
      var d = t.deadline || t.startDate;
      return d && d < todayStr;
    });
  } else if (currentTab === "all") {
    /* 전체일정: 필터 없음 */
  } else if (currentTab === "week") {
    var weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);
    var weekEndStr = getLocalDateStr(weekEnd);
    todos = todos.filter(function (t) {
      var d = t.deadline || t.startDate;
      return d >= todayStr && d <= weekEndStr;
    });
  }
  if (window.filterByDate) {
    todos = todos.filter(function (t) {
      return t.deadline === window.filterByDate || t.startDate === window.filterByDate;
    });
  }

  var order = { high: 0, medium: 1, low: 2 };
  todos.sort(function (a, b) {
    var pc = (order[a.priority] || 1) - (order[b.priority] || 1);
    if (pc !== 0) return pc;
    var ta = a.startTime || "";
    var tb = b.startTime || "";
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return ta.localeCompare(tb);
  });

  if (!todos.length) {
    if (list) list.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";
  if (!list) return;

  list.innerHTML = todos.map(function (todo) {
    var id = (todo.id || "").replace(/'/g, "\\'");
    var status = (todo.status || "pending").replace(/'/g, "\\'");
    var isSelected = window.selectedTodoId === todo.id;
    var isExpanded = window.expandedTodoId === todo.id;
    var memo = (todo.memo || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    var startDate = (todo.startDate || "").replace(/</g, "&lt;");
    var deadline = (todo.deadline || "").replace(/</g, "&lt;");
    var subtasksList = Array.isArray(todo.subtasks) && todo.subtasks.length
      ? "<ul class=\"todo-detail-list\">" + todo.subtasks.map(function (s) { return "<li>" + (s || "").replace(/</g, "&lt;") + "</li>"; }).join("") + "</ul>"
      : "";
    var isAllDay = todo.allDay === true || (todo.allDay !== false && !todo.startTime && !todo.endTime);
    var timeLabel = isAllDay ? "종일" : (todo.startTime && todo.endTime ? (todo.startTime.replace(/</g, "&lt;") + " ~ " + todo.endTime.replace(/</g, "&lt;")) : (todo.startTime || todo.endTime || "").replace(/</g, "&lt;"));
    var timeRow = timeLabel ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">시간</span> " + timeLabel + "</p>" : "";
    var detailHtml = "<div class=\"todo-detail " + (isExpanded ? "" : "hidden") + "\">" +
      (memo ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">메모</span> " + memo + "</p>" : "") +
      (startDate ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">시작일</span> " + startDate + "</p>" : "") +
      (deadline ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">마감일</span> " + deadline + "</p>" : "") +
      (timeRow ? timeRow : "") +
      (todo.category ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">카테고리</span> " + (todo.category || "").replace(/</g, "&lt;") + "</p>" : "") +
      (todo.priority ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">우선순위</span> " + (todo.priority || "").replace(/</g, "&lt;") + "</p>" : "") +
      (subtasksList ? "<p class=\"todo-detail-row\"><span class=\"todo-detail-label\">세부 작업</span></p>" + subtasksList : "") +
      "</div>";
    var memoPreview = memo ? '<div class="todo-memo-preview">' + memo + '</div>' : '';
    var isDone = todo.status === "done";
    var doneClass = isDone ? "todo-done-toggle checked" : "todo-done-toggle";
    var timeMeta = timeLabel ? '<span class="todo-date">🕐 ' + timeLabel + '</span>' : "";
    return (
      '<div class="todo-card priority-' + (todo.priority || "medium") + '" data-id="' + id + '">' +
        '<div class="todo-body">' +
          '<button type="button" class="' + doneClass + '" onclick="event.stopPropagation(); window.toggleDone(\'' + id + '\', \'' + status + '\');" title="' + (isDone ? "완료 해제" : "완료") + '" aria-label="' + (isDone ? "완료 해제" : "완료") + '"></button>' +
          '<div class="todo-body-inner" onclick="window.toggleTodoExpand(\'' + id + '\')">' +
          '<div class="todo-title ' + (isDone ? "done" : "") + '">' + (todo.title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>' +
          '<div class="todo-meta">' +
            (todo.category ? '<span class="badge ' + todo.category + '">' + (todo.category || "").replace(/</g, "&lt;") + '</span>' : "") +
            (todo.deadline ? '<span class="todo-date">📅 ' + (todo.deadline || "").replace(/</g, "&lt;") + '</span>' : "") +
            (timeMeta ? timeMeta : "") +
            (todo.subtasks && todo.subtasks.length ? '<span class="todo-date">📌 ' + todo.subtasks.length + '개 작업</span>' : "") +
          "</div>" +
          memoPreview +
          detailHtml +
          "</div>" +
        "</div>" +
        '<div class="todo-actions">' +
          '<button class="todo-btn-edit" onclick="event.stopPropagation(); window.openModalForEdit(\'' + id + '\');" title="수정">✏️</button>' +
          '<button class="todo-btn-delete" onclick="event.stopPropagation(); window.confirmDelete(\'' + id + '\');" title="삭제">🗑</button>' +
        "</div>" +
      "</div>"
    );
  }).join("");
}

function toggleTodoExpand(id) {
  window.expandedTodoId = window.expandedTodoId === id ? null : id;
  renderTodos(getTodosArray());
}

function selectTodoInGantt(id) {
  window.selectedTodoId = id;
  renderTodos(getTodosArray());
  if (typeof window.renderChart === "function") window.renderChart();
  var section = document.getElementById("nav-schedule");
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(function () {
    var row = document.querySelector(".gantt-row-active");
    if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, 400);
}

window.toggleTodoExpand = toggleTodoExpand;
window.selectTodoInGantt = selectTodoInGantt;

function toggleDone(id, currentStatus) {
  var next = currentStatus === "done" ? "pending" : "done";
  updateTodo(id, { status: next });
  refreshUI();
}

function confirmDelete(id) {
  if (window.confirm("삭제하겠습니까?")) {
    deleteTodo(id);
    refreshUI();
  }
}

window.toggleDone = toggleDone;
window.confirmDelete = confirmDelete;
