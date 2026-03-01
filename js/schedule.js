// schedule.js — 간트 차트 (할일을 시작일~마감일 구간 막대로 표시)

let _chartMonth = new Date().getMonth();
let _chartYear = new Date().getFullYear();

const ROW_HEIGHT = 36;

function initSchedule() {
  updateMonthLabel();
  renderChart();

  const chartEl = document.getElementById("schedule-chart");
  if (chartEl) {
    chartEl.addEventListener("click", function (e) {
      if (e.target.closest(".gantt-bar")) return;
      const cell = e.target.closest(".gantt-day-clickable, .gantt-cell-clickable");
      if (!cell || !cell.dataset.date) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.onScheduleDateClick === "function") window.onScheduleDateClick(cell.dataset.date);
      else if (typeof window.openModalWithDate === "function") window.openModalWithDate(cell.dataset.date);
    });
  }

  document.getElementById("prev-month").addEventListener("click", () => {
    _chartMonth--;
    if (_chartMonth < 0) {
      _chartMonth = 11;
      _chartYear--;
    }
    updateMonthLabel();
    renderChart();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    _chartMonth++;
    if (_chartMonth > 11) {
      _chartMonth = 0;
      _chartYear++;
    }
    updateMonthLabel();
    renderChart();
  });
}

function updateMonthLabel() {
  const label = document.getElementById("current-month-label");
  if (label) label.textContent = `${_chartYear}년 ${_chartMonth + 1}월`;
}

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getTodoRangeInMonth(todo) {
  const startStr = todo.startDate || todo.deadline;
  const endStr = todo.deadline || todo.startDate;
  if (!startStr && !endStr) return null;
  const start = parseYMD(startStr) || parseYMD(endStr);
  const end = parseYMD(endStr) || parseYMD(startStr);
  const monthStart = new Date(_chartYear, _chartMonth, 1);
  const monthEnd = new Date(_chartYear, _chartMonth + 1, 0);
  if (end < monthStart || start > monthEnd) return null;
  const startDay = start < monthStart ? 1 : start.getDate();
  const endDay = end > monthEnd ? monthEnd.getDate() : end.getDate();
  return { startDay, endDay };
}

function renderChart() {
  const chart = document.getElementById("schedule-chart");
  if (!chart) return;

  const todos = typeof getTodosArray === "function" ? getTodosArray() : [];
  const today = new Date();
  const daysInMonth = new Date(_chartYear, _chartMonth + 1, 0).getDate();

  const rows = [];
  todos.forEach((todo) => {
    const range = getTodoRangeInMonth(todo);
    if (!range) return;
    rows.push({
      todo,
      startDay: range.startDay,
      endDay: range.endDay,
      priority: todo.priority || "medium"
    });
  });

  const priorityClass = (p) => {
    if (p === "high") return "gantt-bar-high";
    if (p === "low") return "gantt-bar-low";
    return "gantt-bar-medium";
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const pad2 = (n) => String(n).padStart(2, "0");
  const toDateStr = (day) => `${_chartYear}-${pad2(_chartMonth + 1)}-${pad2(day)}`;
  const dateLabels = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(_chartYear, _chartMonth, day);
    const isToday = date.toDateString() === today.toDateString();
    const dow = date.getDay();
    let cls = "gantt-day-label gantt-day-clickable";
    if (isToday) cls += " gantt-day-today";
    else if (dow === 0) cls += " gantt-day-sun";
    else if (dow === 6) cls += " gantt-day-sat";
    return `<div class="${cls}" data-dow="${dow}" data-date="${toDateStr(day)}" title="이 날짜에 할일 추가"><span class="gantt-day-num">${day}</span><span class="gantt-day-wd">${weekDays[dow]}</span></div>`;
  }).join("");

  const rowHtml = rows
    .map((r) => {
      const spanDays = r.endDay - r.startDay + 1;
      const leftPct = ((r.startDay - 1) / daysInMonth) * 100;
      const widthPct = (spanDays / daysInMonth) * 100;
      const title = (r.todo.title || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      const titleEsc = (r.todo.title || "").replace(/'/g, "&#39;").replace(/\\/g, "\\\\");
      const todoId = (r.todo.id || "").replace(/'/g, "\\'");
      const isActive = window.selectedTodoId === r.todo.id;
      const dayCellsRow = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = new Date(_chartYear, _chartMonth, day);
        const isToday = date.toDateString() === today.toDateString();
        const dow = date.getDay();
        let cellCls = "gantt-cell gantt-cell-clickable";
        if (isToday) cellCls += " gantt-cell-today";
        if (dow === 0) cellCls += " gantt-cell-sun";
        if (dow === 6) cellCls += " gantt-cell-sat";
        return `<div class="${cellCls}" data-date="${toDateStr(day)}" title="이 날짜에 할일 추가"></div>`;
      }).join("");
      return `
        <div class="gantt-row ${isActive ? "gantt-row-active" : ""}" data-id="${r.todo.id || ""}" onclick="window._focusTodoFromGantt('${todoId}')">
          <div class="gantt-task-label" title="${title}">${title}</div>
          <div class="gantt-timeline">
            ${dayCellsRow}
            <div class="gantt-bar ${priorityClass(r.priority)}" style="left:${leftPct}%;width:${widthPct}%;"
                 data-title="${titleEsc}" data-start="${r.startDay}" data-end="${r.endDay}"
                 onmouseenter="window._showGanttTooltip(event, this)"
                 onmouseleave="window._hideChartTooltip()"></div>
          </div>
        </div>`;
    })
    .join("");

  chart.innerHTML = `
    <div class="gantt-wrap">
      <div class="gantt-header-row">
        <div class="gantt-label-header">할일</div>
        <div class="gantt-days-row">
          ${dateLabels}
        </div>
      </div>
      <div class="gantt-body">
        ${rows.length === 0
    ? `<div class="gantt-empty">이번 달에 기한이 있는 할일이 없습니다.</div>`
    : rowHtml
}
      </div>
    </div>`;

  if (!document.getElementById("chart-tooltip")) {
    const tip = document.createElement("div");
    tip.className = "chart-tooltip";
    tip.id = "chart-tooltip";
    document.body.appendChild(tip);
  }
}

function showGanttTooltip(e, barEl) {
  if (!barEl || !barEl.dataset) return;
  const title = barEl.dataset.title || "";
  const startDay = barEl.dataset.start || "";
  const endDay = barEl.dataset.end || "";
  const tip = document.getElementById("chart-tooltip");
  if (!tip) return;
  tip.innerHTML = `<strong>${(title || "").replace(/</g, "&lt;")}</strong><br>${startDay}일 ~ ${endDay}일`;
  tip.classList.add("show");
  const x = Math.min(e.clientX + 10, window.innerWidth - 180);
  const y = e.clientY - 50;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

function hideTooltip() {
  const tip = document.getElementById("chart-tooltip");
  if (tip) tip.classList.remove("show");
}

function onBarClick(dateStr) {
  const deadlineInput = document.getElementById("deadline-input");
  const startInput = document.getElementById("start-date-input");
  if (deadlineInput) deadlineInput.value = dateStr;
  if (startInput) startInput.value = dateStr;
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("hidden");
}

function focusTodoFromGantt(id) {
  window.selectedTodoId = id;
  window.expandedTodoId = id;
  if (typeof renderTodos === "function") renderTodos(getTodosArray());
  if (typeof window.renderChart === "function") window.renderChart();
  var card = document.querySelector('.todo-card[data-id="' + id + '"]');
  if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

window.renderChart = renderChart;
window.initSchedule = initSchedule;
window._onBarClick = onBarClick;
window._showGanttTooltip = showGanttTooltip;
window._hideChartTooltip = hideTooltip;
window._focusTodoFromGantt = focusTodoFromGantt;
