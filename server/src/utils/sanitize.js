/**
 * Escape special regex characters to prevent ReDoS / NoSQL injection
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for $regex
 */
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
