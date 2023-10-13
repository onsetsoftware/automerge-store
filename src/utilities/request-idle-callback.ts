const fallback = function(cb: (idleDeadline: IdleDeadline) => void) {
  return setTimeout(function() {
    var start = Date.now();
    cb({
      didTimeout: false,
      timeRemaining: function() {
        return Math.max(0, 50 - (Date.now() - start));
      },
    });
  }, 1);
};

var isSupported = typeof requestIdleCallback !== "undefined";

const request = isSupported ? requestIdleCallback : fallback;
const cancel = isSupported ? cancelIdleCallback : clearTimeout;

export { request as requestIdleCallback, cancel as cancelIdleCallback };
