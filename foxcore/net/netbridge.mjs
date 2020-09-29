// 这个相当于一个中间层链接着逻辑和Core

class NetBridge {
  constructor(){
    
  }

  HandleConnectionData(session, data){
    global.foxLogic.packageHandler.HandlePackage(session.id, data);
  }

  HandleConnectionClose(id){
    global.foxLogic.connMgr.RemoveConnector(id);
  }

  HandleConnectionError(id){
    global.foxLogic.connMgr.RemoveConnector(id);
  }

  SendData(id, bytes) {
    global.server.Send(id, bytes);
  }
}

export default NetBridge;