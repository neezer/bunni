// Bluebird is an explicit dependency of amqplib
// tslint:disable-next-line no-implicit-dependencies
import Bluebird from "bluebird";

export function noop(...args: any[]) {
  // nothing
}

/**
 * amqplib uses Bluebird for Promises because of backwards compatibility (?).
 * This library targets Node LTS releases, all of which support native
 * Promises. Bluebird Promises don't always quack like native ones, so
 * unwrap the Bluebird promise to avoid any downstream complications.
 */
export function unwrap<T>(bluebird: Bluebird<any>) {
  return new Promise<T>(async (resolve, reject) => {
    try {
      const result = await bluebird;

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

export function seq(promises: Array<Promise<any>>): Promise<any> {
  return promises.reduce(
    (chain, next) => chain.then(() => next),
    Promise.resolve()
  );
}
