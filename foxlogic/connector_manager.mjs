class Connector {
  construct(socketId) {
    this.socketId = socketId;
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

  GetConnector(id){
    return this.connectorMap.get(id);
  }
}

export default ConnectorManager;