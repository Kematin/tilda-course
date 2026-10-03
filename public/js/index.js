import { courseData } from "./course-data.js";
import {
  clearProgress,
  getCompletedLessons,
  getCourseProgress,
  getModuleProgress
} from "./progress.js";

const moduleGrid = document.querySelector("[data-module-grid]");
const moduleNav = document.querySelector("[data-module-nav]");
const resetButton = document.querySelector("[data-reset-progress]");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function lessonWord(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "уроков";
  if (last === 1) return "урок";
  if (last >= 2 && last <= 4) return "урока";
  return "уроков";
}

function renderNavigation() {
  moduleNav.innerHTML = courseData.map((module) => `
    <a class="module-nav-link" href="./module-${module.id}.html">
      <span>${module.id}</span>
      <span class="module-nav-title">${escapeHtml(module.title)}</span>
    </a>
  `).join("");
}

function renderProgress() {
  const completed = getCompletedLessons();
  const overall = getCourseProgress(courseData, completed);

  document.querySelector("[data-overall-percent]").textContent = `${overall.percent}%`;
  document.querySelector("[data-progress-ring]").style.setProperty("--progress", `${overall.percent * 3.6}deg`);
  document.querySelector("[data-overall-count]").textContent = `Завершено ${overall.done} из ${overall.total} уроков`;
  document.querySelector("[data-progress-note]").textContent = overall.percent === 100
    ? "Курс завершён. Это большая победа! 🎉"
    : overall.done > 0
      ? "Продолжай — твой прогресс уже заметен"
      : "Самое время начать ✨";

  moduleGrid.innerHTML = courseData.map((module) => {
    const progress = getModuleProgress(module, completed);
    const completeClass = progress.percent === 100 ? " is-complete" : "";
    return `
      <article class="module-card${completeClass}">
        <div class="module-card-topline">
          <span class="module-number">${String(module.id).padStart(2, "0")}</span>
          <span class="module-status">${progress.percent === 100 ? "Готово ✓" : `${module.lessons.length} ${lessonWord(module.lessons.length)}`}</span>
        </div>
        <h3>${escapeHtml(module.title)}</h3>
        <p>${escapeHtml(module.description)}</p>
        <div class="progress-summary">
          <span>Пройдено ${progress.done} из ${progress.total}</span>
          <strong>${progress.percent}%</strong>
        </div>
        <div class="progress-track" role="progressbar" aria-label="Прогресс модуля ${module.id}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
          <span style="width: ${progress.percent}%"></span>
        </div>
        <a class="card-link" href="./module-${module.id}.html">
          ${progress.done > 0 ? "Продолжить модуль" : "Открыть модуль"}
          <span aria-hidden="true">→</span>
        </a>
      </article>
    `;
  }).join("");
}

resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить весь прогресс курса? Это действие нельзя отменить.");
  if (!confirmed) return;
  clearProgress();
  renderProgress();
  resetButton.textContent = "Прогресс сброшен";
  window.setTimeout(() => {
    resetButton.textContent = "Сбросить прогресс";
  }, 1800);
});

renderNavigation();
renderProgress();
