const THEME_KEY = "cozyCourse.theme.v1";
const root = document.documentElement;

function getSavedTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch (error) {
    console.warn("Не удалось прочитать тему из localStorage.", error);
    return null;
  }
}

function getPreferredTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, save = false) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (save) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.warn("Не удалось сохранить тему в localStorage.", error);
    }
  }

  syncThemeControls();
}

export function syncThemeControls() {
  const isDark = root.dataset.theme === "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", isDark ? "Включить светлую тему" : "Включить тёмную тему");
    const icon = button.querySelector(".theme-toggle-icon");
    const text = button.querySelector(".theme-toggle-text");
    if (icon) icon.textContent = isDark ? "☀" : "☾";
    if (text) text.textContent = isDark ? "Светлая тема" : "Тёмная тема";
  });
}

applyTheme(getSavedTheme() || getPreferredTheme());

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-toggle]");
  if (!button) return;
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
});
