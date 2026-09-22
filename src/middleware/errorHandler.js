const { ApiError } = require('../utils/helpers');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      details: err.details || (err.stack ? err.stack.split('\n')[0] : undefined),
    },
  });
}

module.exports = { notFound, errorHandler };
