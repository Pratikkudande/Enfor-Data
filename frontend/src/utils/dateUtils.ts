/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 */
export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return options?.addSuffix ? 'just now' : 'now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const suffix = options?.addSuffix ? ' ago' : '';
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}${suffix}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const suffix = options?.addSuffix ? ' ago' : '';
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''}${suffix}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    const suffix = options?.addSuffix ? ' ago' : '';
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}${suffix}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    const suffix = options?.addSuffix ? ' ago' : '';
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}${suffix}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  const suffix = options?.addSuffix ? ' ago' : '';
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''}${suffix}`;
}

/**
 * Format a date to a localized string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to a localized date and time string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
