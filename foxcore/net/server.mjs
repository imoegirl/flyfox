import net from "net";
import MsgHandler from "./netbridge.mjs";

class Session {
  constructor(id, socket){
    this.id = id;
    this.socket = socket;
  }
}

class Server {
  constructor(port) {
    this.port = port;
    this.sessions = new Map();
    this.idIndex = 100000000;
  }

  StartServer(){
    let tServer = this;
    let sSocket = net.createServer(function(socket){
      tServer.OnConnectionMade(socket);
    });
    sSocket.listen(this.port, function(){
      tServer.OnServerStarted();
    })
  }

  OnServerStarted(){
    netLogger.info("On Server Started, Port: ", this.port);
  }

  OnConnectionMade(connection){
    let sessionId = this.idIndex;
    this.idIndex += 1;
    connection.id = sessionId;
    let session = new Session(sessionId, connection);
    this.sessions.set(sessionId, session);

    let tServer = this;

    connection.on("data", function(data) {
      global.netBridge.HandleConnectionData(session, data);
    });

    connection.on("close", function() {
      tServer.RemoveSession(session.id);
      global.netBridge.HandleConnectionClose(session.id);
    });

    connection.on("error", function(){
      tServer.RemoveSession(session.id);
      global.netBridge.HandleConnectionError(session.id);
    });
  }

  HasSession(id){
    return this.sessions.has(id);
  }

  GetSession(id) {
    return this.sessions.get(id);
  }

  RemoveSession(id){
    if(this.sessions.delete(id)){
      // delete successful
    }
  }

  GetSessionCount(){
    return this.sessions.size;
  }

  ForeachSession(operatorFunc){
    for(let [key, value] of this.sessions.entries()){
      operatorFunc(value);
    }
  }

  Send(id, bytes) {
    let session = this.GetSession(id);
    if (session != undefined) {
      session.socket.write(bytes);
    }else{
      global.netLogger.info("数据发送失败，找不到Session，ID: ", id);
    }
  }
}

export default Server;
