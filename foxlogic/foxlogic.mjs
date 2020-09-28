import ConnectorManager from "./connector_manager.mjs";

const connMgr = new ConnectorManager();

global.foxLogic = {
    "connMgr": connMgr,
}

export default null;