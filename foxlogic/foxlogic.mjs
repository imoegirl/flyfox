import ConnectorManager from "./connector_manager.mjs";
import {PackageHandler, PackageSender} from "./packages/packages_handler.mjs";

const connMgr = new ConnectorManager();
const packageHandler = new PackageHandler();
const packageSender = new PackageSender();

global.foxLogic = {
    "connMgr": connMgr,
    "packageHandler": packageHandler,
    "packageSender": packageSender,
}

export default null;