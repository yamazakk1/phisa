const STORAGE_KEY = 'phisa-deck-v1';
const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

let topics = [];
let questions = new Map();
let state = null;

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
  $('topicList').innerHTML = topics.map((topic) => `<label class="topic-option"><input type="checkbox" value="${escapeHTML(topic.file)}"><span class="topic-name">${escapeHTML(topic.topic)}</span><span class="topic-qty">${topic.total}</span></label>`).join('');
  $('topicList').addEventListener('change', updateSelection);
  updateSelection();
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
    const resultClass = state.revealed ? (correct ? ' correct' : chosen ? ' incorrect' : '') : '';
    return `<label class="answer-option${resultClass}${state.revealed ? ' locked' : ''}"><input type="${isMultiple ? 'checkbox' : 'radio'}" name="answer" value="${option.id}" ${chosen ? 'checked' : ''} ${state.revealed ? 'disabled' : ''}><span>${escapeHTML(option.text)}</span></label>`;
  }).join('')}</div><div class="question-actions"><span class="feedback ${state.revealed ? state.wasCorrect ? 'good' : 'bad' : ''}" id="feedback">${state.revealed ? state.wasCorrect ? 'Верно!' : `Неверно. Правильный ответ: ${answerText}` : ''}</span><button class="primary-button" type="${state.revealed ? 'button' : 'submit'}" id="answerButton">${state.revealed ? 'Следующий вопрос' : 'Проверить ответ'} <span aria-hidden="true">→</span></button></div></form></article>`;
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
  $('guideButton').addEventListener('click', () => $('guideDialog').showModal());
  $('closeGuideButton').addEventListener('click', () => $('guideDialog').close());
  $('guideDialog').addEventListener('click', (event) => { if (event.target === $('guideDialog')) $('guideDialog').close(); });
  $('selectAllButton').addEventListener('click', () => { $('topicList').querySelectorAll('input').forEach((input) => { input.checked = true; }); updateSelection(); });
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
