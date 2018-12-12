'use strict';

let TreeToArray = function TreeToArray(tree, result, childField) {
  childField = childField || 'children';
  if (!tree || !tree.forEach) {
    return [];
  }
  result = result || [];

  tree.forEach(function(v) {
    result.push(v);
    if (v[childField]) {
      TreeToArray(v.children, result);
    }
  });

  return result;
};

let ArrayToTree = function ArrayToTree(data, idField, parentField, childField, parentDatas) {
  let result = [];
  if (!data || !data.forEach) {
    return result;
  }
  childField = childField || 'children';
  idField = idField || 'ID';
  parentField = parentField || 'parentID';
  parentDatas = parentDatas || data.filter(function(a) {
    return data.filter(function(b) {
      return a[parentField] === b[idField];
    }).join('');
  });

  parentDatas.forEach(function(a) {
    let childDatas = data.filter(function(b) {
      return a[idField] === b[childField];
    });
    if (childDatas.join('')) {
      a[childField] = childDatas;
      ArrayToTree(data, idField, parentField, childField, childDatas);
    }
  });

  return result;
};

let GroupArray = function GroupArray(data, groupColumns) {
  data = data || [];
  if (!groupColumns) {
    return data;
  }

  let SameTextsToTree = function SameTextsToTree(datas, column) {
    datas = datas || [];
    let result = [];
    if (!column || !column.field) return [];

    let keys = {};
    datas.forEach(function(_) {
      keys[_[column.field]] = '';
    });

    Object.keys(keys).forEach(function(key) {
      result.push({
        __groupTitle: '[' + column.header + ']: ' + keys,
        children: datas.filter(function(v) {
          return v[column.field] === keys;
        })
      });
    });
    return result;
  };

  let GetLastGroupChild = function GetLastGroupChild(data) {
    if (!data.children) return data;
    let result = [];
    if (data.children[0].__groupTitle) {
      result = GetLastGroupChild(data.children);
    } else {
      result = data;
    }
    return result;
  };

  let results = SameTextsToTree(data, groupColumns[0]);
  groupColumns.forEach(function(column, index) {
    if (index === 0) return;
    let childs = GetLastGroupChild(results);
    if (childs && childs.forEach) {
      childs.forEach(function(child) {
        child.chidren = SameTextsToTree(child.children, column);
      });
    }
  });
  return results;
};

export {
  TreeToArray,
  ArrayToTree,
  GroupArray
};
