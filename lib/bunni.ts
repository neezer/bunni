import { Connection, State } from "./connection";
import { noop } from "./utils";

export class Bunni {
  private connection: Connection = new Connection();

  // tslint:disable variable-name
  private _onConnecting: () => void = noop;
  private _onConnected: () => void = noop;
  private _onFailed: () => void = noop;
  // tslint:enable variable-name

  public constructor() {
    this.connection.on(State.Connecting, this._onConnecting);
    this.connection.on(State.Connected, this._onConnected);
    this.connection.on(State.Failed, this._onFailed);
  }

  public connect(url: URL) {
    this.connection.connect(url);
  }

  public set onConnecting(callback: unknown) {
    if (isCb(callback)) {
      this._onConnecting = callback;
    } else {
      throw new Error("provided value is not a function!");
    }
  }

  public set onConnected(callback: unknown) {
    if (isCb(callback)) {
      this._onConnected = callback;
    } else {
      throw new Error("provided value is not a function!");
    }
  }

  public set onFailed(callback: unknown) {
    if (isCb(callback)) {
      this._onFailed = callback;
    } else {
      throw new Error("provided value is not a function!");
    }
  }
}

function isCb(maybe: unknown): maybe is () => void {
  return typeof maybe === "function";
}
