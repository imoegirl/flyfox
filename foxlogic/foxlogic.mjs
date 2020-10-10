import ConnectorManager from "./connector_manager.mjs";
import PackageHandler from "./packages/packages_handler.mjs";
import HandleMap from "./packages/handle_map.mjs";
import RenderBridge from "./render_bridge.mjs";

const connMgr = new ConnectorManager();
const packageHandler = new PackageHandler();
const renderBridge = new RenderBridge();

global.foxLogic = {
  connMgr: connMgr,
  packageHandler: packageHandler,
  handleMap: HandleMap,
  renderBridge: renderBridge,
};

export default null;
