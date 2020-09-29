class Connector {
  construct(sessionId) {
    this.sessionId = sessionId;
  }

  Init(addr, devicesAddrArray) {
    this.addr = addr;
    this.devicesAddrArray = devicesAddrArray;
    this.hexAddrStr = `0x${this.addr.toString(16)}`;
  }
}

class ConnectorManager {
  constructor() {
    this.connectorMap = new Map();
  }

  AddConnector(sessionId, addr, devicesAddrArray) {
    let connector = this.connectorMap.get(sessionId);
    if (connector == undefined) {
      connector = new Connector(sessionId);
    }
    connector.Init(addr, devicesAddrArray);

    // todo: send event refresh view
  }

  RemoveConnector(sessionId) {
    let connector = this.connectorMap.get(sessionId);
    if (this.connectorMap.delete(sessionId)) {
      global.logger.info("Connector Deleted: ", connector.socketId, connector.addr);
      // todo: send event refresh view
    }else{
        // global.logger.info("Connector does not exists: ", socketId);
    }
  }

  GetConnector(id){
    return this.connectorMap.get(id);
  }
}

export default ConnectorManager;