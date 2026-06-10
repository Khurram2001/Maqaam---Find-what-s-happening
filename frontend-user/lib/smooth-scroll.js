/**
 * @param {number} t 0–1
 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Smoothly scroll to an element id, respecting scroll-margin (e.g. fixed header).
 * @param {string} id
 * @param {{ duration?: number }} [options]
 */
export function scrollToHash(id, options = {}) {
  if (typeof window === "undefined" || !id) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.scrollIntoView({ block: "start" });
    return true;
  }

  const duration = options.duration ?? 1000;
  const scrollMarginTop = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const startY = window.scrollY;
  const targetY = el.getBoundingClientRect().top + startY - scrollMarginTop;
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) return true;

  let startTime = null;

  function step(currentTime) {
    if (startTime === null) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
  return true;
}

/** @param {string} href e.g. "/#how-it-works" */
export function hashFromHref(href) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  return href.slice(hashIndex + 1) || null;
}
