import { Channel, connect, Connection as RawConnection } from "amqplib";
import makeDebug from "debug";
import { EventEmitter } from "events";
import { seq, unwrap } from "./utils";

const debug = makeDebug("bunni:connection");

export enum Events {
  TopographyAsserted = "topography-asserted"
}

export enum State {
  Closed = "closed",
  Closing = "closing",
  Connected = "connected",
  Connecting = "connecting",
  Failed = "failed"
}

interface ExchangeConfig {
  name: string;
  type: "direct" | "topic" | "fanout" | "headers";
  durable?: boolean;
  internal?: boolean;
  autoDelete?: boolean;
  alternateExchange?: string;
}

interface QueueConfig {
  name: string;
  exclusive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
}

interface BindConfig {
  queue: string;
  exchange: string;
  pattern: string;
}

export interface TopographyConfig {
  exchanges: ExchangeConfig[];
  queues: QueueConfig[];
  bindings: BindConfig[];
}

export class Connection extends EventEmitter {
  public state: State | null = null;
  public error: Error | null = null;
  public topography: TopographyConfig | null = null;

  // tslint:disable variable-name
  private _connection: RawConnection | null = null;
  private _channel: Channel | null = null;
  // tslint:enable variable-name

  public constructor() {
    super();

    this.on(State.Connecting, () => {
      this.state = State.Connecting;
      this.error = null;

      debug("connecting");
    });

    this.on(State.Connected, () => {
      this.state = State.Connected;
      this.error = null;

      debug("connected");
    });

    this.on(State.Failed, error => {
      this.state = State.Failed;
      this.error = error;

      debug("failed", error);

      this.close();
    });

    this.on(State.Closing, () => {
      this.state = State.Closing;

      debug("closing");
    });

    this.on(State.Closed, error => {
      this.state = State.Closed;
      this.error = error;

      if (error) {
        debug("closed with error", error);
      } else {
        debug("closed");
      }
    });

    this.on(Events.TopographyAsserted, () => {
      debug("topography asserted");
    });

    this.on("error", error => {
      debug(error);
    });
  }

  public setup(topography: TopographyConfig) {
    if (isTopographyConfig(topography)) {
      this.topography = topography;

      debug("using topography", topography);
      this.assertTopography();
    } else {
      throw new Error("given topography is not valid");
    }
  }

  public connect(url: URL) {
    if (this.state === State.Connected || this.state === State.Connecting) {
      debug("already connected");
      return;
    }

    this.emit(State.Connecting);

    unwrap<RawConnection>(connect(url.toString()))
      .then(connection => {
        this._connection = connection;

        unwrap<Channel>(connection.createConfirmChannel()).then(channel => {
          this._channel = channel;

          this.emit(State.Connected);
        });
      })
      .catch(error => {
        this.emit(State.Failed, error);
      });
  }

  public close() {
    this.emit(State.Closing);

    if (this._connection !== null) {
      if (this.state === State.Connected) {
        this._connection
          .close()
          .then(() => {
            this.emit(State.Closed);
          })
          .catch(error => {
            debug("error closing");
            this.emit(State.Closed, error);
          });
      } else {
        debug("already closed");
        this.emit(State.Closed);
      }
    } else {
      debug("nothing to close");
      this.emit(State.Closed);
    }
  }

  private assertTopography() {
    debug("asserting topography");

    const channel = this._channel;
    const topography = this.topography;

    if (channel === null) {
      if (this.state === null || this.state === State.Connecting) {
        debug("will assert topography when connection established");

        // THERE CAN ONLY BE ONE
        this.removeListener(State.Connected, this.assertTopography.bind(this));
        this.once(State.Connected, this.assertTopography.bind(this));

        return;
      } else {
        throw new Error("no channel to assert against");
      }
    }

    if (topography === null) {
      throw new Error("no topography given");
    }

    const exchanges = topography.exchanges.map(exchange =>
      unwrap(channel.assertExchange(exchange.name, exchange.type))
    );

    const queues = topography.queues.map(queue => {
      const { name, ...opts } = queue;

      return unwrap(channel.assertQueue(name, opts));
    });

    const bindings = topography.bindings.map(binding =>
      unwrap(
        channel.bindQueue(binding.queue, binding.exchange, binding.pattern)
      )
    );

    seq([...exchanges, ...queues, ...bindings])
      .then(() => {
        this.emit(Events.TopographyAsserted);
      })
      .catch(error => {
        this.emit(State.Failed, error);
      });
  }
}

function isTopographyConfig(maybe: unknown): maybe is TopographyConfig {
  if (typeof maybe === "object") {
    return (
      maybe !== null &&
      "exchanges" in maybe &&
      "queues" in maybe &&
      "bindings" in maybe
    );
  }

  return false;
}
