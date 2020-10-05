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
    this.packageType = 0x00;
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
    finalBuffer.writeUInt8(this.packageType, offset);
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
    this.packageType = 0xc9;
  }
}

// 服务器->客户端，回复心跳
class SCHeartBeat extends SCPackage {
  constructor(strAddr4G) {
    super(strAddr4G);
    this.packageType = 0xc6;
  }
}

class SCReset4G extends SCPackage {
  constructor(strAddr4G) {
    super(strAddr4G);
    this.packageType = 0xce;
  }
}

// 基础通用协议包
class SCModbusPackage extends SCPackage {
  constructor(strAddr4G, cmd) {
    super(strAddr4G);
    this.packageType = 0x01;

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
    this.FillDeviceInfo();
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
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetPhoneNumber);
    this.FillDeviceInfo();
  }

  FillData(i8_phoneIndex, strPhoneNumber, i8_sendMsg) {
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
    this.FillDeviceInfo();
  }

  FillData(i8_phoneIndex) {
    let dataLength = 1;
    this.writeUInt8(dataLength); // datalength
    this.writeUInt8(i8_phoneIndex);
  }
}

// 7. 发送统计数量
class SCSendStatisticalData extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSendStatisticalData);
    this.FillDeviceInfo();
  }

  FillData(i16_loudian, i16_dianliu, i16_wendu) {
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
    this.FillDeviceInfo();
  }

  FillData(msgContent) {
    let msgBuffer = Buffer.from(msgContent);
    let dataLength = msgBuffer.length;
    this.writeUInt8(dataLength);
    this.writeBuffer(msgBuffer);
  }
}

class SCGetMsgContent extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetMsgContent);
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCGetDomainAndPort extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetDomainAndPort);
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetDomainAndPort extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetDomainAndPort);
    this.FillDeviceInfo();
  }

  FillData(strDomain, i16_port) {
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
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetAPN extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetAPN);
    this.FillDeviceInfo();
  }

  FillData(strAPN) {
    let apnBuf = Buffer.from(strAPN);
    let dataLength = apnBuf.length;
    this.writeUInt8(dataLength);
    this.writeBuffer(apnBuf);
  }
}

class SCGetConnectionType extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetConnectionType);
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetConnectionType extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetConnectionType);
    this.FillDeviceInfo();
  }

  // 0 ip, 1 domain
  FillData(i8_type) {
    let dataLength = 1;
    this.writeUInt8(dataLength);
    this.writeUInt8(i8_type);
  }
}

class SCGetSimUseramePassword extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCGetSimUseramePassword);
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCSetSimUsernamePassword extends SCModbusPackage {
  constructor(strAddr4G) {
    super(strAddr4G, CMD.SCSetSimUsernamePassword);
    this.FillDeviceInfo();
  }

  FillData(username, password) {
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

class CSReset4G extends CSPackage {
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
    this.dataLength = this.readUInt8();
  }
}

class CSSet4GIPAndPort extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.i8_ip1 = this.readUInt8();
    this.i8_ip2 = this.readUInt8();
    this.i8_ip3 = this.readUInt8();
    this.i8_ip4 = this.readUInt8();
    this.i16_port = this.readUInt16();
  }
}

class CSSetPhoneNumber extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.i8_phoneIndex = this.readUInt8();
    this.strPhoneNumber = this.readBuffer(11).toString("hex");
    this.i8_sendMsg = this.readUInt8();
    // 保留3个字节
  }
}

class CSGetPhoneNumber extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.i8_phoneIndex = this.readUInt8();
    this.strPhoneNumber = this.readBuffer(11).toString("hex");
    this.i8_sendMsg = this.readUInt8();
    // 保留3个字节
  }
}

class CSSendStatisticaData extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.i16_loudian = this.readUInt16();
    this.i16_dianliu = this.readUInt16();
    this.i16_wendu = this.readUInt16();
    // 10个字节保留
  }
}

class CSSetMsgContent extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.msgContent = this.readBuffer(this.dataLength).toString();
  }
}

class CSGetMsgContent extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.msgContent = this.readBuffer(this.dataLength).toString();
  }
}

class CSGetDomainAndPort extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.strDomain = this.readBuffer(this.dataLength - 2).toString();
    this.i16_port = this.readUInt16();
  }
}

class CSSetDomainAndPort extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.strDomain = this.readBuffer(this.dataLength - 2).toString();
    this.i16_port = this.readUInt16();
  }
}

class CSGetAPN extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.strAPN = this.readBuffer(this.dataLength).toString();
  }
}

class CSSetAPN extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.strAPN = this.readBuffer(this.dataLength).toString();
  }
}

class CSGetConnectionType extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.i8_type = this.readUInt8();
  }
}

class CSSetConnectionType extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    this.i8_type = this.readUInt8();
  }
}

class CSGetSimUseramePassword extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    let str = this.readBuffer(this.dataLength).toString();
    let strArray = str.split(",");
    this.username = strArray[0];
    this.password = strArray[1];
  }
}

class CSSetSimUsernamePassword extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  ReadData() {
    let str = this.readBuffer(this.dataLength).toString();
    let strArray = str.split(",");
    this.username = strArray[0];
    this.password = strArray[1];
  }
}

// ===================== 具体设备协议 ==============
class SCGetDeviceAveData extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCGetDeviceAveData);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCReportDeviceAddr extends SCModbusPackage {
  // deviceAddr 固定为 0xffff
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCReportDeviceAddr);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCGetDeviceCurrentData extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCGetDeviceCurrentData);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCGetHistoryWarningDataCount extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCGetHistoryWarningDataCount);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCGetHistoryWarningData extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCGetHistoryWarningData);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData(i16_recordNum) {
    let dataLength = 2;
    this.writeUInt8(dataLength);
    this.writeUInt16(i16_recordNum);
  }
}

class SCGetDeviceBasicParams extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCGetDeviceBasicParams);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

// 差异化处理 -- 这条协议需要查看以前的工程是怎么写的
class SCSetDeviceBasicParams extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCSetDeviceBasicParams);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData_Breaker_Reclosure(
    i16_frameA,
    i16_ratedA,
    i16_longDelayA,
    i16_shortDelayA,
    i16_instantProtection,
    i16_leakageLimit,
    i16_overvoltage,
    i16_undervoltage,
    i16_phaseLoss,
    i8_longDelayTime,
    i8_shortDelayTime,
    i8_leakageTripTime,
    i8_tripSetting
  ) {
    let dataLength = 36;
    this.writeUInt8(dataLength);
    this.i16_frameA = i16_frameA; // 框架电流
    this.i16_ratedA = i16_ratedA; // 额定电流
    this.i16_longDelayA = i16_longDelayA; // 长延时电流
    this.i16_shortDelayA = i16_shortDelayA; // 短延时电流
    this.i16_instantProtection = i16_instantProtection; // 瞬时保护值
    this.i16_leakageLimit = i16_leakageLimit; // 漏电上限
    this.i16_overvoltage = i16_overvoltage; // 过压
    this.i16_undervoltage = i16_undervoltage; // 欠压
    this.i16_phaseLoss = i16_phaseLoss; // 缺相
    this.i16_standby9_15 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 14个字节
    this.i8_longDelayTime = i8_longDelayTime; // 长延时时间
    this.i8_shortDelayTime = i8_shortDelayTime; // 短延时时间
    this.i8_leakageTripTime = i8_leakageTripTime; // 漏电脱扣时间
    this.i8_tripSetting = i8_tripSetting;

    this.writeUInt16(this.i16_frameA);
    this.writeUInt16(this.i16_ratedA);
    this.writeUInt16(this.i16_longDelayA);
    this.writeUInt16(this.i16_shortDelayA);
    this.writeUInt16(this.i16_instantProtection);
    this.writeUInt16(this.i16_leakageLimit);
    this.writeUInt16(this.i16_overvoltage);
    this.writeUInt16(this.i16_undervoltage);
    this.writeUInt16(this.i16_phaseLoss);
    this.writeBuffer(Buffer.from(this.i16_standby9_15, "hex"));
    this.writeUInt8(this.i8_longDelayTime);
    this.writeUInt8(this.i8_shortDelayTime);
    this.writeUInt8(this.i8_leakageTripTime);
    this.writeUInt8(this.i8_tripSetting);
  }

  //   基本参数记录1（16个字）unsigned int base_data[16];
  // 0：漏电上限1，
  // 1:漏电上限2，
  // 2:漏电上限3，
  // 3：N线电流1，
  // 4：N线电流2，
  // 5：温度报警值1,
  // 6：温度报警值2,
  // 7：避雷器泄漏电流1，
  // 8：避雷器泄漏电流2,
  // 9：避雷器泄漏电流3
  // 10：（10~15保留）
  // 基本参数记录2（16个字节）：unsigned char base_data2[16];
  // 0：漏电延时（m）,
  // 1：电流延时（s）,
  // 2：温度延时（s），
  // 3： 泄漏电流延时时间（ms），
  // 4:报警设定  D7    D6  D5   D4    D3    D2     D1     D0
  //         漏电  电流 温度  泄漏 开关4  开关3  开关2  开关1
  // 5: 允许遥测数据上传 0：允许，1不允许
  // （6~15保留）
  FillData_Monitoring(
    i8_leakageLimit1,
    i8_leakageLimit2,
    i8_leakageLimit3,
    i8_nElectricity1,
    i8_nElectricity2,
    i8_temperatureWarning1,
    i8_temperatureWarning2,
    i8_arresterLeakage1,
    i8_arresterLeakage2,
    i8_arresterLeakage3,
    i8_leakageDelay,
    i8_electricityDelay,
    i8_temperatureDelay,
    i8_leakageElectricityDelay,
    i8_warningSetting,
    i8_isUpload
  ) {
    let dataLength = 48;
    this.writeUInt8(dataLength);
    this.writeUInt8(i8_leakageLimit1);
    this.writeUInt8(i8_leakageLimit2);
    this.writeUInt8(i8_leakageLimit3);
    this.writeUInt8(i8_nElectricity1);
    this.writeUInt8(i8_nElectricity2);
    this.writeUInt8(i8_temperatureWarning1);
    this.writeUInt8(i8_temperatureWarning2);
    this.writeUInt8(i8_arresterLeakage1);
    this.writeUInt8(i8_arresterLeakage2);
    this.writeUInt8(i8_arresterLeakage3);
    this.writeBuffer(Buffer.from([0, 0, 0, 0, 0, 0]));
    this.writeUInt8(i8_leakageDelay);
    this.writeUInt8(i8_electricityDelay);
    this.writeUInt8(i8_temperatureDelay);
    this.writeUInt8(i8_leakageElectricityDelay);
    this.writeUInt8(i8_warningSetting);
    this.writeUInt8(i8_isUpload);
    this.writeBuffer(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  }
}

class SCSetDeviceCurrentTime extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCSetDeviceCurrentTime);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData(year, month, day, hour, minute, second) {
    let bcdArray = foxCore.foxUtil.Date2BCD(
      year,
      month,
      day,
      hour,
      minute,
      second
    );
    let bcdYear = bcdArray[0];
    let bcdMonth = bcdArray[1];
    let bcdDay = bcdArray[2];
    let bcdHour = bcdArray[3];
    let bcdMinute = bcdArray[4];
    let bcdSecond = bcdArray[5];
    let dataLength = 6;
    this.writeUInt8(dataLength);
    this.writeUInt8(bcdYear);
    this.writeUInt8(bcdMonth);
    this.writeUInt8(bcdDay);
    this.writeUInt8(bcdHour);
    this.writeUInt8(bcdMinute);
    this.writeUInt8(bcdSecond);
  }
}

class SCPoweroffDevice extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCPoweroffDevice);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCCorrectParams extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCCorrectParams);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }
  FillData(
    i16_electricityA,
    i16_electricityB,
    i16_electricityC,
    i16_electricityN,
    i16_leakage,
    i16_voltageA,
    i16_voltageB,
    i16_voltageC,
    i8_correction // 校正，位操作
  ) {
    let dataLength = 17;
    this.writeUInt8(dataLength);
    this.writeUInt16(i16_electricityA);
    this.writeUInt16(i16_electricityB);
    this.writeUInt16(i16_electricityC);
    this.writeUInt16(i16_electricityN);
    this.writeUInt16(i16_leakage);
    this.writeUInt16(i16_voltageA);
    this.writeUInt16(i16_voltageB);
    this.writeUInt16(i16_voltageC);
    this.writeUInt8(i8_correction);
  }
}

class SCSetDeviceAddr extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCSetDeviceAddr);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData(newDeviceAddr) {
    let dataLength = 2;
    this.writeUInt8(dataLength);
    this.writeUInt16(newDeviceAddr);
  }
}

class SCPoweronDevice extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCPoweronDevice);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

class SCStateSignal extends SCModbusPackage {
  constructor(strAddr4G, deviceAddr, deviceType) {
    super(strAddr4G, CMD.SCStateSignal);
    this.deviceAddr = deviceAddr;
    this.deviceType = deviceType;
    this.FillDeviceInfo();
  }

  FillData() {
    let dataLength = 0;
    this.writeUInt8(dataLength);
  }
}

// ======================= 下面是下位机回复 ==============================
class CSGetDeviceAveData extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  // 直接读数据
  ReadData() {
    if (this.dataLength != 24) {
      // error
    }

    this.i16_leakage = this.readUInt16(); // 漏电
    this.i16_neutralElectricity = this.readUInt16(); // 中性电流
    this.i16_temperature = this.readUInt16(); // 温度
    this.i16_stateSignal = this.readUInt16(); // 变位信号（位操作）
    // 16个字节备用，无需解析
  }
}

class CSReportDeviceAddr extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  // 直接读数据
  ReadData() {
    // deviceAddr - deviceType
    this.deviceMap = new Map();

    let deviceCount = this.dataLength / 3;
    for (let i = 0; i < deviceCount; ++i) {
      let deviceAddr = this.readUInt16();
      let deviceType = this.readUInt8();
      this.deviceMap.set(deviceAddr, deviceType);
    }
  }
}

class CSGetDeviceCurrentData extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  // 直接读数据
  ReadData() {
    if (this.deviceType == 0x01 || this.deviceType == 0x02) {
      this.ReadData_Breaker_Reclosure();
    } else if (this.deviceType == 0x03) {
      this.ReadData_Monitoring();
    }
  }

  ReadData_Breaker_Reclosure() {
    this.i16_electricityA = this.readUInt16();
    this.i16_electricityB = this.readUInt16();
    this.i16_electricityC = this.readUInt16();
    this.i16_electricityN = this.readUInt16();
    this.i16_leakage = this.readUInt16();
    this.i16_voltageA = this.readUInt16();
    this.i16_voltageB = this.readUInt16();
    this.i16_voltageC = this.readUInt16();
    this.i16_temperature = this.readUInt16();
    this.i16_activePowerA = this.readUInt16();
    this.i16_activePowerB = this.readUInt16();
    this.i16_activePowerC = this.readUInt16();
    this.i16_wattlessPowerA = this.readUInt16();
    this.i16_wattlessPowerB = this.readUInt16();
    this.i16_wattlessPowerC = this.readUInt16();
    this.i16_powerFactorA = this.readUInt16();
    this.i16_powerFactorB = this.readUInt16();
    this.i16_powerFactorC = this.readUInt16();
    // standy 12 bytes
  }

  ReadData_Monitoring() {
    this.i16_leakage = this.readUInt16(); // 漏电
    this.i16_neutralElectricity = this.readUInt16(); // 中性电流
    this.i16_temperature = this.readUInt16(); // 温度
  }
}

class CSGetHistoryWarningDataCount extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  // 直接读数据
  ReadData() {
    this.warningCount = this.readUInt16();
  }
}

class CSGetHistoryWarningData extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
    this.ReadData();
  }

  // 直接读数据
  ReadData() {
    this.i16_leakage = this.readUInt16();
    this.i16_neutralElectricity = this.readUInt16();
    this.i16_temperature = this.readUInt16();
    this.standby = this.readBuffer(6);
    this.i16_faultCause = this.readUInt16();
    this.bcdBuffer = this.readBuffer(6);
    this.i16_recordNum = this.readUInt16();
  }
}

class CSGetDeviceBasicParams extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSSetDeviceCurrentTime extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSPoweroffDevice extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSCorrectParams extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSSetDeviceAddr extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSPoweronDevice extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSStateSignal extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

class CSException extends CSModbusPackage {
  constructor(rawData) {
    super(rawData);
  }

  // 直接读数据
  ReadData() {}
}

export default null;
