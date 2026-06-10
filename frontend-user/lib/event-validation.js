/** Event description cap aligned with common event platforms (e.g. Eventbrite ~500 words). */
export const EVENT_DESCRIPTION_MAX_WORDS = 500;

export const formToastClass = {
  success: "bg-[#FAF6F0] text-[#0B4D53] ring-[#2DD4BF]/40",
  warning: "bg-[#FAF6F0] text-[#0B4D53] ring-[#0B4D53]/25",
};

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function descriptionWordCountMessage(count) {
  return `${count} / ${EVENT_DESCRIPTION_MAX_WORDS} words`;
}

/** @returns {string} `datetime-local` min value in local time */
export function toDatetimeLocalValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string | null} First schedule validation error message
 */
export function validateGatheringSchedule(startDate, endDate) {
  const now = new Date();
  if (Number.isNaN(startDate.getTime())) {
    return "Error: Choose a valid start date and time.";
  }
  if (Number.isNaN(endDate.getTime())) {
    return "Error: Choose a valid end date and time.";
  }
  if (startDate < now) {
    return "Error: The gathering start time must be current or later.";
  }
  if (endDate <= startDate) {
    return "Error: The gathering's end time must be after the start time.";
  }
  return null;
}
