class FoxUtil {
  constructor() {}

  Int2HexStr(value, byteSize) {
    if (value === undefined) {
      return "null";
    }
    var charLength = byteSize * 2;
    var hexValueStr = value.toString(16);
    var hexValueStrLen = hexValueStr.length;
    if (hexValueStrLen < charLength) {
      var pad0Count = charLength - hexValueStrLen;
      var zeroStr = const0Str.substr(0, pad0Count);
      hexValueStr = zeroStr + hexValueStr;
    }
    return "0x" + hexValueStr.toUpperCase();
  }

  // return [xx,xx,xx,xx,xx,xx]
  // 这里我真的不想描述怎么转的，基本上就是对应数字作为16进制数字
  Date2BCD(year, month, day, hour, min, sec) {
    var year2 = parseInt(year.toString().substr(2, 2));
    var bcdYear = parseInt(year2, 16);
    var bcdMonth = parseInt(month, 16);
    var bcdDay = parseInt(day, 16);
    var bcdHour = parseInt(hour, 16);
    var bcdMin = parseInt(min, 16);
    var bcdSec = parseInt(sec, 16);
    return [bcdYear, bcdMonth, bcdDay, bcdHour, bcdMin, bcdSec];
  }

  BCD2Date(bcdDateList) {
    var year = parseInt("20" + bcdDateList[0].toString(16));
    var month = parseInt(bcdDateList[1].toString(16));
    var day = parseInt(bcdDateList[2].toString(16));
    var hour = parseInt(bcdDateList[3].toString(16));
    var min = parseInt(bcdDateList[4].toString(16));
    var sec = parseInt(bcdDateList[5].toString(16));
    return [year, month, day, hour, min, sec];
  }
}

export default FoxUtil;
