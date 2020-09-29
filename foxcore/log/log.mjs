
import log4js from "log4js";

class Log {
    constructor(filePrefix){
      log4js.configure({
        appenders: {
          file: { type: 'dateFile', filename: filePrefix, pattern: '_yyyy-MM-dd_hh.log' },
          console: { type: 'console' }
        },
        categories: {
          default: { appenders: ['console', 'file'], level: 'debug' }
        }
      })

      this.common = log4js.getLogger("Common");
      this.net = log4js.getLogger("Net");
      this.db = log4js.getLogger("DB");
      this.package = log4js.getLogger("Package");
    }
}

export default Log;