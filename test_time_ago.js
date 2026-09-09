const formatTimeAgo = (dateString) => {
  const now = new Date();
  const createdAt = new Date(dateString);
  const diffInMilliseconds = now.getTime() - createdAt.getTime();
  
  // Convert to different time units
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Return appropriate format
  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  } else if (diffInWeeks > 0) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} min ago`;
  } else {
    return 'Just now';
  }
};

// Test with different time intervals
const now = new Date();
console.log('Testing formatTimeAgo function:');

// Just now
console.log('Now:', formatTimeAgo(now.toISOString()));

// 5 minutes ago
const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
console.log('5 min ago:', formatTimeAgo(fiveMinAgo.toISOString()));

// 2 hours ago
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
console.log('2 hrs ago:', formatTimeAgo(twoHoursAgo.toISOString()));

// 3 days ago
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
console.log('3 days ago:', formatTimeAgo(threeDaysAgo.toISOString()));

// 2 weeks ago
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
console.log('2 weeks ago:', formatTimeAgo(twoWeeksAgo.toISOString()));