const STORAGE_KEY = "cozyCourse.completedLessons.v1";
let memoryFallback = new Set();

function normalize(value) {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((id) => typeof id === "string"));
}

export function getCompletedLessons() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    memoryFallback = stored ? normalize(JSON.parse(stored)) : new Set();
  } catch (error) {
    console.warn("Не удалось прочитать прогресс из localStorage.", error);
  }
  return new Set(memoryFallback);
}

export function completeLesson(lessonId) {
  const completed = getCompletedLessons();
  const wasAlreadyCompleted = completed.has(lessonId);
  completed.add(lessonId);
  memoryFallback = completed;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch (error) {
    console.warn("Не удалось сохранить прогресс в localStorage.", error);
  }

  return !wasAlreadyCompleted;
}

export function clearProgress() {
  memoryFallback = new Set();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Не удалось очистить прогресс в localStorage.", error);
  }
}

export function getModuleProgress(module, completed = getCompletedLessons()) {
  const total = module.lessons.length;
  const done = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function getCourseProgress(courseData, completed = getCompletedLessons()) {
  const lessons = courseData.flatMap((module) => module.lessons);
  const total = lessons.length;
  const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
