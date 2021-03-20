const YoPromise = require("../src");

exports.deferred = function () {
  const def = {};

  def.promise = new YoPromise((resolve, reject) => {
    def.resolve = resolve;
    def.reject = reject;
  });

  return def;
};
