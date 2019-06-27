// Bluebird is an explicit dependency of amqplib
// tslint:disable-next-line no-implicit-dependencies
import Bluebird from "bluebird";

import * as utils from "../utils";

describe("noop", () => {
  // kinda untestable
  test("does nothing??", () => {
    expect(utils.noop).not.toThrow();
  });
});

describe("unwrap", () => {
  test("returns a native promise from a bluebird promise", () => {
    const bluebird = Bluebird.resolve(42);
    const result = utils.unwrap(bluebird);

    expect(result).toBeInstanceOf(Promise);
    expect(result).not.toBeInstanceOf(Bluebird);
  });
});
