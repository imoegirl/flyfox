class BasePackage {
    constructor(){

    }
}


// SCModBusPackage 会自动写到数据个数字段，后面的类型和数据，需要手动赋予，然后AppendLRC
class SCModBusPackage {
  constructor (length, addr4G, deviceAddr, modBusCmd, dataLen) {
    this.length = length
    this.buffer = Buffer.alloc(this.length)
    this.offset = 0
    this.dataStartOffset = 0

    this.writeUInt8(0x68)
    this.writeUInt8(this.length)
    this.writeUInt8(this.length)
    this.writeUInt8(0x68)
    this.writeUInt32(addr4G)
    this.writeUInt8(0x40)
    this.dataStartOffset = this.offset
    this.writeUInt8(deviceAddr)
    this.writeUInt8(modBusCmd)
    this.writeUInt8(dataLen)
  }

  appendLRC () {
    var lrc = this.calculateCurrentBufferLRC()
    this.writeUInt8(lrc)
  }

  calculateCurrentBufferLRC () {
    let lrcArray = []

    let lrc = 0
    for (let i = this.dataStartOffset; i < this.offset; ++i) {
      lrcArray.push(this.buffer[i])
      lrc += this.buffer[i]
    }

    let lrcBuffer = Buffer.from(lrcArray)
    logger.info('LRCBuffer: ', lrcBuffer, 'LRCArray: ', lrcArray, 'dataStartOffset: ', this.dataStartOffset, 'offset:', this.offset)

    lrc = lrc % 256
    lrc = 256 - lrc
    lrc = lrc % 256
    return lrc
  }

  writeUInt8 (value) {
    this.buffer.writeUInt8(value, this.offset)
    this.offset += 1
  }

  writeUInt16 (value) {
    this.buffer.writeUInt16LE(value, this.offset)
    this.offset += 2
  }

  writeUInt32 (value) {
    this.buffer.writeUInt32BE(value, this.offset)
    this.offset += 4
  }

  writeString (value) {
    let writeLen = this.buffer.write(value, this.offset)
    this.offset += writeLen
  }

  writeByteArray (byteArray) {
    for (var i = 0; i < byteArray.length; ++i) {
      this.writeUInt8(byteArray[i])
    }
    this.offset += byteArray.length
  }
}

class SCPackage {
  constructor (length, addr4G, cmd) {
    this.length = length
    this.buffer = Buffer.alloc(this.length)
    this.offset = 0

    this.writeUInt8(0x68)
    this.writeUInt8(this.length)
    this.writeUInt8(this.length)
    this.writeUInt8(0x68)
    this.writeUInt32(addr4G)
    this.writeUInt8(cmd)
  }

  writeDataLen (value) {
    this.writeUInt8(value)
  }

  appendLRC () {
    var lrc = this.calculateCurrentBufferLRC()
    this.writeUInt8(lrc)
  }

  calculateCurrentBufferLRC () {
    // var lrc = 0
    // for (var i = 0; i < this.offset; ++i) {
    //   lrc ^= this.buffer[i]
    // }
    // return lrc

    let lrc = 0

    for (var i = 0; i < this.offset; ++i) {
      lrc += this.buffer[i]
    }

    lrc = lrc % 256
    lrc = 256 - lrc
    lrc = lrc % 256
    return lrc
  }

  writeUInt8 (value) {
    this.buffer.writeUInt8(value, this.offset)
    this.offset += 1
  }

  writeUInt16 (value) {
    this.buffer.writeUInt16LE(value, this.offset)
    this.offset += 2
  }

  writeUInt32 (value) {
    this.buffer.writeUInt32BE(value, this.offset)
    this.offset += 4
  }

  writeString (value) {
    let writeLen = this.buffer.write(value, this.offset)
    this.offset += writeLen
  }

  writeByteArray (byteArray) {
    for (var i = 0; i < byteArray.length; ++i) {
      this.writeUInt8(byteArray[i])
    }
    this.offset += byteArray.length
  }
}

class CSPackage {
  constructor (clientId, buffer) {
    this.buffer = buffer
    this.packageLength = this.buffer.length
    this.clientId = clientId
    this.offset = 0
    // 中位机发送：68+L（1字节）+L（1字节）+68+地址（4字节，4G模块地址）+命令码（C1）+数据个数N0 +LRC（累加和为零）.(N0=0)
    this.staticSymbol1 = this.readUInt8()
    this.length1 = this.readUInt8()
    this.length2 = this.readUInt8()
    this.staticSymbol2 = this.readUInt8()
    this.addr4G = this.readUInt32()
    this.cmd = this.readUInt8()
    if (this.cmd === 0xC0) {
      this.deviceAddr = this.readUInt8()
      this.modbusCmd = this.readUInt8()
      this.modbusLength = this.readUInt8()
      // 这里只解析到modbus的数据个数
    } else {
      // 解析4G协议
      this.dataLength = this.readUInt8()
    }

    logger.info('CS数据包基本结构: ', this)
  }

  readUInt8 () {
    var value = this.buffer.readUInt8(this.offset)
    this.offset += 1
    return value
  }

  readUInt16 () {
    var value = this.buffer.readUInt16LE(this.offset)
    this.offset += 2
    return value
  }

  readUInt32 () {
    var value = this.buffer.readUInt32BE(this.offset)
    this.offset += 4
    return value
  }

  readString (length) {
    if (this.offset + length >= this.length) {
      length = this.length - this.offset
    }

    let array = []
    for (let i = 0; i < length; ++i) {
      array.push(this.buffer[this.offset + i])
    }

    // var value = this.buffer.slice(this.offset, length)
    this.offset += length
    return Buffer.from(array).toString()
    // return value.toString()
  }

  peekString (length) {
    if (this.offset + length >= this.length) {
      length = this.length - this.offset
    }

    let value = this.buffer.slice(this.offset, length)
    return value
  }

  readByteArray (length) {
    if (this.offset + length >= this.length) {
      length = this.length - this.offset
    }

    var value = this.buffer.slice(this.offset, length)
    this.offset += length
    return value
  }
}

export { SCModBusPackage, CSPackage, SCPackage }