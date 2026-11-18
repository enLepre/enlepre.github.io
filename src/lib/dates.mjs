const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });

export function formatNoteDate(date) {
  const day = date.getUTCDate();
  const lastTwo = day % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
  return `${monthFormatter.format(date)} ${day}${suffix}, ${date.getUTCFullYear()}`;
}
