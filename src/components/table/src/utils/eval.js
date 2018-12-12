/**
* @Author: jianglei
* @Date:   2017-10-12 12:06:49
*/
'use strict';
import Vue from 'vue';
export default function buildTree(data, expandAll, parent = null, level = null, expandLevelArr) {
  let tmp = [];
  Array.from(data).forEach(function(record) {
    if (record._expanded === undefined) {
      Vue.set(record, '_expanded', expandAll);
    }
    let _level = 1;
    if (level !== undefined && level !== null) {
      _level = level + 1;
    }
    Vue.set(record, '_level', _level);
    // 如果有父元素
    if (parent) {
      Vue.set(record, 'parent', parent);
    }
    // if (expandLevelArr.indexOf(record._level) > -1 && record._expanded === undefined) {
    //   Vue.set(record, '_expanded', true);
    // }
    tmp.push(record);
    if (record.children && record.children.length > 0) {
      const children = buildTree(record.children, expandAll, record, _level, expandLevelArr);
      tmp = tmp.concat(children);
    }
  });
  return tmp;
}
