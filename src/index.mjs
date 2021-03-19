const PENDING = "PENDING";
const FULLFILLED = "FULLFILLED";
const REJECTED = "REJECTED";

function resolvePromise(promise, x, onFullfilled, onRejected) {
  if (promise === x) {
    throw new TypeError("There is an infinite cycle");
  }

  if (x instanceof YoPromise) {
    x.then(onFullfilled, onRejected);
  } else if (typeof x === "object" || typeof x === "function") {
    let then = null;
    try {
      then = x.then;
    } catch (e) {
      onRejected(e);
    }

    if (typeof then === "function") {
      let called = false;
      // TODO: set called
      try {
        const resp = (y) => {
          resolvePromise(promise, y, onFullfilled, onRejected);
        };
        const rejp = (r) => {
          onRejected(r);
        };
        then.apply(x, resp, rejp);
      } catch (e) {
        !called && onRejected(e);
      }
    } else {
      // x is not thenable
      onFullfilled(x);
    }
  } else {
    // x is not an object or function ,fullfill promise with x
    onFullfilled(x);
  }
}

export class YoPromise {
  constructor(resolver) {
    this.value = null;
    this.status = PENDING;
    this.reason = undefined;
    this.fullfilledCbs = [];
    this.rejectCbs = [];

    const onFullfilled = (value) => {
      this.value = value;
      this.status = FULLFILLED;

      this.fullfilledCbs.forEach((cb) => cb(this));
    };
    const onRejected = (reason) => {
      this.reason = reason;
      this.status = REJECTED;

      this.rejectCbs.forEach((cb) => cb(this));
    };

    resolver.call(this, onFullfilled, onRejected);
  }

  then(onFullfilled, onRejected) {
    function resolve(value, promise, func, res, rej) {
      let x;
      if (typeof func === "function") {
        try {
          x = func(value);
        } catch (e) {
          rej(e);
        }
      }
      resolvePromise(promise, x, res, rej);
    }
    const that = this;
    const promise = new YoPromise(function (res, rej) {
      if (that.status === PENDING) {
        that.fullfilledCbs.push((p) => {
          resolve(that.value, p, onFullfilled, res, rej);
        });

        that.rejectCbs.push((p) => {
          if (typeof onRejected === "function") {
            resolve(onRejected(that.reason), p, res, rej);
          } else {
            rej(that.reason);
          }
        });
      } else if (that.status === REJECTED) {
        if (typeof onRejected === "function") {
          resolve(onRejected(that.reason), this, onRejected, res, rej);
        } else {
          rej(that.reason);
        }
      } else {
        resolve(that.value, this, onFullfilled, res, rej);
      }
    });

    return promise;
  }
}
