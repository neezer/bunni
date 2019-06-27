import { Bunni } from "../bunni";
import * as defExports from "../index";

test("exports bunni instance", () => {
  expect(defExports.bunni).toBeInstanceOf(Bunni);
});

test.todo("allows configuration of connection");
test.todo("allows asserting exchange");
test.todo("allows asserting queue");
test.todo("allows asserting of bindings");
test.todo("queue options");
test.todo("allows publishing");
test.todo("allows publishing with message priority");
