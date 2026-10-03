const CAT_API_URL = "https://api.thecatapi.com/v1/images/search";

export function createPraiseDialog(root) {
  root.innerHTML = `
    <div class="modal-backdrop" data-praise-modal hidden>
      <section class="praise-dialog" role="dialog" aria-modal="true" aria-labelledby="praise-title" aria-describedby="praise-description">
        <button class="modal-close" type="button" data-modal-close aria-label="Закрыть окно похвалы">×</button>
        <div class="cat-frame" data-cat-frame>
          <img data-cat-image alt="Милый кот поздравляет с завершением урока" hidden>
          <div class="cat-placeholder" data-cat-placeholder aria-live="polite">
            <span aria-hidden="true">🐈</span>
            <small>Ищем котика…</small>
          </div>
        </div>
        <p class="eyebrow">Урок завершён</p>
        <h2 id="praise-title">Ты большой молодец!</h2>
        <p id="praise-description" data-praise-description>Ещё один урок пройден. Продолжай в том же духе!</p>
        <div class="praise-actions">
          <button class="button button-primary" type="button" data-new-cat>Ещё похваляшку <span aria-hidden="true">♥</span></button>
          <button class="button button-ghost" type="button" data-modal-close>Вернуться к урокам</button>
        </div>
      </section>
    </div>
  `;

  const modal = root.querySelector("[data-praise-modal]");
  const image = root.querySelector("[data-cat-image]");
  const placeholder = root.querySelector("[data-cat-placeholder]");
  const newCatButton = root.querySelector("[data-new-cat]");
  const description = root.querySelector("[data-praise-description]");
  let previouslyFocused = null;
  let requestNumber = 0;

  function showFallback(message = "Котик спрятался, но он тобой гордится!") {
    image.hidden = true;
    image.removeAttribute("src");
    placeholder.hidden = false;
    placeholder.querySelector("small").textContent = message;
  }

  async function loadCat() {
    const currentRequest = ++requestNumber;
    newCatButton.disabled = true;
    showFallback("Ищем котика…");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(CAT_API_URL, { signal: controller.signal });
      if (!response.ok) throw new Error(`Cat API: ${response.status}`);
      const data = await response.json();
      const imageUrl = data?.[0]?.url;
      if (!imageUrl) throw new Error("Cat API не вернул изображение");

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      if (currentRequest !== requestNumber) return;
      image.hidden = false;
      placeholder.hidden = true;
    } catch (error) {
      if (currentRequest === requestNumber) showFallback();
      console.warn("Не удалось загрузить изображение кота.", error);
    } finally {
      window.clearTimeout(timeoutId);
      if (currentRequest === requestNumber) newCatButton.disabled = false;
    }
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    previouslyFocused?.focus();
  }

  function open({ repeated = false } = {}) {
    previouslyFocused = document.activeElement;
    description.textContent = repeated
      ? "Повторение — тоже победа. Ты бережно укрепляешь свои знания!"
      : "Ещё один урок пройден. Продолжай в том же духе!";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    root.querySelector("[data-modal-close]").focus();
    loadCat();
  }

  root.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", close));
  newCatButton.addEventListener("click", loadCat);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") close();
    if (event.key !== "Tab") return;

    const focusable = [...modal.querySelectorAll("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return { open, close };
}
