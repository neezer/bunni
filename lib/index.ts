import { Bunni } from "./bunni";

export const bunni = Object.seal(new Bunni());

// bunni.connect(url) //=> establish a connection
// bunni.setup(topography) //=> assert topography

// bunni.onConnected = () => {} //=> event handler
// bunni.onClosed = () => {} //=> event handler
// ...

// bunni.close() //=> close the connection
// bunni.send(message) //=> publish a message

// bunni.on('routing.key', () => {}) //=> handle a message of a particular type
