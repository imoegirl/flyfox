import ConnectorManager from "./connector_manager.mjs";
import PackageHandler from "./packages/packages_handler.mjs";
import HandleMap from "./handle_map.mjs";

const connMgr = new ConnectorManager();
const packageHandler = new PackageHandler();

global.foxLogic = {
  connMgr: connMgr,
  packageHandler: packageHandler,
  handleMap: HandleMap,
};

export default null;
