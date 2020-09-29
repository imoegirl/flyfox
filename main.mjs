import "./foxcore/foxcore.mjs";
import "./foxlogic/foxlogic.mjs";

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

class A {
  constructor(){
    this.PackageType = 0x00;
  }

  ShowInfo(){
    console.log("Type: ", this.PackageType.toString(16));
  }
}

class B extends A{
  constructor(){
    super();
    this.PackageType = 0xC9;
  }
}

let b = new B();
b.ShowInfo();