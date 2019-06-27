![bunni logo](https://)

# bunni

> Lightweight wrapper around [amqplib]()

- Defaults to JSON for message body parsing
- Works with one connection
- Leaves retry logic up to you
- Only dependencies are [amqplib]() and [debug]()

Bunni is built with the intention that you'll use `fanout` or `topic` exchanges.
If you need `direct` or `headers`, then another library might be a better fit
(for now).

If you need something more/different, try [rabbot](https://github.com/arobson/rabbot).

## Install

```shell
yarn install @neezer/bunni
```

## API

### `bunni.connect(url: URL)`

Establish a connection to a RabbitMQ broker. Note that retry logic is up to you
should the connection fail.

The `url` parameter should be an instance of [WHATWG URL](https://nodejs.org/api/url.html#url_the_whatwg_url_api).

This method returns nothing.

### `bunni.setup(topography: Topography)`

Assert your exchanges, queues, and bindings into existence. If bunni is still
connecting, will register a listener to call this again internally once a
connection has been established.

Topography should be in the shape of

```ts
{
  exchanges: [
    {
      name: 'name of exchange',
      type: "topic", // must be one of "direct" | "topic" | "fanout" | "headers"
      durable: false, // optional, no default
      internal: false, // optional, no default
      autoDelete: false, // optional, no default
      alternateExchange: false, // optional, no default
    },
    /* ... */
  ],
  queues: [
    {
      name: 'name of queue',
      exclusive: false, // optional, no default
      durable: false, // optional, no default
      autoDelete: false, // optional, no default
    },
    /* ... */
  ],
  bindings: [
    {
      queue: 'name of queue',
      exchange: 'name of exchange',
      pattern: 'pattern to route with'
    },
    /* ... */
  ]
}
```

This method returns nothing.

### `bunni.close()`

Closes the connection to the RabbitMQ broker.

This method returns nothing.

### `bunni.send(message: Message).to(exchange: Exchange)`

### `bunni.when(eventName: string).do(handler: (message: Message) => void)`

### Lifecycle Events

#### `bunni.onConnecting: () => void`

Emitted when bunni is attempting to connect to a RabbitMQ broker, as a result of
`bunni.connect()`.

#### `bunni.onConnected: () => void`

Emitted when bunni has successfully connected to the RabbitMQ broker and
successfully opened a communications channel through which to do work.

#### `bunni.onFailed: (error: Error) => void`

Emitted when bunni encounters an error during connection, channel, or topography
assertion.

NOTE: When bunni enounters a failure, it will close the connection if one is
open. Since bunni doesn't have assurances that all systems are green, it errs on
the side of caution and shuts everything down, leaving the decision of what to
do next up to you.

- failed to establish a connection to a broker
- failed to open a channel to the broker
- failed to assert topography

#### `bunni.onClosing: () => void`

Emitted when a request to close the connection is received, usually in response
to `bunni.close()`.

#### `bunni.onClosed: (error?: Error) => void`

Emitted when the connection to the broker has been un/successfully terminated.
If the close was not clean, an error will be present in the callback.
