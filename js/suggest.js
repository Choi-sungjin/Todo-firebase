// suggest.js — 키워드/템플릿 데이터 로드 후 storage → schedule → app 순차 로드

(function () {
  async function load() {
    const [kwRes, tmRes] = await Promise.all([
      fetch("./data/keywords.json"),
      fetch("./data/templates.json")
    ]);
    window._keywords = await kwRes.json();
    const tm = await tmRes.json();
    window._templates = tm.templates || [];

    await loadScript("js/storage.js");
    await loadScript("js/schedule.js");
    await loadScript("js/app.js");
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      document.body.appendChild(s);
    });
  }

  load();
})();

function detectCategory(input) {
  if (!window._keywords) return "";
  for (const [cat, data] of Object.entries(window._keywords)) {
    if (data.keywords.some((kw) => input.includes(kw))) return cat;
  }
  return "";
}

function getAutoComplete(input) {
  if (!input || !window._keywords) return [];
  const results = [];
  for (const data of Object.values(window._keywords)) {
    (data.keywords || []).forEach((kw) => {
      if (kw.includes(input) || input.includes(kw)) results.push(kw);
    });
  }
  return [...new Set(results)];
}

function getSubtasks(input) {
  if (!window._keywords) return [];
  for (const data of Object.values(window._keywords)) {
    for (const [kw, subs] of Object.entries(data.subtasks || {})) {
      if (input.includes(kw)) return subs;
    }
  }
  return [];
}

function matchTemplate(input) {
  if (!window._templates) return null;
  return window._templates.find((t) => input.includes(t.trigger)) || null;
}
