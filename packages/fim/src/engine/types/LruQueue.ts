// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Least Recently Used (LRU) Queue */
export class LruQueue<T> {
  /**
   * Enqueues a value at the tail of the queue, or moves it to the tail of the queue if it already exists
   * @param value Value
   */
  public enqueue(value: T) {
    const me = this;
    if (me.queueValues.indexOf(value) !== -1) {
      if (me.queueValues.length === 1) {
        // This is the only value in the queue. It is already the tail element.
        return;
      }

      // Value already exists. Remove it
      me.queueValues = me.queueValues.filter(v => v !== value);
    }

    // Append to tail
    me.queueValues.push(value);
  }

  /**
   * Removes and returns the value at the head of the queue
   * @returns First value in the queue, or undefined if the queue is empty
   */
  public dequeue(): T | undefined {
    return this.queueValues.shift();
  }

  /**
   * Returns the number of values in the queue
   */
  public getCount(): number {
    return this.queueValues.length;
  }

  private queueValues: T[] = [];
}
