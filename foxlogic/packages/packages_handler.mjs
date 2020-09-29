import "./packages.mjs";

const CMD_INDEX = 8;
const CMD_MODBUS = 0xc0;

function LRC(buffer, start, length) {
  let lrc = 0;

  for (var i = start; i < length; ++i) {
    lrc += buffer[i];
  }

  lrc = lrc % 256;
  lrc = 256 - lrc;
  lrc = lrc % 256;

  return lrc;
}

function IsDataValid(sessionId, data) {
  if (data == null || data == undefined || data.length < 9) {
    global.packageLogger.error("数据包错误", data != undefined ? ("length: ", data.length) : "");
    return false;
  }

  let connector = global.foxLogic.connMgr.GetConnector(sessionId);

  let staticSymbol1 = data[0];
  let length1 = data[1];
  let length2 = data[2];
  let staticSymbol2 = data[3];
  let cmd = data[CMD_INDEX];

  if (staticSymbol1 != staticSymbol2 || staticSymbol1 != 0x68) {
    global.packageLogger.error(`数据包错误: 0x${staticSymbol1.toString(16)}, staticSymbol2: 0x${staticSymbol2.toString(16)}`);
    return false;
  }

  if (length1 != length2 || length1 <= 0) {
    global.packageLogger.error(`数据包错误，length1: ${length1}, length2: ${length2}`);
    return false;
  }

  let packageLen = data.length;
  if (cmd == CMD_MODBUS) {
    // modbus data package
    let modbusBuffer = data.slice(9, packageLen);
    let modbusBufferLen = modbusBuffer.length;
    if (modbusBufferLen < 5) {
      global.packageLogger.error("数据包错误，modbus 整包数据异常:", modbusBuffer);
      return false;
    }

    let modbusDataLength = modbusBuffer[2];
    if (modbusDataLength + 4 != modbusBufferLen) {
      global.packageLogger.error("数据包错误，modbus 数据包长度与整包长度不匹配: ", modbusBuffer);
      return false;
    }

    let lrc = LRC(modbusBuffer, 0, modbusBufferLen - 1);
    let lastValue = modbusBuffer[modbusBufferLen - 1];
    if (lrc != lastValue) {
      global.packageLogger.error(`数据包错误，modbus LRC校验失败，RawLRC: 0x${lastValue.toString(16)}, ComputeLRC: 0x${lrc.toString(16)}`);
      return false;
    }
  } else {
    // common data package
    let lastValue = data[packageLen - 1];
    let lrc = LRC(data, 0, packageLen - 1);
    if (lrc != lastValue) {
      global.packageLogger.error(`数据包错误，通用数据包LRC校验失败，RawLRC: 0x${lastValue.toString(16)}, ComputeLRC: 0x${lrc.toString(16)}`);
      return false;
    }
  }

  return true;
}

class PackageHandler {
  constructor() {
    this.enCMD = {
      Online: 0x01,
      ReportAddrs: 0x53,
    };
  }

  HandlePackage(id, data) {
    if (IsDataValid(id, data)) {
      let cmd = data[CMD_INDEX];
      global.packageLogger.info("处理数据包，CMD: ", cmd);
      switch (cmd) {
        case this.enCMD.Online:
          {
          }
          break;
        case this.enCMD.ReportAddrs:
          {
          }
          break;
      }
    }
  }
}


class PackageSender {
  construct() {
    this.enCMD = {

    }
  }

}


export default null;
export {PackageHandler, PackageSender}