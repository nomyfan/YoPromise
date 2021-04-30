const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(
      new TypeError(
        "Promise and the return value are the same, which will cause infinite recursive call",
      ),
    );
  }

  if (x instanceof YoPromise) {
    x.then((y) => {
      resolvePromise(promise, y, resolve, reject);
    }, reject);
  } else if (typeof x === "object" || typeof x === "function") {
    // null is object also, we should resolve it immediately, otherwise
    // will cause `x.then` throws an exception.
    if (x === null) {
      return resolve(x);
    }

    let then = null;
    try {
      then = x.then;
    } catch (e) {
      return reject(e);
    }

    if (typeof then === "function") {
      let called = false;
      const resp = (y) => {
        if (!called) {
          called = true;
          resolvePromise(promise, y, resolve, reject);
        }
      };
      const rejp = (r) => {
        if (!called) {
          called = true;
          reject(r);
        }
      };
      try {
        then.call(x, resp, rejp);
      } catch (e) {
        !called && reject(e);
      }
    } else {
      // x is not thenable
      resolve(x);
    }
  } else {
    // x is not an object or function, fulfill promise with x
    resolve(x);
  }
}

function tryResolvePromise(promise, x, map, resolve, reject, passdown) {
  if (typeof map !== "function") {
    // The onFulfilled or onRejected callback is not provided.
    //
    // In this case, we just passdown the previous promise's result to the next promise.
    // `passdown` can be `resolve` or `reject` of the next promise.
    passdown(x);
  } else {
    try {
      resolvePromise(promise, map(x), resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
}

class YoPromise {
  constructor(resolver) {
    this.status = PENDING;
    this.result = undefined;
    this.fulfilledCbs = [];
    this.rejectCbs = [];

    const onFullfilled = (value) => {
      this.result = value;
      this.status = FULFILLED;

      this.fulfilledCbs.forEach((cb) => cb(value));
    };
    const onRejected = (reason) => {
      this.result = reason;
      this.status = REJECTED;

      this.rejectCbs.forEach((cb) => cb(reason));
    };

    try {
      resolver(onFullfilled, onRejected);
    } catch (e) {
      onRejected(e);
    }
  }

  then(onFulfilled, onRejected) {
    if (this.status === FULFILLED) {
      const promise2 = new YoPromise((resolve, reject) => {
        setTimeout(() => {
          tryResolvePromise(
            promise2,
            this.result,
            onFulfilled,
            resolve,
            reject,
            resolve,
          );
        }, 0);
      });

      return promise2;
    }

    if (this.status === REJECTED) {
      const promise2 = new YoPromise((resolve, reject) => {
        setTimeout(() => {
          tryResolvePromise(
            promise2,
            this.result,
            onRejected,
            resolve,
            reject,
            reject,
          );
        }, 0);
      });

      return promise2;
    }

    if (this.status === PENDING) {
      const promise2 = new YoPromise((resolve, reject) => {
        this.fulfilledCbs.push((value) => {
          setTimeout(() => {
            tryResolvePromise(
              promise2,
              value,
              onFulfilled,
              resolve,
              reject,
              resolve,
            );
          }, 0);
        });
        this.rejectCbs.push((reason) => {
          setTimeout(() => {
            tryResolvePromise(
              promise2,
              reason,
              onRejected,
              resolve,
              reject,
              reject,
            );
          }, 0);
        });
      });

      return promise2;
    }
  }
}

module.exports = YoPromise;
