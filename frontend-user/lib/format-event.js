/** @param {string | Date} start */
export function formatEventDate(start) {
  return new Date(start).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** @param {string | Date} start @param {string | Date} end */
export function formatEventTimeRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const tOpts = { hour: "numeric", minute: "2-digit" };
  return `${s.toLocaleTimeString(undefined, tOpts)} – ${e.toLocaleTimeString(undefined, tOpts)}`;
}

/** @param {string | Date} start @param {string | Date} end */
export function formatEventRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const dOpts = { month: "short", day: "numeric", year: "numeric" };
  const tOpts = { hour: "numeric", minute: "2-digit" };
  if (sameDay) {
    return `${s.toLocaleString(undefined, { ...dOpts, ...tOpts })} – ${e.toLocaleTimeString(undefined, tOpts)}`;
  }
  return `${s.toLocaleString(undefined, { ...dOpts, ...tOpts })} → ${e.toLocaleString(undefined, { ...dOpts, ...tOpts })}`;
}
