'use strict';

/*
* {num} type:Number like 100
* {format} type: String like '￥#.00'
* */
function NumberFormat(num, format) {
  if (!format) return num;
  if (num === 0) return 0;
  if (!num || num === '0') return '';
  let decimalPlace = format.split('.')[1].split('0').length - 1;
  try {
    let value = Number(num).toFixed(decimalPlace);
    let intNum = String(value).split('.')[0];
    let floatNum = String(value).split('.')[1];
    value = intNum.split('').map(function(v, i) {
      if (v !== '-' && (intNum.length - i - 1) % 3 === 0 && intNum.length - 1 !== i) {
        return v + ',';
      }
      return v;
    }).join('') + (floatNum ? ('.' + floatNum) : '');
    return format.replace('#.' + new Array(decimalPlace).fill(0).join(''), value);
  } catch (err) {
    console.error(err);
    return num;
  }
}

function DateFormat(date, fmt) {
  date = new Date(date);
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  };
  let week = {
    '0': '/u65e5',
    '1': '/u4e00',
    '2': '/u4e8c',
    '3': '/u4e09',
    '4': '/u56db',
    '5': '/u4e94',
    '6': '/u516d'
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length > 1 ? RegExp.$1.length > 2 ? '/u661f/u671f' : '/u5468' : '') + week[date.getDay() + '']);
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
    }
  }
  return fmt;
}

export {
  NumberFormat,
  DateFormat
};
