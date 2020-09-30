import "./foxcore/foxcore.mjs";
import "./foxlogic/foxlogic.mjs";
import "./foxlogic/packages/packages.mjs";
import { SCSet4GIPAndPortPackage } from "./foxlogic/packages/packages.mjs";
import { SCHeartBeatPackage } from "./foxlogic/packages/packages.mjs";
import { SCOnlinePackage } from "./foxlogic/packages/packages.mjs";

global.logger.info("All Started");

const dbURL = "mongodb://localhost:27017/db_flyfox";
const serverPort = 9999;

function ConnectDB() {
  global.foxCore.dbAgent.ConnectDB(
    dbURL,
    () => {
      global.logger.info("Db connected");
      StartServer();
    },
    () => {
      global.logger.info("Db connecte faild");
    }
  );
}

function StartServer() {
  global.foxCore.server.StartServer(
    9999,
    () => {
      global.logger.info("Server Started OK");
    },
    () => {
      global.logger.error("Server start faild!");
    }
  );
}

// ConnectDB();

let strAddr4G = "010000000001";
let onlinePackage = new SCOnlinePackage();
onlinePackage.FillData(strAddr4G);

let heartbeatPackage = new SCHeartBeatPackage();
heartbeatPackage.FillData(strAddr4G);

let bytes = onlinePackage.FinishPackage();
global.logger.info(bytes);
bytes = heartbeatPackage.FinishPackage();
global.logger.info(bytes);

let setIPPackage = new SCSet4GIPAndPortPackage();
setIPPackage.FillData(strAddr4G, 0x21, 0x22, 0x23, 0x24, 0x2552);
bytes = setIPPackage.FinishPackage();
global.logger.info(bytes);
