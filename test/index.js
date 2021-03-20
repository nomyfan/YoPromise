const promisessAplusTests = require("promises-aplus-tests");
const adapter = require("./adapter");

promisessAplusTests(adapter, function (err) {
  if (err) {
    throw err;
  }
});
