var alarmRingTimeout;
var updateBadgeTextInterval;
var setDate;
var alarmDate; // 下一次提醒的时间
var guiLagAdjustment = 500;
// 默认的配置值
const settingData = {
  frequencyTime: 30,
  title: "喝水",
  timeFrom: "09:00",
  timeTo: "17:30",
};
var startAlarm;

function setAlarm(tMillis) {
  clearTimeout(startAlarm);
  const curTime = (() => {
    const hour = new Date().getHours();
    const min = new Date().getMinutes();
    return hour + "" + (min > 9 ? min : "0" + min);
  })();
  const from = settingData.timeFrom.replace(/:/, "");
  const to = settingData.timeTo.replace(/:/, "");
  const isTooEarly = +curTime < +from;
  const isTooLate = +curTime > +to;
  if (isTooEarly) {
    alert(`开始提醒时间为${settingData.timeFrom}，时间到了才会开始提醒！`);
    const gapTime = (() => {
      const year = new Date().getFullYear();
      const mon = new Date().getMonth() + 1;
      const date = new Date().getDate();
      return (
        (new Date(
          year + "-" + mon + "-" + date + " " + settingData.timeFrom,
        ).getTime() -
          new Date().getTime()) /
        1000
      );
    })();
    startAlarm = setTimeout(() => {
      ringIn(tMillis + guiLagAdjustment);
    }, parseInt(gapTime) * 1000);
    return;
  }
  if (isTooLate) {
    alert(`结束提醒时间为${settingData.timeTo}，已经过了提醒时间!`);
    return;
  }
  ringIn(tMillis + guiLagAdjustment);
}

// 设置定时
function ringIn(tMillis) {
  clearTimeout(alarmRingTimeout);
  clearInterval(updateBadgeTextInterval);

  var tSecs = parseInt(tMillis / 1000);
  var tMins = parseInt(tSecs / 60);
  var secs = tSecs % 60;
  var tHrs = parseInt(tMins / 60);
  var mins = tMins % 60;
  var millis = tMillis % 1000;

  alarmDate = new Date();
  alarmDate.setHours(alarmDate.getHours() + tHrs);
  alarmDate.setMinutes(alarmDate.getMinutes() + mins);
  alarmDate.setSeconds(alarmDate.getSeconds() + secs);
  alarmDate.setMilliseconds(alarmDate.getMilliseconds() + millis);

  setDate = new Date();
  alarmRingTimeout = setTimeout(ring, alarmDate.getTime() - setDate.getTime());

  // 定时设置图标徽章上的文字
  updateBadgeTextInterval = setInterval(function () {
    chrome.browserAction.setBadgeText({ text: getTimeLeftString(true) });
  }, guiLagAdjustment);
}

// 获取剩余时间
function getTimeLeft() {
  var now = new Date();
  return alarmDate.getTime() - now.getTime();
}

// 获取剩余时间字符
function getTimeLeftString(justMin = false) {
  const until = getTimeLeft();
  const tSecs = parseInt(until / 1000);
  const tMins = parseInt(tSecs / 60);
  let secs = tSecs % 60;
  let tHrs = parseInt(tMins / 60);
  let mins = tMins % 60;
  // 只精确到分钟,用于图标徽章显示
  if (justMin) {
    return tHrs > 0 ? tHrs + "hr" : tMins > 0 ? tMins + "m" : tSecs + "s";
  } else {
    // 补零显示
    secs = secs < 10 ? "0" + secs : secs;
    mins = mins < 10 ? "0" + mins : mins;
    tHrs = tHrs < 10 ? "0" + tHrs : tHrs;
    return (tHrs > 0 ? tHrs + ":" : "") + mins + ":" + secs;
  }
}

let notification = null;
// 提醒
function ring() {
  settingData.frequencyTime;
  var notificationOptions = {
    type: "basic",
    title: `${settingData.title}小助手提醒您：`,
    message: `${settingData.title}时间到啦！`,
    iconUrl: "img/tea-48.png",
    priority: 2,
    requireInteraction: true, //, buttons: [{title: 'Repeat'}, {title: 'Snooze for 1m'}]
  };
  chrome.notifications.create(notificationOptions);
  turnOff();
}
chrome.notifications.onClosed.addListener(() => {
  const num = settingData.frequencyTime; // 获取选择的倒计时时间
  setAlarm(num * 60 * 1000); // 开始计时
});

// 关闭
function turnOff() {
  clearTimeout(startAlarm);
  clearTimeout(alarmRingTimeout);
  clearInterval(updateBadgeTextInterval);
  alarmDate = null;
  setDate = null;
  chrome.browserAction.setBadgeText({ text: "" });
}
