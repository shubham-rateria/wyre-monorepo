/**
 * We will write a simple task queue,
 * where elements to be processed will be entered
 * into a queue, the processor function will be provided
 * by the user. Upon failure of execution of n number
 * of times provided by the user, the fallback will also be
 * provided by the user
 */

/**
 * We will make an input queue per data room.
 */
function InputQueue(processor) {
  /**
   * A queue of input patches
   */
  let queue = [],
    /**
     * map from data path to pending patches to be applied.
     * this will a ascending sorted array sorted by seq number.
     */
    waitQueue = {},
    isProducing = false;

  async function produce(value) {
    isProducing = true;
    await new Promise((resolve, reject) => {
      queue.push(value);
      resolve(null);
    });
    isProducing = false;
  }

  function insertInWaitQueue(path, patch) {
    /**
     * sorted insert to the wait queue
     */
  }

  async function consume() {
    if (isProducing) return;
    await new Promise((resolve, reject) => {
      const value = queue.pop();
      if (value) {
        console.log("[worker:patch:consuming]", value);
        processor(value);
      }
      setTimeout(() => {
        resolve(null);
      }, 0);
    });
    await consume();
  }

  consume();

  return {
    produce,
  };
}

export function workRunner() {
  function sendMessage(patch) {
    console.log("[worker:sendingmessage]", patch);
    self.postMessage(patch);
  }

  const inputQueue = InputQueue(sendMessage);

  self.onmessage = (e) => {
    console.log("[worker:producing]", e.data);
    inputQueue.produce(e.data);
  };
}
