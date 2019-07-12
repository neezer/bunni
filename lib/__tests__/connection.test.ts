import amqp from "amqplib";
import { Connection, Events, State, TopographyConfig } from "../connection";
import { noop, unwrap } from "../utils";

let connection: Connection;
let testConnection: amqp.Connection;
let testChannel: amqp.Channel;

const topography: TopographyConfig = {
  bindings: [{ queue: "testing", exchange: "default", pattern: "#" }],
  exchanges: [{ name: "default", type: "topic" }],
  queues: [{ name: "testing" }]
};

beforeAll(async () => {
  testConnection = await amqp.connect("amqp://localhost:5672");
  testChannel = await testConnection.createChannel();

  testChannel.on("error", noop);
});

afterAll(async () => {
  await testConnection.close();
});

afterEach(done => {
  if (connection) {
    connection.on(State.Closed, done);
    connection.close();
  } else {
    done();
  }
});

test("connects to rabbitmq", done => {
  let connectingCount = 0;

  connection = new Connection();

  connection.on(State.Connecting, () => (connectingCount += 1));
  connection.once(State.Connected, done);
  connection.connect(new URL("amqp://localhost:5672"));

  expect(connectingCount).toBe(1);
});

test("does not emit if connection is already active", done => {
  let connectingCount = 0;

  connection = new Connection();

  connection.on(State.Connecting, () => (connectingCount += 1));
  connection.once(State.Connected, done);

  connection.connect(new URL("amqp://localhost:5672"));
  connection.connect(new URL("amqp://localhost:5672"));
  connection.connect(new URL("amqp://localhost:5672"));

  expect(connectingCount).toBe(1);
});

test("emits failed", done => {
  connection = new Connection();

  connection.once(State.Failed, error => {
    expect(error.message).toBe("connect ECONNREFUSED 127.0.0.1:666");
    done();
  });

  connection.connect(new URL("amqp://localhost:666"));
});

describe("topography", () => {
  const exchangeName = topography.exchanges[0].name;

  beforeEach(async () => {
    try {
      await unwrap(testChannel.checkExchange(exchangeName));
      await unwrap(testChannel.deleteExchange(exchangeName));
    } catch (_) {
      testChannel = await testConnection.createChannel();
    }
  });

  test("asserts topography", async done => {
    connection = new Connection();

    connection.connect(new URL("amqp://localhost:5672"));
    connection.setup(topography);

    connection.once(Events.TopographyAsserted, async () => {
      const check = unwrap(testChannel.checkExchange(exchangeName));

      await expect(check)
        .resolves.toEqual({})
        .finally(done);
    });
  });
});

test("sending a message", done => {
  const exchangeName = topography.exchanges[0].name;
  const message = { key: "test", content: { hello: "world" } };

  testChannel.consume("testing", (msg: amqp.ConsumeMessage | null) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());

      expect(content).toEqual({ hello: "world" });
    } else {
      expect("message").toBe("present");
    }

    done();
  });

  connection = new Connection();

  connection.connect(new URL("amqp://localhost:5672"));
  connection.setup(topography);
  connection.send(message, exchangeName);
});

test("consumes messages from a queue", done => {
  const exchangeName = topography.exchanges[0].name;
  const content = Buffer.from(JSON.stringify({ hello: "world" }));

  connection = new Connection();

  // testChannel.consume("testing", (msg: amqp.ConsumeMessage | null) => {
  //   if (msg !== null) {
  //     const content = JSON.parse(msg.content.toString());

  //     expect(content).toEqual({ hello: "world" });
  //   } else {
  //     expect("message").toBe("present");
  //   }

  //   done();
  // });

  connection.consume(, (msg: amqp.ConsumeMessage | null) => {
    console.log(msg);
    done();
  })

  connection.connect(new URL("amqp://localhost:5672"));
  connection.setup(topography);
  testChannel.publish(exchangeName, "test", content);
});
