const CMD = {
  // 4G 相关协议
  SCSet4GIPAndPort: 0x31,
  SCSetPhoneNumber: 0x42,
  SCGetPhoneNumber: 0x43,
  SCSendStatisticalData: 0x44,
  SCSetMsgContent: 0x45,
  SCGetMsgContent: 0x46,
  SCGetDomainAndPort: 0x47,
  SCSetDomainAndPort: 0x4a,
  SCGetAPN: 0x4b,
  SCSetAPN: 0x4c,
  SCGetConnectionType: 0x71,
  SCSetConnectionType: 0x72,
  SCGetSimUseramePassword: 0x73,
  SCSetSimUsernamePassword: 0x74,

  CSSet4GIPAndPort: 0xd1,
  CSSetPhoneNumber: 0xc2,
  CSGetPhoneNumber: 0xc3,
  CSSendStatisticaData: 0xc4,
  CSSetMsgContent: 0xc5,
  CSGetMsgContent: 0xc7,
  CSGetDomainAndPort: 0xc8,
  CSSetDomainAndPort: 0xca,
  CSGetAPN: 0xcb,
  CSSetAPN: 0xcc,
  CSGetConnectionType: 0x91,
  CSSetConnectionType: 0x92,
  CSGetSimUseramePassword: 0x93,
  CSSetSimUsernamePassword: 0x94,

  // 断路器相关协议
  // 断路器和智能监测协议CMD都一样，但是内容不一样
  // 需要在封包和解包时做具体区分

  // 智能监测特别协议
  SCGetDeviceAveData: 0x62,
  CSGetDeviceAveData: 0xa2,

  // 断路器和智能监测共用的(要区分设备类型)
  SCReportDeviceAddr: 0x64, // 设备地址固定0xffff
  SCGetDeviceCurrentData: 0x34,
  SCGetHistoryWarningDataCount: 0x36,
  SCGetHistoryWarningData: 0x38,
  SCGetDeviceBasicParams: 0x3a,
  SCSetDeviceBasicParams: 0x52, // 差异处理
  SCSetDeviceCurrentTime: 0x56,
  SCPoweroffDevice: 0x58,
  SCCorrectParams: 0x5a,
  SCSetDeviceAddr: 0x5c,
  SCPoweronDevice: 0x5e,
  SCStateSignal: 0x66,

  CSReportDeviceAddr: 0xa4,
  CSGetDeviceCurrentData: 0xd4, // 差异处理
  CSGetHistoryWarningDataCount: 0xd6,
  CSGetHistoryWarningData: 0xd8, // 差异处理
  CSGetDeviceBasicParams: 0xda, // 差异处理
  CSSetDeviceBasicParams: 0xb2, // 差异处理
  CSSetDeviceCurrentTime: 0xb6,
  CSPoweroffDevice: 0xb8,
  CSCorrectParams: 0xba,
  CSSetDeviceAddr: 0xbc,
  CSPoweronDevice: 0xbe,
  CSStateSignal: 0xa6, // 差异处理

  CSException: 0xeb,
};

export default CMD;

// class SCModbusPackage extends SCPackage {
//     constructor(strAddr4G, cmd) {
//       super(strAddr4G);
//       this.PackageType = 0x01;

//       this.modBusSymbol = SC_MODBUS_SYMBOL;
//       this.deviceAddr = SC_STATIC_ADDR16;
//       this.deviceType = SC_STATIC_DEVICE_TYPE;
//       this.CMD = cmd;
//     }

//     FillDeviceInfo() {
//       this.writeUInt8(this.modBusSymbol);
//       this.writeUInt16(this.deviceAddr);
//       this.writeUInt8(this.deviceType);
//       this.writeUInt8(this.CMD);
//     }
//   }
