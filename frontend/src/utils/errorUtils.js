export const safeError = (err) => {
  if (!err) return null;

  // If it's already a string, return it
  if (typeof err === 'string') return err;

  // If it's an Axios error
  if (err.response && err.response.data) {
    const data = err.response.data;
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
