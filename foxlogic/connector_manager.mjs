import foxcoreMjs from "../foxcore/foxcore.mjs";

class Connector {
  construct(sessionId, strAddr4G) {
    this.sessionId = sessionId;
    this.strAddr4G = strAddr4G
  }

  InitDevices(deviceMap){
    this.deviceMap = deviceMap;
  }
}

// 4G 设备管理器
class ConnectorManager {
  constructor() {
    this.connectorMap = new Map();
  }

  OnConnectorOnline(sessionId, strAddr4G) {
    let connector = this.connectorMap.get(sessionId);
    if(connector == undefined){
      connector = new Connector(sessionId, strAddr4G);
    }else{
      if (connector.strAddr4G != strAddr4G){
        global.netLogger.warning(`同一个Socket连接，更新4G地址，0x${connector.strAddr4G} -> 0x${strAddr4G}`);
        connector.strAddr4G = strAddr4G;
      }
    }

    // todo: send event refresh view
  }

  OnConnectorReportedDevices(sessionId, devicesMap) {
    let connector = this.GetConnector(sessionId);
    if (connector != undefined){
      connector.InitDevices(deviceMap);
    }
    else{
      global.netLogger.error("获取4G设备失败，无法保存从机地址数据, sessionId: ", sessionId);
    }
    // todo: send event refresh view
  }

  RemoveConnector(sessionId) {
    let connector = this.connectorMap.get(sessionId);
    if (this.connectorMap.delete(sessionId)) {
      global.logger.info(
        "Connector Deleted: ",
        connector.socketId,
        connector.addr
      );
      // todo: send event refresh view
    } else {
      // global.logger.info("Connector does not exists: ", socketId);
    }
  }

  GetConnector(id) {
    return this.connectorMap.get(id);
  }

  Send(sessionId, data) {
    global.netBridge.SendData(sessionId, data);
  }
}

export default ConnectorManager;
