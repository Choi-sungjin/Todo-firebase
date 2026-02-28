// storage.js — Firebase Realtime DB CRUD (실시간 스트리밍 + 메모리 캐시)

const TODOS_PATH = "todos";
let _todosCache = {};

function listenTodos(callback) {
  if (!window._db || !window._ref || !window._onValue) {
    console.warn("Firebase not ready yet, retrying listenTodos in 100ms");
    setTimeout(function () { listenTodos(callback); }, 100);
    return;
  }
  const db = window._db;
  const todosRef = window._ref(db, TODOS_PATH);
  window._onValue(todosRef, function (snapshot) {
    var raw = snapshot.val() || {};
    var normalized = {};
    Object.keys(raw).forEach(function (key) {
      var t = raw[key];
      if (t && typeof t === "object") {
        if (!t.id) t = Object.assign({}, t, { id: key });
        normalized[key] = t;
      }
    });
    _todosCache = normalized;
    callback(_todosCache);
  });
}

function addTodo(todo) {
  const db = window._db;
  const todosRef = window._ref(db, TODOS_PATH);
  const newRef = window._push(todosRef);
  const newTodo = {
    ...todo,
    id: newRef.key,
    status: "pending",
    createdAt: Date.now()
  };
  window._set(newRef, newTodo);
  _todosCache[newRef.key] = newTodo;
  return newTodo;
}

function _sanitizeForFirebase(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(_sanitizeForFirebase).filter(function (v) { return v !== undefined; });
  var out = {};
  Object.keys(obj).forEach(function (k) {
    if (obj[k] === undefined) return;
    var v = _sanitizeForFirebase(obj[k]);
    if (v !== undefined) out[k] = v;
  });
  return out;
}

function updateTodo(id, updates) {
  var clean = _sanitizeForFirebase(updates) || {};
  var db = window._db;
  var todoRef = window._ref(db, TODOS_PATH + "/" + id);
  if (_todosCache[id]) {
    _todosCache[id] = Object.assign({}, _todosCache[id], clean);
  }
  return window._update(todoRef, clean);
}

function deleteTodo(id) {
  const db = window._db;
  const todoRef = window._ref(db, TODOS_PATH + "/" + id);
  window._remove(todoRef);
  delete _todosCache[id];
}

function getTodosArray() {
  return Object.keys(_todosCache).map(function (key) {
    var t = _todosCache[key];
    return t && typeof t === "object" ? (t.id ? t : Object.assign({}, t, { id: key })) : null;
  }).filter(Boolean);
}
