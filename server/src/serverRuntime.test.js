const test = require("node:test");
const assert = require("node:assert/strict");
const { startHttpServer } = require("./serverRuntime");

test("starts the production listener on the platform port and public interface", () => {
  const onListening = () => {};
  const call = {};
  const app = {
    listen(...args) {
      Object.assign(call, { args });
      return "server";
    },
  };

  assert.equal(
    startHttpServer(app, { port: "10000", host: "0.0.0.0", onListening }),
    "server",
  );
  assert.deepEqual(call.args, ["10000", "0.0.0.0", onListening]);
});

test("uses port 5000 when no platform port is provided", () => {
  const previousPort = process.env.PORT;
  delete process.env.PORT;
  let args;
  try {
    startHttpServer({ listen: (...values) => { args = values; } });
    assert.equal(args[0], 5000);
    assert.equal(args[1], "0.0.0.0");
  } finally {
    if (previousPort === undefined) delete process.env.PORT;
    else process.env.PORT = previousPort;
  }
});
