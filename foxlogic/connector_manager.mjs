class Connector {
  construct(socketId) {
    this.socketId = socketId;
  }

  Init(addr, devicesAddrArray) {
    this.addr = addr;
    this.devicesAddrArray = devicesAddrArray;
  }
}

class ConnectorManager {
  constructor() {
    this.connectorMap = new Map();
  }

  AddConnector(socketId, addr, devicesAddrArray) {
    let connector = this.connectorMap.get(socketId);
    if (connector == undefined) {
      connector = new Connector(socketId);
    }
    connector.Init(addr, devicesAddrArray);
  }

  RemoveConnector(socketId) {
    let connector = this.connectorMap.get(socketId);
    if (this.connectorMap.delete(socketId)) {
      global.logger.info("Connector Deleted: ", connector.socketId, connector.addr);
    }else{
        global.logger.info("Connector does not exists: ", socketId);
    }
  }
}
