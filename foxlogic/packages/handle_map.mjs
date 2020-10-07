import Packages from "./packages.mjs";
import CMD from "./cmd.mjs";

const HandleMap = new Map();
HandleMap.set(CMD.PackageTypeOnline, (sessionId, data) => {
  global.packageLogger.info("HandlePackage 上线包");
  let package = new Packages.CSOnline(data);
  global.foxLogic.connMgr.OnConnectorOnline(sessionId, package.addr4G);
  global.foxLogic.connMgr.Send(sessionId, data);
});
HandleMap.set(CMD.PackageTypeHeartbeat, (sessionId, data) => {
  global.foxLogic.connMgr.Send(sessionId, data);
});

HandleMap.set(CMD.CSSet4GIPAndPort, (sessionId, data) => {});
HandleMap.set(CMD.CSSetPhoneNumber, (sessionId, data) => {});
HandleMap.set(CMD.CSGetPhoneNumber, (sessionId, data) => {});
HandleMap.set(CMD.CSSendStatisticaData, (sessionId, data) => {});
HandleMap.set(CMD.CSSetMsgContent, (sessionId, data) => {});
HandleMap.set(CMD.CSGetMsgContent, (sessionId, data) => {});
HandleMap.set(CMD.CSGetDomainAndPort, (sessionId, data) => {});
HandleMap.set(CMD.CSSetDomainAndPort, (sessionId, data) => {});
HandleMap.set(CMD.CSGetAPN, (sessionId, data) => {});
HandleMap.set(CMD.CSSetAPN, (sessionId, data) => {});
HandleMap.set(CMD.CSGetConnectionType, (sessionId, data) => {});
HandleMap.set(CMD.CSSetConnectionType, (sessionId, data) => {});
HandleMap.set(CMD.CSGetSimUseramePassword, (sessionId, data) => {});
HandleMap.set(CMD.CSSetSimUsernamePassword, (sessionId, data) => {});
HandleMap.set(CMD.CSGetDeviceAveData, (sessionId, data) => {});
HandleMap.set(CMD.CSReportDeviceAddr, (sessionId, data) => {});
HandleMap.set(CMD.CSGetDeviceCurrentData, (sessionId, data) => {});
HandleMap.set(CMD.CSGetHistoryWarningDataCount, (sessionId, data) => {});
HandleMap.set(CMD.CSGetHistoryWarningData, (sessionId, data) => {});
HandleMap.set(CMD.CSGetDeviceBasicParams, (sessionId, data) => {});
HandleMap.set(CMD.CSSetDeviceBasicParams, (sessionId, data) => {});
HandleMap.set(CMD.CSSetDeviceCurrentTime, (sessionId, data) => {});
HandleMap.set(CMD.CSPoweroffDevice, (sessionId, data) => {});
HandleMap.set(CMD.CSCorrectParams, (sessionId, data) => {});
HandleMap.set(CMD.CSSetDeviceAddr, (sessionId, data) => {});
HandleMap.set(CMD.CSPoweronDevice, (sessionId, data) => {});
HandleMap.set(CMD.CSStateSignal, (sessionId, data) => {});
HandleMap.set(CMD.CSException, (sessionId, data) => {});

export default HandleMap;
