export type TListener = () => void

export interface IBucket {
  ms: number;
  timer: any;
  listeners: Record<number, TListener>;
}

export interface ITimerReference {
  bucket: IBucket
  id: number
}

export type IClearHarmonicInterval = (timer: ITimerReference) => void

export class HarmonicInterval {
  buckets: Record<number, IBucket>
  counter: number
  constructor(){
    this.buckets = {}
    this.counter = 0
  }
  set(fn: TListener, ms: number): ITimerReference {
    const id = this.counter++
    if (this.buckets[ms]) {
      this.buckets[ms].listeners[id] = fn
    } else {
      const timer = setInterval(() => {
        const {listeners} = this.buckets[ms];
        let didThrow = false;
        let lastError: any;

        for (const listener of Object.values(listeners)) {
          try {
            listener();
          } catch (error) {
            didThrow = true;
            lastError = error;
          }
        }

        if (didThrow) throw lastError;
      }, ms);

      this.buckets[ms] = {
        ms,
        timer,
        listeners: {
          [id]: fn,
        },
      };
    }
    return {
      bucket: this.buckets[ms],
      id,
    };
  }
  clear({bucket, id}: ITimerReference): void {
    delete bucket.listeners[id];

    let hasListeners = false;
    for (const listener in bucket.listeners) {
      hasListeners = true;
      break;
    }

    if (!hasListeners) {
      clearInterval(bucket.timer);
      delete this.buckets[bucket.ms];
    }
  }
}
