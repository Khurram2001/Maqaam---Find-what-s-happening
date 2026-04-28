require("dotenv").config();

const app = require("./app");
const { assertEnv, port } = require("./config/env");

assertEnv();

app.listen(port, () => {
  console.log(`MEMS backend running on http://localhost:${port}`);
});
