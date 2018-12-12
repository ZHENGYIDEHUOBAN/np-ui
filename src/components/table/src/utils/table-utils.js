'use strict';
import { NumberFormat } from './data-format.js';
import { TreeToArray } from './data-translate.js';

function MergeTable(tableId, colIndex) {
  let table = document.querySelectorAll('#' + tableId + ' table')[1];
  if (!table.rows[0]) return;
  let cellLength = table.rows[0].cells.length;

  let GetCellsByIndex = function GetCellsByIndex(colIndex, defaultRows) {
    let cells = [];
    let rows = defaultRows || table.rows;
    if (!rows[0] || !rows[0].cells) return cells;
    for (let i = 0; i < rows.length; i++) {
      cells.push(rows[i].cells[colIndex]);
    }
    return cells;
  };

  // 根据单元格文字 及 上下顺序 将一列数据进行分组
  let GetSameTextCell = function GetSameTextCell(colIndex, rows) {
    let cells = GetCellsByIndex(colIndex, rows);

    let result = {};
    cells.forEach(function(v) {
      if (!v || !v.textContent) return;
      let resultKeys = Object.keys(result);
      if (!resultKeys) {
        result[v.textContent + ':' + resultKeys.length] = { data: [v] };
      } else {
        let lastresultKey = resultKeys.pop();
        if (lastresultKey && lastresultKey.split(':').filter(function(a) {
          return a === v.textContent;
        })[0]) {
          result[lastresultKey]['data'].push(v);
        } else {
          result[v.textContent + ':' + resultKeys.length] = { data: [v] };
        }
      }
    });
    return result;
  };

  // 合并单元格
  let MergeCells = function MergeCells(AllCells) {
    Object.keys(AllCells).forEach(function(k) {
      let cells = AllCells[k]['data'];
      cells.forEach(function(cell, i) {
        if (cell && i === 0) {
          cell.rowSpan = cells.length;
          cell.style.display = '';
        } else {
          cell.style.display = 'none';
        }
      });
    });
  };

  // 根据index合并单元格
  let MergeColByIndex = function MergeColByIndex(colIndex, cells) {
    if (colIndex >= table.rows[0].cells.length) return;

    MergeCells(GetSameTextCell(colIndex, cells));
  };

  // 获取没有 children 数据的单元格
  let GetNullChildrenCell = function GetNullChildrenCell(cells) {
    if (cells.children && cells.children.data) return GetNullChildrenCell(cells.children); else return cells;
  };

  // 根据index集合 合并单元格
  let MergeColByIndexList = function MergeColByIndexList(colIndexs, cells) {
    if (!(colIndexs instanceof Array)) return;
    let GroupCells = GetSameTextCell(colIndexs[0], cells);
    MergeCells(GroupCells);
    Object.keys(GroupCells).forEach(function(key) {
      let cells = GroupCells[key];
      if (!cells) return;

      colIndexs.forEach(function(colIndex, i) {
        let nullChildCells = GetNullChildrenCell(cells).data;
        if (!nullChildCells.map) {
          return;
        }
        let rows = nullChildCells.map(function(e) {
          if (e) {
            return e.parentElement;
          }
          return null;
        });
        cells.children = { data: rows };
        if (cells && cells.children && cells.children.data && cells.children.data.length > 1) {
          Object.keys(cells.children.data).forEach(function(k) {
            MergeColByIndexList(colIndexs.slice(i + 1, colIndexs.length), cells.children.data);
          });
        }
      });
    });
  };

  if (colIndex === undefined) {
    MergeColByIndexList(new Array(cellLength).join(0).split('').map(function(v, i) {
      return i;
    }));
  } else if (typeof colIndex === 'number') {
    MergeColByIndex(colIndex);
  } else if (colIndex instanceof Array) {
    MergeColByIndexList(colIndex);
  }
}

function FixGroupView(tableId, groupColumnIndex, rowsIndex) {
  var table = document.querySelectorAll('#' + tableId + ' table')[1];
  if (!table.rows[0]) return;
  for (var j = 0; j < table.rows.length; j++) {
    var row = table.rows[j];
    var cells = row.cells;
    if (rowsIndex.filter((i) => i === j).join('')) {
      for (let i = 0; i < cells.length; i++) {
        if (i === groupColumnIndex) {
          cells[groupColumnIndex].colSpan = cells.length;
          cells[i].style.display = '';
        } else {
          cells[i].style.display = 'none';
        }
      }
    } else {
      for (let i = 0; i < cells.length; i++) {
        cells[i].colSpan = 0;
        cells[i].style.display = '';
      }
    }
  }
}

function Group(data, field, treeField) {
  let result = {};
  if (!data || !(data instanceof Array)) {
    return result;
  }

  let getSameText = (data, field) => {
    let texts = {};
    if (!field) {
      return texts;
    }
    try {
      data.forEach(v => {
        texts[v[field]] = [];
      });
    } catch (err) {
      console.error(err);
    }
    return texts;
  };

  let fixData = (data, field) => {
    let result = [];
    try {
      Object.keys(data).forEach(key => {
        let item = {
          __isGroupHeader: true,
          children: data[key]
        };
        item[field] = key;
        result.push(item);
      });
    } catch (err) {
      console.error(err);
    }
    return result;
  };

  result = getSameText(data, field);

  data.forEach(v => {
    Object.keys(result).forEach((k, i) => {
      if (k === v[field]) {
        result[k].push(v);
      }
    });
  });

  return fixData(result, treeField);
};

function Groups(data, fields, treeField, sumColumns, summaryLevels) {
  let result = [];
  result = Group(data, fields[0], treeField);

  if (fields[1]) {
    result.forEach((v, i) => {
      v.children = Group(v.children, fields[1], treeField);
    });
  }

  if (fields[2]) {
    result.forEach(v => {
      v.children && v.children.forEach((c, i) => {
        c.children = Group(c.children, fields[2], treeField);
      });
    });
  }

  result.forEach((a, aIndex) => {
    a.__longCode = String(aIndex);
    if (a.children && (summaryLevels || []).filter(l => l === 0)[0] !== undefined) {
      a[treeField] += (sumColumns || []).map((column) => {
        var values = (TreeToArray(a.children) || []).map(v => v[column.field]).filter(v => v !== null && v !== '' && v !== undefined);
        if (typeof values[0] !== 'number') return '';
        const total = values.reduce((a, b) => a + b);
        return '&nbsp;&nbsp;<span style="color: grey;">[' + column.header + ']: <span style="color: red;">' + NumberFormat(total, column.numberFormat) + '</span></span>';
      }).join('');
    }
    if (a.children && a.children instanceof Array) {
      a.children.forEach((b, bIndex) => {
        b.__longCode = aIndex + '.' + bIndex;
        if (b.children && (summaryLevels || []).filter(l => l === 1)[0] !== undefined) {
          b[treeField] += (sumColumns || []).map((column) => {
            var values = (TreeToArray(b.children) || []).map(v => v[column.field]).filter(v => v !== null && v !== '' && v !== undefined);
            if (typeof values[0] !== 'number') return '';
            const total = (TreeToArray(b.children) || []).map(v => v[column.field]).reduce((a, b) => a + b);
            return '&nbsp;&nbsp;<span style="color: grey;">[' + column.header + ']: <span style="color: red;">' + NumberFormat(total, column.numberFormat) + '</span></span>';
          }).join('');
        }
        if (b.children && b.children instanceof Array) {
          b.children.forEach((c, cIndex) => {
            c.__longCode = aIndex + '.' + bIndex + '.' + cIndex;
          });
        }
      });
    }
  });

  return result;
}

export {
  MergeTable,
  FixGroupView,
  Group,
  Groups
};
