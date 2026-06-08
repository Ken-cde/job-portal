export const safeError = (err) => {
  if (!err) return null;

  // If it's already a string, check if it's HTML
  if (typeof err === 'string') {
    if (err.trim().startsWith('<') && (err.includes('html') || err.includes('body'))) {
      return 'A server error occurred. Please try again later.';
    }
    return err;
  }

  // If it's an Axios error
  if (err.response && err.response.data) {
    const data = err.response.data;

    // If the server returned HTML instead of JSON
    if (typeof data === 'string' && data.trim().startsWith('<')) {
      return 'A server error occurred. Please try again later.';
    }

    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      return data.message || data.error || JSON.stringify(data);
    }
  }

  // If it's a standard Error object
  if (err.message) return err.message;

  // Fallback
  return typeof err === 'object' ? JSON.stringify(err) : String(err);
};
