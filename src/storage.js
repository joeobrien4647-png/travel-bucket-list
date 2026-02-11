// Polyfill for window.storage API using localStorage
// The app expects window.storage.get(key) and window.storage.set(key, value)
window.storage = {
  get(key) {
    const value = localStorage.getItem(key);
    return value !== null ? { value } : null;
  },
  set(key, value) {
    localStorage.setItem(key, value);
  },
};
