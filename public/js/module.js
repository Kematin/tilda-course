import { courseData } from "./course-data.js";
import { completeLesson, getCompletedLessons, getModuleProgress } from "./progress.js";
import { createPraiseDialog } from "./praise.js";
import { syncThemeControls } from "./theme.js";

const moduleId = Number(document.body.dataset.moduleId);
const currentModule = courseData.find((module) => module.id === moduleId);
const header = document.querySelector("[data-site-header]");
const content = document.querySelector("[data-module-content]");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHeader() {
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="./index.html" aria-label="Уютный курс — на главную">
        <span class="brand-mark" aria-hidden="true">✦</span><span>Уютный курс</span>
      </a>
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Переключить тему">
        <span class="theme-toggle-icon" aria-hidden="true">☾</span>
        <span class="theme-toggle-text">Тёмная тема</span>
      </button>
    </div>
    <nav class="module-nav" aria-label="Навигация по модулям">
      <div class="module-nav-list">
        ${courseData.map((module) => `
          <a class="module-nav-link${module.id === moduleId ? " is-active" : ""}" href="./module-${module.id}.html" ${module.id === moduleId ? 'aria-current="page"' : ""}>
            <span>${module.id}</span><span class="module-nav-title">${escapeHtml(module.title)}</span>
          </a>
        `).join("")}
      </div>
    </nav>
  `;
  syncThemeControls();
}

function lessonMarkup(lesson, index, completed) {
  const isCompleted = completed.has(lesson.id);
  const safeTitle = escapeHtml(lesson.title);
  const safeUrl = escapeHtml(lesson.videoUrl);
  const media = lesson.videoUrl
    ? `<div class="video-wrap">
        <video controls preload="metadata" aria-label="Видео к уроку ${safeTitle}">
          <source src="${safeUrl}" type="video/mp4">
          Ваш браузер не поддерживает встроенное видео.
        </video>
        <p class="video-error" hidden>Не удалось открыть видео. Используйте ссылку ниже.</p>
      </div>`
    : `<div class="video-placeholder"><span aria-hidden="true">▶</span><p>Добавьте ссылку на видео в <code>js/course-data.js</code></p></div>`;

  return `
    <article class="lesson-card${isCompleted ? " is-completed" : ""}" data-lesson-card="${escapeHtml(lesson.id)}">
      ${media}
      <div class="lesson-body">
        <div class="lesson-heading">
          <div>
            <p class="lesson-index">Урок ${index + 1}</p>
            <h2>${safeTitle}</h2>
          </div>
          <span class="completion-badge" data-completion-badge ${isCompleted ? "" : "hidden"} aria-label="Урок пройден">✓</span>
        </div>
        <div class="lesson-actions">
          ${lesson.videoUrl ? `<a class="video-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Открыть видео отдельно <span aria-hidden="true">↗</span></a>` : ""}
          <button class="button complete-button${isCompleted ? " is-completed" : ""}" type="button" data-complete-lesson="${escapeHtml(lesson.id)}">
            ${isCompleted ? "✓ Урок пройден" : "Завершить урок"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function assignmentMarkup(assignment) {
  if (!assignment) return "";

  const images = Array.isArray(assignment.images) ? assignment.images : [];
  const resources = Array.isArray(assignment.resources) ? assignment.resources : [];
  const gallery = images.length > 0
    ? `<div class="assignment-gallery${images.length > 1 ? " is-multiple" : ""}">
        ${images.map((image) => `
          <figure class="assignment-figure" data-assignment-figure>
            <a href="${escapeHtml(image.src)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть изображение задания в полном размере">
              <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || assignment.title)}" loading="lazy" decoding="async" data-assignment-image>
            </a>
            ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}
          </figure>
        `).join("")}
      </div>`
    : "";
  const resourceList = resources.length > 0
    ? `<div class="assignment-resources" aria-label="Материалы практического задания">
        <p>Материалы задания</p>
        <div class="assignment-resource-list">
          ${resources.map((item) => `
            <a class="assignment-resource" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span>${escapeHtml(item.title)}
            </a>
          `).join("")}
        </div>
      </div>`
    : "";

  return `
    <section class="assignment-section" aria-labelledby="assignment-title">
      <div class="assignment-card">
        <div class="assignment-copy">
          <span class="assignment-icon" aria-hidden="true">✎</span>
          <p class="eyebrow">Практическое задание</p>
          <h2 id="assignment-title">${escapeHtml(assignment.title)}</h2>
          <p>${escapeHtml(assignment.description)}</p>
        </div>
        ${gallery}
        ${resourceList}
      </div>
    </section>
  `;
}

function moduleNavigationMarkup() {
  const previous = courseData.find((module) => module.id === moduleId - 1);
  const next = courseData.find((module) => module.id === moduleId + 1);
  return `
    <nav class="page-navigation" aria-label="Переход между модулями">
      <div>${previous ? `<a class="button button-ghost" href="./module-${previous.id}.html"><span aria-hidden="true">←</span> Модуль ${previous.id}</a>` : ""}</div>
      <a class="all-modules-link" href="./index.html">Все модули</a>
      <div>${next ? `<a class="button button-primary" href="./module-${next.id}.html">Модуль ${next.id} <span aria-hidden="true">→</span></a>` : `<a class="button button-primary" href="./index.html">К итогам <span aria-hidden="true">→</span></a>`}</div>
    </nav>
  `;
}

function renderModule() {
  const completed = getCompletedLessons();
  const progress = getModuleProgress(currentModule, completed);
  document.title = `${currentModule.title} — Уютный курс`;
  content.innerHTML = `
    <section class="module-hero" aria-labelledby="module-title">
      <a class="back-link" href="./index.html"><span aria-hidden="true">←</span> Все модули</a>
      <p class="eyebrow">Модуль ${currentModule.id} из ${courseData.length}</p>
      <h1 id="module-title">${escapeHtml(currentModule.title)}</h1>
      <p class="module-description">${escapeHtml(currentModule.description)}</p>
      <div class="module-progress-panel">
        <div class="progress-summary">
          <span data-module-progress-text>Пройдено ${progress.done} из ${progress.total}</span>
          <strong data-module-progress-percent>${progress.percent}%</strong>
        </div>
        <div class="progress-track progress-track-large" role="progressbar" aria-label="Прогресс текущего модуля" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}" data-module-progress-bar>
          <span style="width: ${progress.percent}%"></span>
        </div>
      </div>
    </section>
    <section class="lessons-section" aria-label="Уроки модуля">
      <div class="lesson-grid">
        ${currentModule.lessons.map((lesson, index) => lessonMarkup(lesson, index, completed)).join("")}
      </div>
    </section>
    ${assignmentMarkup(currentModule.assignment)}
    ${moduleNavigationMarkup()}
  `;
}

function updateModuleProgress() {
  const progress = getModuleProgress(currentModule);
  document.querySelector("[data-module-progress-text]").textContent = `Пройдено ${progress.done} из ${progress.total}`;
  document.querySelector("[data-module-progress-percent]").textContent = `${progress.percent}%`;
  const bar = document.querySelector("[data-module-progress-bar]");
  bar.setAttribute("aria-valuenow", String(progress.percent));
  bar.querySelector("span").style.width = `${progress.percent}%`;
}

if (!currentModule) {
  header.innerHTML = `<div class="header-inner"><a class="brand" href="./index.html"><span class="brand-mark" aria-hidden="true">✦</span><span>Уютный курс</span></a></div>`;
  content.innerHTML = `<section class="empty-state"><p class="eyebrow">Ошибка</p><h1>Такого модуля нет</h1><p>Вернитесь на главную и выберите модуль из программы.</p><a class="button button-primary" href="./index.html">Все модули</a></section>`;
} else {
  renderHeader();
  renderModule();
  const praiseDialog = createPraiseDialog(document.querySelector("[data-praise-root]"));

  content.addEventListener("click", (event) => {
    const button = event.target.closest("[data-complete-lesson]");
    if (!button) return;

    const lessonId = button.dataset.completeLesson;
    const newlyCompleted = completeLesson(lessonId);
    const card = button.closest("[data-lesson-card]");
    card.classList.add("is-completed");
    card.querySelector("[data-completion-badge]").hidden = false;
    button.classList.add("is-completed");
    button.textContent = "✓ Урок пройден";
    updateModuleProgress();
    praiseDialog.open({ repeated: !newlyCompleted });
  });

  content.querySelectorAll("video").forEach((video) => {
    video.addEventListener("error", () => {
      const message = video.parentElement.querySelector(".video-error");
      if (message) message.hidden = false;
    }, true);
  });

  content.querySelectorAll("[data-assignment-image]").forEach((image) => {
    image.addEventListener("error", () => {
      const figure = image.closest("[data-assignment-figure]");
      image.parentElement.hidden = true;
      figure.classList.add("is-missing");
      const message = document.createElement("p");
      message.className = "assignment-image-error";
      message.textContent = "Изображение пока не добавлено";
      figure.prepend(message);
    }, { once: true });
  });
}
