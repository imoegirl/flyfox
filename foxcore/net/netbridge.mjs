// 这个相当于一个中间层链接着逻辑和Core

class NetBridge {
  constructor(){
    
  }

  HandleConnectionData(session, data){

  }

  HandleConnectionClose(id){

  }

  HandleConnectionError(id){

  }

  SendData(id, bytes) {
    global.server.Send(id, bytes);
  }
}

export default NetBridge;