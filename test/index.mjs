import { YoPromise } from "../src/index.mjs";

(async () => {
  const promise = new YoPromise((res) => {
    setTimeout(() => {
      res(100);
    }, 500);
  });
  const promise2 = promise
    .then((val) => {
      return new YoPromise((res) => res(val * 2));
    })
    .then((val) => val * 2)
    .then(() => new YoPromise((_, rej) => rej(-1)))
    .then(
      (val) => {
        return new YoPromise((res) => {
          setTimeout(() => {
            res(val * 2);
          }, 500);
        });
      },
      (reason) => {
        return reason * 2;
      },
    );
  const result = await promise2;
  console.log(result);
})();
