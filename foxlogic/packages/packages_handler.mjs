import HandleMap from "./handle_map.mjs";

const PACKAGE_TYPE_INDEX = 10;
const PACKAGE_TYPE_ONLINE = 0xc9;
const PACKAGE_TYPE_HEARTBEAT = 0xc6;
const PACKAGE_TYPE_MODBUS = 0x01;

const MODBUS_CMD_INDEX = 21;

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

// 00000012 68 0012 0012 68 c9 010000000001 2f -- 18 Bytes
// 0000001e 68 001e 001e 68 01 010000000001 fe ffff 00 31 06 212223242552cd
function IsDataValid(sessionId, data) {
  if (data == null || data == undefined || data.length < 18) {
    global.packageLogger.error(
      "数据包错误",
      data != undefined ? ("length: ", data.length) : ""
    );
    return false;
  }

  let buffer = data; //Buffer.from(data);

  let totalLength = buffer.readUInt32BE(0);
  let staticSymbol1 = buffer[5];
  let length1 = buffer.readUInt16BE(5);
  let length2 = buffer.readUInt16BE(7);
  let staticSymbol2 = buffer[9];
  let packageType = buffer[PACKAGE_TYPE_INDEX];

  if (staticSymbol1 != staticSymbol2 || staticSymbol1 != 0x68) {
    global.packageLogger.error(
      `数据包错误: 0x${staticSymbol1.toString(
        16
      )}, staticSymbol2: 0x${staticSymbol2.toString(16)}`
    );
    return false;
  }

  if (length1 != length2 || length1 <= 0) {
    global.packageLogger.error(
      `数据包错误，length1: ${length1}, length2: ${length2}`
    );
    return false;
  }

  // LRC check
  let packageLen = data.length;
  let lastValue = data[packageLen - 1];
  let lrc = LRC(data, 0, packageLen - 1);
  if (lrc != lastValue) {
    global.packageLogger.error(
      `数据包错误，通用数据包LRC校验失败，RawLRC: 0x${lastValue.toString(
        16
      )}, ComputeLRC: 0x${lrc.toString(16)}`
    );
    return false;
  }

  return true;
}

class PackageHandler {
  constructor() {}

  HandlePackage(id, data) {
    if (IsDataValid(id, data)) {
      let packageType = buffer[PACKAGE_TYPE_INDEX];
      global.packageLogger.info("处理数据包，类型: ", packageType);

      if (packageType == PACKAGE_TYPE_ONLINE) {
        let handler = HandleMap.get(PACKAGE_TYPE_ONLINE);
        if (handler != undefined) {
          handler(id, data);
        } else {
          global.packageLogger.error(
            `包处理器获取失败，PACKAGE_TYPE_ONLINE: 0x${PACKAGE_TYPE_ONLINE.toString(
              16
            )}`
          );
        }
      } else if (packageType == PACKAGE_TYPE_HEARTBEAT) {
        let handler = HandleMap.get(PACKAGE_TYPE_HEARTBEAT);
        if (handler != undefined) {
          handler(id, data);
        } else {
          global.packageLogger.error(
            `包处理器获取失败，PACKAGE_TYPE_HEARTBEAT: 0x${PACKAGE_TYPE_HEARTBEAT.toString(
              16
            )}`
          );
        }
      } else if (packageType == PACKAGE_TYPE_MODBUS) {
        let cmd = data[MODBUS_CMD_INDEX];
        let handler = HandleMap.get(cmd);
        if (handler != undefined) {
          handler(id, data);
        } else {
          global.packageLogger.error(
            `包处理器获取失败，Modbus消息: 0x${cmd.toString(16)}`
          );
        }
      } else {
        global.packageLogger.error(
          `无法处理的包类型，PackageType: 0x${packageType.toString(16)}`
        );
      }
    }
  }
}

export default PackageHandler;
