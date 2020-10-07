import Packages from "./packages.mjs";
import CMD from "./cmd.mjs";

function SendToRenderLayer(package) {}

const HandleMap = new Map();
HandleMap.set(CMD.PackageTypeOnline, (sessionId, data) => {
  global.packageLogger.info("HandlePackage 上线包");
  let package = new Packages.CSOnline(data);
  global.foxLogic.connMgr.OnConnectorOnline(sessionId, package.addr4G);
  global.foxLogic.connMgr.Send(sessionId, data);
});
HandleMap.set(CMD.PackageTypeHeartbeat, (sessionId, data) => {
  let package = new Packages.CSHeartbeat(data);
  global.packageLogger.info(
    `HandlePackage 心跳包，4G地址 0x${package.strAddr4G}`
  );
  global.foxLogic.connMgr.Send(sessionId, data);
});

HandleMap.set(CMD.CSSet4GIPAndPort, (sessionId, data) => {
  let package = new Packages.CSSet4GIPAndPort(data);
  global.packageLogger.info(
    `HandlePackage 设置IP和端口，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSetPhoneNumber, (sessionId, data) => {
  let package = new Packages.CSSetPhoneNumber(data);
  global.packageLogger.info(
    `HandlePackage 设置手机号，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetPhoneNumber, (sessionId, data) => {
  let package = new Packages.CSGetPhoneNumber(data);
  global.packageLogger.info(
    `HandlePackage 获取手机号，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSendStatisticaData, (sessionId, data) => {
  let package = new Packages.CSSendStatisticaData(data);
  global.packageLogger.info(
    `HandlePackage 统计数据，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSetMsgContent, (sessionId, data) => {
  let package = new Packages.CSSetMsgContent(data);
  global.packageLogger.info(
    `HandlePackage 设置短信内容，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetMsgContent, (sessionId, data) => {
  let package = new Packages.CSGetMsgContent(data);
  global.packageLogger.info(
    `HandlePackage 获取短信内容，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetDomainAndPort, (sessionId, data) => {
  let package = new Packages.CSGetDomainAndPort(data);
  global.packageLogger.info(
    `HandlePackage 获取域名和端口号，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSetDomainAndPort, (sessionId, data) => {
  let package = new Packages.CSSetDomainAndPort(data);
  global.packageLogger.info(
    `HandlePackage 设置域名和端口号，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetAPN, (sessionId, data) => {
  let package = new Packages.CSGetAPN(data);
  global.packageLogger.info(
    `HandlePackage 获取 APN，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSetAPN, (sessionId, data) => {
  let package = new Packages.CSSetAPN(data);
  global.packageLogger.info(
    `HandlePackage 设置 APN，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetConnectionType, (sessionId, data) => {
  let package = new Packages.CSGetConnectionType(data);
  global.packageLogger.info(
    `HandlePackage 获取连接方式，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSetConnectionType, (sessionId, data) => {
  let package = new Packages.CSSetConnectionType(data);
  global.packageLogger.info(
    `HandlePackage 设置连接方式，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetSimUsernamePassword, (sessionId, data) => {
  let package = new Packages.CSGetSimUsernamePassword(data);
  global.packageLogger.info(
    `HandlePackage 获取 Sim 卡用户名和密码，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSSetSimUsernamePassword, (sessionId, data) => {
  let package = new Packages.CSSetSimUsernamePassword(data);
  global.packageLogger.info(
    `HandlePackage 设置 Sim 卡用户名和密码，4G地址 0x${package.strAddr4G}`
  );
});
HandleMap.set(CMD.CSGetDeviceAveData, (sessionId, data) => {
  let package = new Packages.CSGetDeviceAveData(data);
  global.packageLogger.info(
    `HandlePackage 获取设备平均数据，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSReportDeviceAddr, (sessionId, data) => {
  let package = new Packages.CSReportDeviceAddr(data);
  global.packageLogger.info(
    `HandlePackage 上报从机地址，4G地址 0x${package.strAddr4G}`
  );
  package.deviceMap.forEach((value, key) => {
    global.packageLogger.info(
      `设备: 0x${key.toString(16)} 类型: 0x${value.toString(16)}`
    );
  });
});
HandleMap.set(CMD.CSGetDeviceCurrentData, (sessionId, data) => {
  let package = new Packages.CSSetDeviceCurrentTime(data);
  global.packageLogger.info(
    `HandlePackage 设置从机当前数据，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSGetHistoryWarningDataCount, (sessionId, data) => {
  let package = new Packages.CSGetHistoryWarningDataCount(data);
  global.packageLogger.info(
    `HandlePackage 获取历史报警个数，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSGetHistoryWarningData, (sessionId, data) => {
  let package = new Packages.CSGetHistoryWarningData(data);
  global.packageLogger.info(
    `HandlePackage 获取历史报警数据，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSGetDeviceBasicParams, (sessionId, data) => {
  let package = new Packages.CSGetDeviceBasicParams(data);
  global.packageLogger.info(
    `HandlePackage 获取从机基本参数，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSSetDeviceBasicParams, (sessionId, data) => {
  let package = new Packages.CSSetDeviceBasicParams(data);
  global.packageLogger.info(
    `HandlePackage 设置从机基本参数，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSSetDeviceCurrentTime, (sessionId, data) => {
  let package = new Packages.CSSetDeviceCurrentTime(data);
  global.packageLogger.info(
    `HandlePackage 设置从机当前时间，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSPoweroffDevice, (sessionId, data) => {
  let package = new Packages.CSPoweroffDevice(data);
  global.packageLogger.info(
    `HandlePackage 强制切断电源，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSCorrectParams, (sessionId, data) => {
  let package = new Packages.CSCorrectParams(data);
  global.packageLogger.info(
    `HandlePackage 参数校正，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSSetDeviceAddr, (sessionId, data) => {
  let package = new Packages.CSSetDeviceAddr(data);
  global.packageLogger.info(
    `HandlePackage 设置从机地址，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSPoweronDevice, (sessionId, data) => {
  let package = new Packages.CSPoweronDevice(data);
  global.packageLogger.info(
    `HandlePackage 重合闸，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSStateSignal, (sessionId, data) => {
  let package = new Packages.CSStateSignal(data);
  global.packageLogger.info(
    `HandlePackage 遥信信号，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});
HandleMap.set(CMD.CSException, (sessionId, data) => {
  let package = new Packages.CSException(data);
  global.packageLogger.info(
    `HandlePackage 异常应答，4G地址 0x${
      package.strAddr4G
    } 设备地址: 0x${package.deviceAddr.toString(
      16
    )} 设备类型: 0x${package.deviceType.toString(16)}`
  );
});

export default HandleMap;
