export function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((result, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) {
        return result;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();

      try {
        result[key] = decodeURIComponent(value);
      } catch (_error) {
        result[key] = value;
      }

      return result;
    }, {});
}
