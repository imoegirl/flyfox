import Log from "./log/log.mjs";
import Server from "./net/server.mjs";
import NetBridge from "./net/netbridge.mjs";
import FoxUtil from "./net/foxutil.mjs";
import DBAgent from "./db/dbagent.mjs";

// -------- Module Log --------
const log = new Log("./Logs/Main");
global.logger = log.common;
global.netLogger = log.net;
global.dbLogger = log.db;
global.packageLogger = log.package;


// -------- Module Util --------
const foxUtil = new FoxUtil();
global.foxUtil = foxUtil;


// -------- Module Msg Handler --------
const netBridge = new NetBridge();
global.netBridge = netBridge;


// -------- Module Database --------
const dbAgent = new DBAgent();
global.dbAgent = dbAgent;


// -------- Module Server --------
const server = new Server();
global.server = server;
// server.StartServer();


global.foxCore = {
    "netBridge": netBridge,
    "dbAgent": dbAgent,
    "server": server,
    "foxUtil": foxUtil,
}

export default null;