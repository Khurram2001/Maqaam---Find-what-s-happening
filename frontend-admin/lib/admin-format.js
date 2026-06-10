const ADMIN_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** @param {string | Date | null | undefined} value */
function formatDateTime(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return ADMIN_DATE_FORMAT.format(d);
}

/** @param {string | Date | null | undefined} value */
export function formatAdminDateTime(value) {
  return formatDateTime(value);
}

/** @param {string | Date | null | undefined} value */
export const formatAuditDateTime = formatAdminDateTime;
