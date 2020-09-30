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
    logger.info(finalBuffer, totalPackageLength);
    
    finalBuffer.fill(finalUserDataBuffer, offset, );
    offset += finalUserDataBuffer.length;
    // 计算LRC，从整个包的第一个字节，到倒数第2个字节，因为索引是从0开始的，所以是length - 2
    let lrc = global.foxCore.foxUtil.CalculateLRC(finalBuffer, 0, finalBuffer.length - 2);
    finalBuffer.writeUInt8(lrc, offset);
    return finalBuffer;
  }
}

// 服务器->客户端，回复上线
class SCOnlinePackage extends SCPackage {
  constructor(strAddr4G) {
    super(strAddr4G);
    this.PackageType = 0xc9;
  }
}

// 服务器->客户端，回复心跳
class SCHeartBeatPackage extends SCPackage {
  constructor() {
    super();
    this.PackageType = 0xc6;
  }
}

// 基础通用协议包
class SCModbusPackage extends SCPackage {
  constructor(strAddr4G, cmd){
    super(strAddr4G);
    this.PackageType = 0x01;
    this.CMD = cmd;

    this.writeUInt8(SC_MODBUS_SYMBOL);
    this.writeUInt16(SC_STATIC_ADDR16);
    this.writeUInt8(SC_STATIC_DEVICE_TYPE);
    this.writeUInt8(this.CMD);
  }
}

// 3. 修改4G模块IP服务器地(1：4G模块参数设置)
class SCSet4GIPAndPortPackage extends SCModbusPackage {
  constructor(strAddr4G){
    super(strAddr4G, 0x31);
  }

  FillData(i8_ip1, i8_ip2, i8_ip3, i8_ip4, i16_port) {
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
  constructor(strAddr4G){
    super(strAddr4G, 0x42);
  }

  FillData(i8_phoneIndex, strPhoneNumber, i8_sendMsg){
    let dataLength = 16;
    this.writeUInt8(dataLength);
    this.writeUInt8(i8_phoneIndex);
    let phoneBuf = Buffer.from(strPhoneNumber.split(""), "hex");
    this.writeBuffer(phoneBuf);
    this.writeUInt8(i8_sendMsg);
    this.writeBuffer(Buffer.from([0,0,0])); // 保留位
  }
}

// 6. 获取手机号
class SCGetPhoneNumber extends SCModbusPackage {
  constructor(strAddr4G){
    super(strAddr4G, 0x43);
  }

  FillData(i8_phoneIndex){
    let dataLength = 1;
    this.writeUInt8(dataLength); // datalength
    this.writeUInt8(i8_phoneIndex);
  }
}

// 7. 发送统计数量
class SCSendStatisticalData extends SCModbusPackage {
  constructor(strAddr4G){
    super(strAddr4G, 0x44);
  }

  FillData(i16_loudian, i16_dianliu, i16_wendu){
    let dataLength = 16;
    this.writeUInt8(dataLength);
    this.writeUInt16(i16_loudian);
    this.writeUInt16(i16_dianliu);
    this.writeUInt16(i16_wendu);
    this.writeBuffer(Buffer.from([0,0,0,0,0,0,0,0,0,0])); // 10个字节保留
  }
}

export { SCOnlinePackage, SCHeartBeatPackage, SCSet4GIPAndPortPackage };

// class CSPackage extends BasePackage {
//   constructor(rawData) {
//     super(rawData);

//     // 中位机发送：68+L（1字节）+L（1字节）+68+地址（4字节，4G模块地址）+命令码（C1）+数据个数N0 +LRC（累加和为零）.(N0=0)
//     this.staticSymbol1 = this.readUInt8()
//     this.length1 = this.readUInt8()
//     this.length2 = this.readUInt8()
//     this.staticSymbol2 = this.readUInt8()
//     this.addr4G = this.readUInt32()
//     this.cmd = this.readUInt8()
//     if (this.cmd === 0xC0) {
//       this.deviceAddr = this.readUInt8()
//       this.modbusCmd = this.readUInt8()
//       this.modbusLength = this.readUInt8()
//       // 这里只解析到modbus的数据个数
//     } else {
//       // 解析4G协议
//       this.dataLength = this.readUInt8()
//     }
//   }
// }
