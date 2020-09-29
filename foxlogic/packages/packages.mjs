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
  constructor() {
    super(null);
    this.staticHeaderLength = 12;
    this.PackageType = 0x00;
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
    let lrc = global.foxCore.foxUtil.CalculateLRC(finalBuffer, 0, finalBuffer.length - 1);
    finalBuffer.writeUInt8(lrc, );
    return finalBuffer;
  }
}

class SCOnlinePackage extends SCPackage {
  constructor() {
    super();
    this.PackageType = 0xc9;
  }

  FillData(addrStr4G) {
    let addr4GBuf = Buffer.from(addrStr4G, "hex");
    this.writeBuffer(addr4GBuf);
  }
}

class SCHeartBeatPackage extends SCPackage {
  constructor() {
    super();
    this.PackageType = 0xc6;
  }

  FillData(addrStr4G) {
    let addr4GBuf = Buffer.from(addrStr4G, "hex");
    this.writeBuffer(addr4GBuf);
  }
}

export { SCOnlinePackage, SCHeartBeatPackage };

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
