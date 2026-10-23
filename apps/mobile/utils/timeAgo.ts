/**
 * Formats timestamp into human-friendly call history age:
 * - < 1 min: "just now"
 * - 1 min: "1 min ago"
 * - 2-59 min: "X minutes ago" (e.g. 5 minutes ago, 10 minutes ago, 15 minutes ago, 30 minutes ago)
 * - 1 hour: "1 hour ago"
 * - 2-23 hours: "X hours ago" (e.g. 2 hours ago, ..., 23 hours ago)
 * - Yesterday: "Yesterday at hh:mm AM/PM"
 * - After yesterday: "DD/MM/YYYY, hh:mm AM/PM"
 */
export function formatCallTimeAge(dateInput?: string | number | Date | null): string {
  if (!dateInput) return 'just now';

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'just now';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  // Time format: "02:35 PM" (hh:mm AM/PM)
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = (hours % 12 || 12).toString().padStart(2, '0');
  const minuteStr = minutes.toString().padStart(2, '0');
  const timeStr = `${hour12}:${minuteStr} ${ampm}`;

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour === 1) return '1 hour ago';
    return `${diffHour} hours ago`;
  }

  if (isYesterday) {
    if (diffMin < 60) {
      if (diffMin < 1) return 'just now';
      if (diffMin === 1) return '1 min ago';
      return `${diffMin} minutes ago`;
    }
    return `Yesterday at ${timeStr}`;
  }

  // After yesterday: show date and time
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}, ${timeStr}`;
}
