// 微任务队列
const queue: any[] = [];
let isFlushPending = false;

const resolvedPromise = Promise.resolve();

export function nextTick(fn) {
  return fn ? resolvedPromise.then(fn) : resolvedPromise;
}

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job: any;
  while ((job = queue.shift())) {
    job && job();
  }
}
