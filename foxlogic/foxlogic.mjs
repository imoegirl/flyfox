import ConnectorManager from "./connector_manager.mjs";
import PackageHandler from "./packages/packages_handler.mjs";

const connMgr = new ConnectorManager();
const packageHandler = new PackageHandler();

global.foxLogic = {
  connMgr: connMgr,
  packageHandler: packageHandler,
};

export default null;
