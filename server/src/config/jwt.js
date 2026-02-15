module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRE || '7d',
  cookieExpire: 7 * 24 * 60 * 60 * 1000 // 7 days
};
