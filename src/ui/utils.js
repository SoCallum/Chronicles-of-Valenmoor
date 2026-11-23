export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatShortDate(iso) {
  if (!iso) return "Today";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Today";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function randomItem(list = []) {
  return list[Math.floor(Math.random() * list.length)];
}

export function generateFantasyName(epithets) {
  const first = randomItem(epithets.firstNames);
  const surname = randomItem(epithets.surnames);
  return `${first} ${surname}`;
}
