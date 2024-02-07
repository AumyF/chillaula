import {
  AsyncObjectStack,
  StackGuard,
  createAsyncObjectStack,
} from "async-object-stack";

export class Logger {
  #stack: AsyncObjectStack;

  constructor() {
    this.#stack = createAsyncObjectStack();
  }

  region<R>(fn: () => R): R {
    return this.#stack.region(fn);
  }

  metadata(metadata: object): StackGuard {
    return this.#stack.push(metadata);
  }

  log(message: string): void {
    const metadata = this.#stack.render();
    console.log(JSON.stringify({ message, ...metadata }));
  }
}

export const logger = new Logger();
