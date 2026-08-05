function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err.message, err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: {
      message,
      status
    }
  });
}

module.exports = errorHandler;
