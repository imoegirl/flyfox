import net from "net";

class Session {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
    this.lastMsgTimestamp = -1;
  }
}

class Server {
  constructor() {
    this.sessions = new Map();
    this.idIndex = 100000000;
  }

  StartServer(port, okCallback, errCallback) {
    this.port = port;
    this.okCallback = okCallback;
    this.errCallback = errCallback;

    let tServer = this;
    let sSocket = net.createServer(function (socket) {
      tServer.OnConnectionMade(socket);
    });

    sSocket.on("error", (e) => {
      tServer.OnServerError(e);
    });

    sSocket.listen(this.port, function () {
      tServer.OnServerStarted();
    });
  }

  OnServerStarted() {
    global.netLogger.info("On Server Started, Port: ", this.port);
    this.okCallback();
  }

  OnServerError(e) {
    global.netLogger.error("On Server Error, e.code: ", e.code);
    this.errCallback();
  }

  OnConnectionMade(connection) {
    let sessionId = this.idIndex;
    this.idIndex += 1;
    global.netLogger.info("New client connected! assign id: ", sessionId);
    connection.id = sessionId;
    let session = new Session(sessionId, connection);
    this.sessions.set(sessionId, session);

    let tServer = this;

    connection.on("data", function (data) {
      global.netLogger.info("Received Data From ", session.id, "Data: ", data);
      session.lastMsgTimestamp = Math.floor(Date.now() / 1000);
      global.netBridge.HandleConnectionData(session, data);
    });

    connection.on("close", function () {
      global.netLogger.info("On Session Closed, id: ", session.id);
      tServer.RemoveSession(session.id);
      global.netBridge.HandleConnectionClose(session.id);
    });

    connection.on("error", function () {
      global.netLogger.error("On Session Error, id: ", session.id);
      tServer.RemoveSession(session.id);
      global.netBridge.HandleConnectionError(session.id);
    });
  }

  HasSession(id) {
    return this.sessions.has(id);
  }

  GetSession(id) {
    return this.sessions.get(id);
  }

  RemoveSession(id) {
    if (this.sessions.delete(id)) {
      // delete successful
      global.netLogger.info("Session Removed, id: ", id);
    }
  }

  ShutdownSession(id) {
    let session = this.GetSession(id);
    global.netLogger.info("ShutdownSession, id: ", id);
    if (session != undefined) {
      session.socket.destroy();
    }
  }

  GetSessionCount() {
    return this.sessions.size;
  }

  ForeachSession(operatorFunc) {
    for (let [key, value] of this.sessions.entries()) {
      operatorFunc(value);
    }
  }

  Send(id, bytes) {
    let session = this.GetSession(id);
    if (session != undefined) {
      global.netLogger.info("Send Data to Session ", id, "Data: ", bytes);
      session.socket.write(bytes);
    } else {
      global.global.netLogger.info("数据发送失败，找不到Session，ID: ", id);
    }
  }
}

export default Server;
