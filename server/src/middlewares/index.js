module.exports = {
  ...require('./auth'),
  errorHandler: require('./errorHandler'),
  validate: require('./validator').validate,
  upload: require('./upload')
};
