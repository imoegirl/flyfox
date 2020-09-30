import CMD from "./cmd.mjs";

const SC_MODBUS_SYMBOL = 0xfe;
const SC_STATIC_ADDR16 = 0xffff;
const SC_STATIC_DEVICE_TYPE = 0x00;

/*
  BasePackage 定义了基础的Buffer写入与读取功能
  SCPackage 定义了包头所需要的固定数据，
    包头长度: [i32_数据包长度，i8_固定0x68，i16_数据包长度，i16_数据包长度，i8_固定0x68，i8_包类型，i8_LRC]
    包类型(上机，心跳，Modbus) i8
    4G地址 (6 Bytes)
    SCPackage会在来构造时，将4G地址自动写入用户数据

  SCModbusPackage 定义了通用的数据类型包
    SCModbusPackage 在构造时将自动写入 包头固定数据，CMD

  具体的数据包需要调用FillData，填充自己的数据

  包结束时，调用FinishPackage，会得到整个包的bytes，将此通过网络发出
*/
class BasePackage {
  constructor(rawBuffer) {
    this.userDataBufferArray = [];
    this.userDataLength = 0;

    this.rawBuffer = rawBuffer;
    this.readOffset = 0;
  }

  writeUInt8(value) {
    let buffer = Buffer.alloc(1);
    buffer.writeUInt8(value, 0);
    this.userDataBufferArray.push(buffer);
    this.userDataLength += 1;
  }

  writeUInt16(value) {
    let buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(value, 0);
    this.userDataBufferArray.push(buffer);
    this.userDataLength += 2;
  }

  writeUInt32(value) {
    let buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value, 0);
    this.userDataBufferArray.push(buffer);
    this.userDataLength += 4;
  }

  writeString(value) {
    let buffer = Buffer.from(value);
    this.userDataBufferArray.push(buffer);
    this.userDataLength += buffer.length;
  }

  writeByteArray(byteArray) {
    let buffer = Buffer.from(byteArray);
    this.userDataBufferArray.push(buffer);
    this.userDataLength += buffer.length;
  }

  writeBuffer(buf) {
    this.userDataBufferArray.push(buf);
    this.userDataLength += buf.length;
  }

  readUInt8() {
    var value = this.rawBuffer.readUInt8(this.readOffset);
    this.readOffset += 1;
    return value;
  }

  readUInt16() {
    var value = this.rawBuffer.readUInt16BE(this.readOffset);
    this.readOffset += 2;
    return value;
  }

  readUInt32() {
    var value = this.rawBuffer.readUInt32BE(this.readOffset);
    this.readOffset += 4;
    return value;
  }

  readString(length) {
    if (this.readOffset + length >= this.length) {
      length = this.length - this.readOffset;
    }

    let array = [];
    for (let i = 0; i < length; ++i) {
      array.push(this.rawBuffer[this.readOffset + i]);
    }

    this.readOffset += length;
    return Buffer.from(array).toString();
  }

  peekString(length) {
    if (this.readOffset + length >= this.length) {
      length = this.length - this.readOffset;
    }

    let value = this.rawBuffer.slice(this.readOffset, length);
    return value;
  }

  readByteArray(length) {
    if (this.readOffset + length >= this.length) {
      length = this.length - this.readOffset;
    }

    var value = this.rawBuffer.slice(this.readOffset, length);
    this.readOffset += length;
    return value;
  }

  readBuffer(length) {
    return this.rawBuffer.slice(this.readOffset, this.readOffset + length);
  }
}

// 00000012 68 0012 0012 68 c9 | 010000000001 2f
// 00000012 68 0012 0012 68 C6 | 010000000001 32
// 0000001e 68 001e 001e 68 01 | 010000000001 fe ffff 00 31 06 21 22 23 24 2552 cd
// Custom user data write from 4G address
class SCPackage extends BasePackage {
  constructor(strAddr4G) {
    super(null);
    this.staticHeaderLength = 12;
    this.PackageType = 0x00;
    this.strAddr4G = strAddr4G;

    let addr4GBuf = Buffer.from(strAddr4G, "hex");
    this.writeBuffer(addr4GBuf);
  }

  FinishPackage() {
    let totalPackageLength = this.staticHeaderLength + this.userDataLength;
    let finalUserDataBuffer = Buffer.concat(this.userDataBufferArray);

    let finalBuffer = Buffer.alloc(totalPackageLength);
    let offset = 0;
    finalBuffer.writeUInt32BE(totalPackageLength, offset);
    offset += 4;
    finalBuffer.writeUInt8(0x68, offset);
    offset += 1;
    finalBuffer.writeUInt16BE(totalPackageLength, offset);
    offset += 2;
    finalBuffer.writeUInt16BE(totalPackageLength, offset);
    offset += 2;
    finalBuffer.writeUInt8(0x68, offset);
    offset += 1;
    finalBuffer.writeUInt8(this.PackageType, offset);
    offset += 1;

    finalBuffer.fill(finalUserDataBuffer, offset);
    offset += finalUserDataBuffer.length;
    // 计算LRC，从整个包的第一个字节，到倒数第2个字节，因为索引是从0开始的，所以是length - 2
    let lrc = global.foxCore.foxUtil.CalculateLRC(
      finalBuffer,
      0,
      finalBuffer.length - 2
    );
    finalBuffer.writeUInt8(lrc, offset);
    return finalBuffer;
  }
}

// 服务器->客户端，回复上线
class SCOnline extends SCPackage {
  constructor(strAddr4G) {
    super(strAddr4G);
    this.PackageType = 0xc9;
  }
}

// 服务器->客户端，回复心跳
class SCHeartBeat extends SCPackage {
  constructor(strAddr4G) {
    super(strAddr4G);
    this.PackageType = 0xc6;
  }
}

// 基础通用协议包
class SCModbusPackage extends SCPackage {
  constructor(strAddr4G, cmd) {
    super(strAddr4G);
    this.PackageType = 0x01;

    this.modBusSymbol = SC_MODBUS_SYMBOL;
    this.deviceAddr = SC_STATIC_ADDR16;
    this.deviceType = SC_STATIC_DEVICE_TYPE;
    this.CMD = cmd;
  }

  FillDeviceInfo() {
    this.writeUInt8(this.modBusSymbol);
    this.writeUInt16(this.deviceAddr);
    this.writeUInt8(this.deviceType);
    this.writeUInt8(this.CMD);
  }
}

// 3. 修改4G模块IP服务器地(1：4G模块参数设置)
class SCSet4GIPAndPort extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSet4GIPAndPort);
  }

  FillData(i8_ip1, i8_ip2, i8_ip3, i8_ip4, i16_port) {
    this.FillDeviceInfo();
    let dataLength = 6;
    this.writeUInt8(dataLength);
    this.writeUInt8(i8_ip1);
    this.writeUInt8(i8_ip2);
    this.writeUInt8(i8_ip3);
    this.writeUInt8(i8_ip4);
    this.writeUInt16(i16_port);
  }
}

// 5. 设置手机号
class SCSetPhoneNumber extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetPhoneNumber);
  }

  FillData(i8_phoneIndex, strPhoneNumber, i8_sendMsg) {
    this.FillDeviceInfo();
    let dataLength = 16;
    this.writeUInt8(dataLength);
    this.writeUInt8(i8_phoneIndex);
    let phoneBuf = Buffer.from(strPhoneNumber.split(""), "hex");
    this.writeBuffer(phoneBuf);
    this.writeUInt8(i8_sendMsg);
    this.writeBuffer(Buffer.from([0, 0, 0])); // 保留位
  }
}

// 6. 获取手机号
class SCGetPhoneNumber extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetPhoneNumber);
  }

  FillData(i8_phoneIndex) {
    this.FillDeviceInfo();
    let dataLength = 1;
    this.writeUInt8(dataLength); // datalength
    this.writeUInt8(i8_phoneIndex);
  }
}

// 7. 发送统计数量
class SCSendStatisticalData extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSendStatisticalData);
  }

  FillData(i16_loudian, i16_dianliu, i16_wendu) {
    this.FillDeviceInfo();
    let dataLength = 16;
    this.writeUInt8(dataLength);
    this.writeUInt16(i16_loudian);
    this.writeUInt16(i16_dianliu);
    this.writeUInt16(i16_wendu);
    this.writeBuffer(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])); // 10个字节保留
  }
}

class SCSetMsgContent extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetMsgContent);
  }

  FillData(msgContent) {
    this.FillDeviceInfo();
    let msgBuffer = Buffer.from(msgContent);
    let dataLength = msgBuffer.length;
    this.writeUInt8(dataLength);
    this.writeBuffer(msgBuffer);
  }
}

class SCGetMsgContent extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetMsgContent);
  }

  FillData() {
    this.FillDeviceInfo();
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCGetDomainAndPort extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetDomainAndPort);
  }

  FillData() {
    this.FillDeviceInfo();
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetDomainAndPort extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetDomainAndPort);
  }

  FillData(strDomain, i16_port) {
    this.FillDeviceInfo();
    let domainBuf = Buffer.from(strDomain);
    let dataLength = domainBuf.length + 2;
    this.writeUInt8(dataLength);
    this.writeBuffer(domainBuf);
    this.writeUInt16(i16_port);
  }
}

class SCGetAPN extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetAPN);
  }

  FillData() {
    this.FillDeviceInfo();
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetAPN extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetAPN);
  }

  FillData(strAPN) {
    this.FillDeviceInfo();
    let apnBuf = Buffer.from(strAPN);
    let dataLength = apnBuf.length;
    this.writeUInt8(dataLength);
    this.writeBuffer(apnBuf);
  }
}

class SCGetConnectionType extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetConnectionType);
  }

  FillData() {
    this.FillDeviceInfo();
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetConnectionType extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetConnectionType);
  }

  // 0 ip, 1 domain
  FillData(i8_type) {
    this.FillDeviceInfo();
    let dataLength = 1;
    this.writeUInt8(dataLength);
    this.writeUInt8(i8_type);
  }
}

class SCGetSimUseramePassword extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetSimUseramePassword);
  }

  FillData() {
    this.FillDeviceInfo();
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetSimUsernamePassword extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetSimUsernamePassword);
  }

  FillData(username, password) {
    this.FillDeviceInfo();
    let dataStr = username + "," + password;
    let dataBuf = Buffer.from(dataStr);
    let dataLength = dataBuf.length;
    this.writeUInt8(dataLength);
    this.writeBuffer(dataBuf);
  }
}
// ----------------------------------------
class CSPackage extends BasePackage {
  constructor(rawData) {
    super(rawData);

    this.totalDataLength = this.readUInt32();
    this.staticSymbol1 = this.readUInt8();
    this.length1 = this.readUInt16();
    this.length2 = this.readUInt16();
    this.staticSymbol2 = this.readUInt8();
    this.packageType = this.readUInt8();
    this.strAddr4G = this.readBuffer(6).toString("hex");
  }
}

class CSOnline extends CSPackage {
  constructor(rawData) {
    super(rawData);
  }
}

class CSHeartbeat extends CSPackage {
  constructor(rawData) {
    super(rawData);
  }
}

class CSModbusPackage extends CSPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadDeviceInfo();
  }

  ReadDeviceInfo() {
    this.modBusSymbol = this.readUInt8();
    this.deviceAddr = this.readUInt16();
    this.deviceType = this.readUInt8();
    this.CMD = this.readUInt8();
  }
}

class CSSet4GIPAndPort extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  ReadData() {
    this.dataLength = this.readUInt8();
    this.i8_ip1 = this.readUInt8();
    this.i8_ip2 = this.readUInt8();
    this.i8_ip3 = this.readUInt8();
    this.i8_ip4 = this.readUInt8();
    this.i16_port = this.readUInt16();
  }
}
export default null;
