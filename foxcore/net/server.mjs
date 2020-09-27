import net from "net";

class Server {
  constructor(ip, port) {
    this.ip = ip;
    this.port = port;
    console.log("Server constructer: ", this.ip, this.port);
  }

  Hello() {
    console.log("Say Hello from server");
  }
}

const server = new Server("127.0.0.1", 9999);

// export default Server;
export default server;
