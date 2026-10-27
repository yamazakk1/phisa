const STORAGE_KEY = 'phisa-deck-v1';
const THEME_KEY = 'phisa-theme-v1';
const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

let topics = [];
let questions = new Map();
let state = null;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('themeButton').setAttribute('aria-pressed', String(theme === 'dark'));
  $('themeButton').setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
  $('themeButton').querySelector('.theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
  $('themeButton').querySelector('.theme-label').textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0B1020' : '#F3F6FC';
}

function save() {
  if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  else localStorage.removeItem(STORAGE_KEY);
}

function randomId(ids) {
  return ids[Math.floor(Math.random() * ids.length)];
}

function setView(studying) {
  $('setupView').hidden = studying;
  $('studyView').hidden = !studying;
}

function renderTopics() {
  let start = 0;
  $('topicList').innerHTML = sections.map((section) => {
    const sectionTopics = topics.slice(start, section.end);
    start = section.end;
    return `<section class="topic-section" data-section-name="${escapeHTML(section.title.toLocaleLowerCase('ru'))}"><div class="topic-section-head"><span class="section-art" aria-hidden="true">${sectionIcon(section.icon)}</span><div><span class="section-index">РАЗДЕЛ ${section.roman}</span><h3>${escapeHTML(section.title)}</h3></div><span class="section-count">${sectionTopics.length} ${sectionTopics.length === 1 ? 'тема' : sectionTopics.length < 5 ? 'темы' : 'тем'}</span></div><div class="topic-grid">${sectionTopics.map((topic) => `<label class="topic-option"><input type="checkbox" value="${escapeHTML(topic.file)}"><span class="topic-name">${escapeHTML(topic.topic)}</span><span class="topic-qty">${topic.total}</span></label>`).join('')}</div></section>`;
  }).join('') + '<p id="noTopics" class="no-topics" hidden>Ничего не найдено. Попробуй другой запрос.</p>';
  $('topicList').addEventListener('change', updateSelection);
  updateSelection();
}

const sections = [
  {end:8,roman:'I',title:'Общефизиологические процессы',icon:'cell'},
  {end:10,roman:'II',title:'Физиология крови',icon:'blood'},
  {end:14,roman:'III',title:'Кровообращение',icon:'heart'},
  {end:16,roman:'IV',title:'Выделение',icon:'kidney'},
  {end:19,roman:'V',title:'Пищеварение',icon:'gut'},
  {end:22,roman:'VI',title:'Метаболизм и терморегуляция',icon:'heat'},
  {end:26,roman:'VII',title:'Дыхание',icon:'lung'},
  {end:28,roman:'VIII',title:'Эндокринная регуляция',icon:'hormone'},
  {end:31,roman:'IX',title:'Физиология возбудимых структур',icon:'muscle'},
  {end:35,roman:'X',title:'Нервная регуляция',icon:'nerve'},
  {end:40,roman:'XI',title:'Сенсорные системы',icon:'eye'},
  {end:42,roman:'XII',title:'Высшая нервная деятельность',icon:'brain'},
  {end:43,roman:'XIII',title:'Основы адаптивной физиологии',icon:'adapt'},
  {end:44,roman:'XIV',title:'Основы возрастной физиологии',icon:'clock'}
];

const iconPaths = {
  cell:'<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="4"/><path d="M7 9l3 2m14 9-3-1M12 5l1 3"/>',
  body:'<path d="M16 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM10 15c1-2 3-3 6-3s5 1 6 3l2 11H8l2-11ZM12 17l-1 7m9-7 1 7"/>',
  lung:'<path d="M16 4v12m0-7c-3-5-5-3-7 0L5 23c-1 4 1 5 5 4l4-5V12m2-3c3-5 5-3 7 0l4 14c1 4-1 5-5 4l-4-5V12"/>',
  gut:'<path d="M9 4v5c0 3 3 3 5 3h4c3 0 4 2 4 4v3c0 4-3 7-7 7s-7-3-7-7v-3m4 2h8m-8 4h8"/>',
  kidney:'<path d="M13 5C7 3 4 7 5 14s5 12 9 11c4-1 3-5 1-8s-3-4-2-7V5Zm6 0c6-2 9 2 8 9s-5 12-9 11c-4-1-3-5-1-8s3-4 2-7V5Z"/>',
  heart:'<path d="M16 27 5 16C-1 9 8 2 16 9c8-7 17 0 11 7L16 27Z"/><path d="M5 16h6l2-4 4 8 2-4h8"/>',
  blood:'<path d="M16 3C12 10 7 15 7 20a9 9 0 0 0 18 0c0-5-5-10-9-17Z"/><path d="M11 21c1 2 3 3 5 3"/>',
  energy:'<path d="m18 3-11 15h8l-1 11 11-15h-8l1-11Z"/>',
  heat:'<path d="M14 6a2 2 0 0 1 4 0v12a6 6 0 1 1-4 0V6Z"/><path d="M16 13v10m7-13 3-3m-3 10 4 2"/>',
  hormone:'<path d="M16 4v7m0 10v7M4 16h7m10 0h7M8 8l5 5m6 6 5 5m0-16-5 5M8 24l5-5"/><circle cx="16" cy="16" r="5"/>',
  nerve:'<circle cx="16" cy="16" r="4"/><path d="M16 12V3m0 17v9M12 16H3m17 0h9M13 13 6 6m13 13 7 7m0-20-7 7M13 19l-7 7"/>',
  muscle:'<path d="M5 12h4l3-3h8l3 3h4v8h-4l-3 3h-8l-3-3H5v-8Zm-2 1v6m26-6v6"/>',
  brain:'<path d="M16 7c-4-5-10-2-10 3-4 2-4 8 0 10-1 5 5 8 10 5 5 3 11 0 10-5 4-2 4-8 0-10 0-5-6-8-10-3Zm0 0v18m-7-12 4 2m10-2-4 2M8 20l4-1m12 1-4-1"/>',
  eye:'<path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z"/><circle cx="16" cy="16" r="4"/>',
  ear:'<path d="M11 24c0-5-5-6-5-13a10 10 0 0 1 20 0c0 5-2 8-6 11-2 2-2 5-5 5-2 0-4-1-4-3Zm4-3c0-4-4-4-4-9a5 5 0 0 1 10 0c0 3-1 4-3 5"/>',
  clock:'<circle cx="16" cy="16" r="12"/><path d="M16 8v8l5 3"/>',
  adapt:'<path d="M3 25 12 9l5 8 4-6 8 14H3Z"/><path d="m9 15 3 3 3-3m6 4 2 2"/><circle cx="24" cy="6" r="2"/>'
};
function sectionIcon(type) {
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[type]}</svg>`;
}

let filterTimer;
function filterTopics() {
  const list = $('topicList');
  list.classList.add('is-filtering');
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    const query = $('topicSearch').value.trim().toLocaleLowerCase('ru');
    let visible = 0;
    list.querySelectorAll('.topic-section').forEach((section) => {
      const sectionMatch = section.dataset.sectionName.includes(query);
      let sectionVisible = 0;
      section.querySelectorAll('.topic-option').forEach((option) => {
        const match = sectionMatch || option.querySelector('.topic-name').textContent.toLocaleLowerCase('ru').includes(query);
        option.hidden = !match;
        if (match) sectionVisible++;
      });
      section.hidden = sectionVisible === 0;
      visible += sectionVisible;
    });
    $('noTopics').hidden = visible !== 0;
    list.scrollTop = 0;
    requestAnimationFrame(() => list.classList.remove('is-filtering'));
  }, 110);
}

function selectedFiles() {
  return [...$('topicList').querySelectorAll('input:checked')].map((input) => input.value);
}

function updateSelection() {
  const files = selectedFiles();
  const total = topics.filter((topic) => files.includes(topic.file)).reduce((sum, topic) => sum + topic.total, 0);
  $('selectedSummary').textContent = `Выбрано ${files.length} из ${topics.length} тем`;
  $('questionSummary').textContent = `${total} вопросов`;
  $('createButton').disabled = files.length === 0;
}

async function loadQuestions(files) {
  const groups = await Promise.all(files.map(async (file) => {
    const response = await fetch(`questions/${encodeURIComponent(file)}`);
    if (!response.ok) throw new Error(`Не удалось загрузить ${file}`);
    return response.json();
  }));
  questions = new Map(groups.flat().map((question) => [question.id, question]));
}

function chooseQuestion() {
  const pile = state.deck === 'new' ? state.remaining : state.errors;
  state.currentId = pile.length ? randomId(pile) : null;
  state.revealed = false;
  state.chosen = [];
  state.wasCorrect = null;
  save();
  renderStudy();
}

function switchDeck(deck) {
  if (state.deck === deck) return;
  state.deck = deck;
  chooseQuestion();
}

function renderStudy() {
  setView(true);
  $('statTotal').textContent = state.total;
  $('statAttempted').textContent = state.attempted;
  $('statCorrect').textContent = state.correct;
  $('statPercent').textContent = `${state.attempted ? Math.round(state.correct / state.attempted * 100) : 0}%`;
  $('newCount').textContent = state.remaining.length;
  $('errorCount').textContent = state.errors.length;
  for (const deck of ['new','errors']) {
    const tab = $(deck === 'new' ? 'newTab' : 'errorsTab');
    tab.classList.toggle('active', state.deck === deck);
    tab.setAttribute('aria-selected', String(state.deck === deck));
  }
  const area = $('questionArea');
  if (state.currentId === null || !questions.has(state.currentId)) {
    const isNew = state.deck === 'new';
    const otherCount = isNew ? state.errors.length : state.remaining.length;
    area.innerHTML = `<div class="empty-card"><div class="empty-icon">✳</div><h2>${isNew ? 'Новые вопросы закончились' : 'Стопка ошибок пуста'}</h2><p>${isNew ? 'Ты прошёл все вопросы выбранных тем.' : 'Все ошибочные вопросы решены верно.'}${otherCount ? ' Можешь перейти в другую стопку.' : ' Можно завершить колоду и выбрать темы заново.'}</p>${otherCount ? `<button class="primary-button" id="goOtherButton" type="button">Перейти к ${isNew ? 'ошибкам' : 'новым вопросам'} →</button>` : ''}</div>`;
    $('goOtherButton')?.addEventListener('click', () => switchDeck(isNew ? 'errors' : 'new'));
    return;
  }
  const question = questions.get(state.currentId);
  const isMultiple = question.type === 'multiple';
  const answerText = question.options.filter((option) => question.correctAnswers.includes(option.id)).map((option) => option.id).join(', ');
  area.innerHTML = `<article class="question-card"><div class="question-meta"><span>ВОПРОС №${question.id} · ${state.deck === 'new' ? 'НОВАЯ КОЛОДА' : 'ПОВТОР ОШИБОК'}</span><span>Стр. ${question.sourcePage}</span></div><h2>${escapeHTML(question.question)}</h2><p class="question-hint">${isMultiple ? 'Выбери все правильные варианты' : 'Выбери один правильный вариант'}</p><form id="answerForm"><div class="answers">${question.options.map((option) => {
    const chosen = state.chosen.includes(option.id);
    const correct = question.correctAnswers.includes(option.id);
    const resultClass = state.revealed ? (correct ? ' correct' : chosen ? ' chosen-wrong' : '') : '';
    return `<label class="answer-option${resultClass}${state.revealed ? ' locked' : ''}"><input type="${isMultiple ? 'checkbox' : 'radio'}" name="answer" value="${option.id}" ${chosen ? 'checked' : ''} ${state.revealed ? 'disabled' : ''}><span>${escapeHTML(option.text)}</span>${state.revealed && correct ? '<span class="answer-check" aria-hidden="true">✓</span>' : ''}</label>`;
  }).join('')}</div><div class="question-actions"><span class="feedback ${state.revealed ? state.wasCorrect ? 'good' : 'bad' : ''}" id="feedback">${state.revealed ? state.wasCorrect ? '<span class="feedback-icon" aria-hidden="true">✓</span><span>Верно!</span>' : `<span class="feedback-icon" aria-hidden="true">×</span><span><strong>Неверно</strong><small>Правильный ответ: ${answerText}</small></span>` : ''}</span><button class="primary-button" type="${state.revealed ? 'button' : 'submit'}" id="answerButton">${state.revealed ? 'Следующий вопрос' : 'Проверить ответ'} <span aria-hidden="true">→</span></button></div></form></article>`;
  if (state.revealed) $('answerButton').addEventListener('click', chooseQuestion);
  else $('answerForm').addEventListener('submit', submitAnswer);
}

function submitAnswer(event) {
  event.preventDefault();
  const chosen = [...$('answerForm').querySelectorAll('input:checked')].map((input) => Number(input.value)).sort((a,b) => a-b);
  if (!chosen.length) {
    $('feedback').textContent = 'Выбери хотя бы один вариант.';
    $('feedback').className = 'feedback bad';
    return;
  }
  const question = questions.get(state.currentId);
  const correctAnswers = [...question.correctAnswers].sort((a,b) => a-b);
  const correct = chosen.length === correctAnswers.length && chosen.every((id, index) => id === correctAnswers[index]);
  if (state.deck === 'new') {
    state.remaining = state.remaining.filter((id) => id !== question.id);
    state.attempted += 1;
    if (correct) state.correct += 1;
    else if (!state.errors.includes(question.id)) state.errors.push(question.id);
  } else if (correct) {
    state.errors = state.errors.filter((id) => id !== question.id);
  }
  state.chosen = chosen;
  state.wasCorrect = correct;
  state.revealed = true;
  save();
  renderStudy();
}

async function createDeck() {
  const files = selectedFiles();
  $('createButton').disabled = true;
  $('createButton').textContent = 'Загружаем вопросы…';
  try {
    await loadQuestions(files);
    state = {selected: files, total: questions.size, remaining: [...questions.keys()], errors: [], attempted: 0, correct: 0, deck: 'new', currentId: null, revealed: false, chosen: [], wasCorrect: null};
    chooseQuestion();
    window.scrollTo(0, 0);
  } catch (error) {
    alert(`Не удалось создать колоду. ${error.message}`);
  } finally {
    $('createButton').innerHTML = 'Сформировать колоду <span aria-hidden="true">→</span>';
    updateSelection();
  }
}

function finishDeck() {
  state = null;
  questions.clear();
  save();
  $('topicList').querySelectorAll('input').forEach((input) => { input.checked = false; });
  updateSelection();
  setView(false);
  window.scrollTo(0, 0);
}

async function init() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => { if (!localStorage.getItem(THEME_KEY)) setTheme(event.matches ? 'dark' : 'light'); });
  $('themeButton').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem(THEME_KEY, next); setTheme(next); });
  $('guideButton').addEventListener('click', () => $('guideDialog').showModal());
  $('closeGuideButton').addEventListener('click', () => $('guideDialog').close());
  $('guideDialog').addEventListener('click', (event) => { if (event.target === $('guideDialog')) $('guideDialog').close(); });
  $('selectAllButton').addEventListener('click', () => { $('topicList').querySelectorAll('input').forEach((input) => { input.checked = true; }); updateSelection(); });
  $('topicSearch').addEventListener('input', filterTopics);
  $('clearAllButton').addEventListener('click', () => { $('topicList').querySelectorAll('input').forEach((input) => { input.checked = false; }); updateSelection(); });
  $('createButton').addEventListener('click', createDeck);
  $('finishButton').addEventListener('click', finishDeck);
  $('newTab').addEventListener('click', () => switchDeck('new'));
  $('errorsTab').addEventListener('click', () => switchDeck('errors'));
  try {
    const response = await fetch('topics.json');
    if (!response.ok) throw new Error('Не удалось загрузить список тем');
    topics = await response.json();
    renderTopics();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.selected) && Array.isArray(parsed.remaining) && Array.isArray(parsed.errors)) {
        await loadQuestions(parsed.selected);
        state = parsed;
        if (state.currentId !== null && !questions.has(state.currentId)) state.currentId = null;
        renderStudy();
      }
    }
  } catch (error) {
    $('topicList').textContent = `Не удалось загрузить данные: ${error.message}. Открой сайт через веб-сервер или GitHub Pages.`;
    console.error(error);
  }
}

init();
