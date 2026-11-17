const DESCRIPTION_MAX = 400;

export function truncateText(value: string, max = 140) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const sliced = text.slice(0, max).trim();
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;
  return `${safe}…`;
}

/** Primera línea/ítem de requisitos (lista con guiones o saltos). */
export function firstRequirement(requirements: string) {
  const lines = requirements
    .split(/\r?\n|•|;/)
    .map((line) => line.replace(/^[-–•*\d.)\s]+/, "").trim())
    .filter(Boolean);
  return lines[0] || requirements.trim();
}

export function clampJobDescription(value: string) {
  return value.trim().slice(0, DESCRIPTION_MAX);
}

export const JOB_DESCRIPTION_MAX = DESCRIPTION_MAX;
