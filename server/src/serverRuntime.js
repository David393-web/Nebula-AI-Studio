function startHttpServer(app, { port = process.env.PORT || 5000, host = "0.0.0.0", onListening } = {}) {
  return app.listen(port, host, onListening);
}

module.exports = { startHttpServer };
