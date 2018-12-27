/**
 * 行转树
 * @param {Array} data
 * @param {String} IDField
 * @param {String} ParentField
 * @param {Number} level
 * @param {String} childrenField
 * @param {Array} result
 */
const ArrayToTree = (data, IDField = 'ID', ParentField = 'ParentID', childrenField = 'children', level = 0, result = []) => {
  var temp;
  for (var i = 0; i < data.length; i++) {
    if (data[i].pid == pid) {
      var obj = { "text": data[i].name, "id": data[i].id };
      temp = fn(data, data[i].id);
      if (temp.length > 0) {
        obj.children = temp;
      }
      result.push(obj);
    }
  }
  return result;
};

/**
 * 树转行
 * @param {Array, Object} data
 * @param {String} childrenField
 * @param {Array} result
 */
const TreeToArray = (data, childrenField = 'children', result = []) => {
  if (Array.isArray(data)) {
    data.forEach(v => {
      result.push(v);
      if (result[childrenField] && Array.isArray(result[childrenField])) {
        TreeToArray(result[childrenField], childrenField, result);
      }
    });
  } else if (typeof data === 'object') {
    result.push(data);
    if (data[childrenField] && Array.isArray(data[childrenField])) {
      TreeToArray(TreeToArray, childrenField, result);
    }
  } else {
    console.error('数据结构不正确');
  }
  return result;
};

export {
  ArrayToTree,
  TreeToArray
};
