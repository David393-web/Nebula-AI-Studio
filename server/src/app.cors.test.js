const test = require("node:test");
const assert = require("node:assert/strict");

const frontendOrigin = "https://nebula-ai-studio-psi.vercel.app";
const previousClientUrl = process.env.CLIENT_URL;
process.env.CLIENT_URL = frontendOrigin;
const app = require("./app");
if (previousClientUrl === undefined) delete process.env.CLIENT_URL;
else process.env.CLIENT_URL = previousClientUrl;

test("allows credentialed API preflight from the production frontend origin", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      method: "OPTIONS",
      headers: {
        Origin: frontendOrigin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), frontendOrigin);
    assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
