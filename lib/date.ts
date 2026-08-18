const CHECKLIST_TIME_ZONE = "America/Santiago";

/**
 * Devuelve una fecha en formato YYYY-MM-DD usando la zona horaria
 * configurada para los checklists.
 *
 * Ejemplo: 2026-08-06
 */
export function getChecklistDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHECKLIST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("No se pudo calcular la fecha del checklist.");
  }

  return `${year}-${month}-${day}`;
}

/**
 * Devuelve una fecha legible para mostrar en pantalla.
 *
 * Ejemplo: jueves, 6 de agosto de 2026
 */
export function formatChecklistDate(
  date: Date = new Date()
): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CHECKLIST_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export { CHECKLIST_TIME_ZONE };