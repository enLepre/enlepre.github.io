// Dates determine recency; explicit Markdown order breaks ties before the slug.
export function newestFirst(entries) {
  return [...entries].sort((a, b) =>
    b.data.date.getTime() - a.data.date.getTime()
    || (a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER)
    || a.id.localeCompare(b.id)
  );
}
