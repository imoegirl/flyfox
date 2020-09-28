import mongoose from "mongoose";

class DBAgent {
  constructor() {
    
  }

  ConnectDB(url, okCallback, errCallback) {
    mongoose.connect(url, { useNewUrlParser: true });
    mongoose.Promis = global.Promise;
    this.db = mongoose.connection;

    this.db.on("error", function (err) {
        // todo on error
        errCallback();
    });

    this.db.on("open", function(){
        // todo on open
        okCallback();
    });
    
    this.db.on("disconnected", function(){
        // todo disconnected
        errCallback();
    });
  }

  RegisterSchema(schemaName, schemaClass){
    mongoose.model(schemaName, schemaClass);
  }
}

export default DBAgent;
