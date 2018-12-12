<template>
  <div :class="['win-table', {'data-table': type === 'dataTable', 'tree-table': type === 'treeTable' }]">
    <!-- 表格 -->
    <el-table
      :id="`${name}`"
      :data="viewData"
      border
      size="mini"
      class="np-table"
      :highlight-current-row="true"
      :max-height="maxHeight || null"
      :height="height || null"
      :default-sort="sort"
      :show-summary="TreeToArray(columns).some(v => v.summary)"
      :summary-method="handleSummaries"
      :span-method="handleColSpan"
      :cell-style="cellStyle"
      :header-cell-style="headerCellStyle"
      :row-style="showRow"
      @cell-click="handleCellClick"
      @sort-change="handleSortChange"
      @current-change="handleCurrentChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
      @selection-change="handleSelectionChange"
      :ref="`npTable${name}`"
    >
      <el-table-column v-if="multiple" type="selection" align="center" width="28"></el-table-column>
      <!-- 树表格 -->
      <el-table-column v-if="type === 'treeTable' && columns.length === 0" width="150" :align="columns.align || 'left'">
        <template slot-scope="scope">
          <span v-for="space in scope.row._level" class="ms-tree-space" :key="space"></span>
          <span class="tree-ctrl" v-if="iconShow(0, scope.row)" @click="toggleExpanded(scope.$index)">
            <i v-if="!scope.row._expanded" class="el-icon-plus"></i>
            <i v-else class="el-icon-minus"></i>
          </span>
          {{scope.$index}}
        </template>
      </el-table-column>
      <np-table-column
        v-for="(column, index) in columns"
        :columns="columns"
        :col="column"
        :key="index"
        :type="type"
        @toggleExpanded="toggleExpanded"
      ></np-table-column>
    </el-table>
    <textarea :id="this.name + 'textArea'" style="height: 0;width: 0; border: 0; position: absolute;display:none"></textarea>
  </div>
</template>

<script>
// import BScroll from 'better-scroll';
// import Vue from 'vue';
import NpCell from './NpCell';
import NpTableColumn from './NpTableColumn';
import { DateFormat, NumberFormat } from './utils/data-format';
import { TreeToArray } from './utils/data-translate';
import buildTree from './utils/eval';
import Sortable from 'sortablejs';
import _ from 'lodash';
export default {
  name: 'NpRenderTable3',
  components: {
    NpCell,
    NpTableColumn
  },
  props: {
    'merge-table': {
      type: Array,
      default() {
        return [];
      }
    },
    dragable: {
      type: Boolean,
      default: false
    },
    sort: {
      type: Object,
      default: () => {}
    },
    columns: {
      type: Array,
      default: () => []
    },
    data: {
      type: Array,
      default: () => []
    },
    maxHeight: {
      type: [String, Number]
    },
    height: {
      type: [String, Number]
    },
    multiple: {
      type: Boolean,
      default: true
    },
    name: {
      type: String,
      default: ''
    },
    spanMethod: {
      type: Function,
      default: () => {}
    },
    allowImport: { type: Boolean, default: true },
    groupField: {
      type: Array,
      default: () => []
    },
    cellStyle: {
      type: [Object, Function]
    },
    headerCellStyle: {
      type: [Object, Function]
    },
    /* 表格类型 treeTable-dataTable */
    type: {
      type: String,
      default: 'dataTable'
    },
    /* 整个表格只读 */
    readOnly: {
      type: Boolean,
      default: false
    },
    /* 树默认展开层级 */
    expandLevel: {
      type: Number,
      default: 0
    },
    /* 渲染汇总行 */
    renderGroupRow: {
      type: Function
    },
    /* 分组默认展开行 */
    groupExpandLevel: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      prevEditor: null, // 前一个编辑器
      currentRow: {}
    };
  },
  computed: {
    expandLevelArr() {
      return Array.apply(null, { length: this.expandLevel }).map((v, i) => {
        return i + 1;
      });
    },
    viewData: {
      get() {
        // 选中行焦点不丢失
        if (this.name && this.$refs[`npTable${this.name}`]) {
          let index = this.data.map(v => (v.ID || v.Id)).indexOf(this.currentRow.ID || this.currentRow.Id);
          if (index > -1) {
            this.$refs[`npTable${this.name}`].setCurrentRow(this.data[index]);
          }
        }
        // 格式化树表格数据
        if (this.type === 'treeTable') {
          let tmp;
          if (!Array.isArray(this.data)) {
            tmp = [this.data];
          } else {
            tmp = this.data;
          }
          const func = this.evalFunc || buildTree;
          const args = this.evalArgs ? Array.concat([tmp, this.expandAll], this.evalArgs) : [tmp, this.expandAll, null, null, this.expandLevelArr];
          return func.apply(this, args);
        } else {
          // 显示分组数据
          if (this.data.length > 0 && this.groupField && this.groupField.length > 0) {
            return this.groupData.filter(v => {
              if (v['__level'] === 1) {
                return v['__expandRow'] || (v['__parent'] && v['__parent']['__expand']);
              } else if (v['__level'] === 2) {
                if (v['__parent']['__expandRow'] === true && v['__parent']['__parent']) {
                  return v['__parent'] && v['__parent']['__expand'] && v['__parent']['__parent']['__expand'];
                } else {
                  return v['__parent'] && v['__parent']['__expand'];
                }
              }
            });
          } else {
            return this.data;
          }
        }
      },
      set(val) {

      }
    }
  },
  methods: {
    // 渲染文本
    renderText(scope, column) {
      if (column.type === 'index') {
        return scope.$index + 1;
      } else {
        if (column.dateFormat) {
          return scope.row[column.field] ? DateFormat(scope.row[column.field], column.dateFormat) : '';
        }
        if (column.numberFormat !== undefined) {
          if (scope.row[column.field] === null || isNaN(scope.row[column.field])) return null;
          return NumberFormat(scope.row[column.field], column.numberFormat);
        }
        if (column.drawCell && typeof column.drawCell === 'function') {
          return column.drawCell(scope, column, this.data);
        } else if (column.slotCell && typeof column.slotCell === 'function') {
          const cell = document.createElement('div');
          let value = scope.row[column.field];
          column.slotCell(cell, column, scope.row, value, scope.$index);
          return cell;
        }
        return scope.row[column.field];
      }
    },
    // 开启编辑
    handleCellClick(row, column, cell, event) {
      event.stopPropagation();
      let currentColumn = TreeToArray(this.columns).filter(v => v.field === column.property);
      if (currentColumn.length === 0) return;
      else currentColumn = currentColumn[0];
      if (currentColumn.readOnly === true) return;
      if (!currentColumn.editor) {
        this.cleanEdit();
        // 单元格点击回调函数
        if (currentColumn.cellClick && typeof currentColumn.cellClick === 'function') currentColumn.cellClick(row, column, cell, event);
        return;
      }
      this.cleanEdit();
      // 编辑前事件
      if (currentColumn.editor.beforeEdit && typeof currentColumn.editor.beforeEdit === 'function') {
        if (currentColumn.editor.beforeEdit(row, column, cell, event) === false) return;
      }
      row['_state'] === 'added' ? row['_state'] = 'added' : row['_state'] = 'modified';
      cell.querySelector('.cell-text').style.display = 'none';
      switch (currentColumn.editor.type) {
        case 'input':
          cell.querySelector('.el-input').style.display = 'inline';
          cell.querySelector('.el-input input').focus();
          break;
        case 'combobox':
          cell.querySelector('.el-select').style.display = 'inline';
          cell.querySelector('.el-select input').click();
          break;
        case 'date':
          cell.querySelector('.el-date-editor').style.display = 'block';
          cell.querySelector('.el-date-editor input').focus();
          break;
        default:
          break;
      }
      if (currentColumn.editor.type === 'checkbox') {
        return;
      }
      this.prevEditor = {
        dom: cell,
        column,
        row,
        type: currentColumn.editor.type
      };
    },
    // 清除编辑
    cleanEdit() {
      if (this.prevEditor) {
        let currentColumn = TreeToArray(this.columns).filter(v => v.field === this.prevEditor.column.property);
        this.prevEditor.dom.querySelector('.cell-text').style.display = 'inline';
        switch (this.prevEditor.type) {
          case 'input':
            if (this.prevEditor.dom.querySelector('.el-input__inner') === document.activeElement) {
              if (currentColumn[0].editor.enter) currentColumn[0].editor.enter(this.prevEditor.row[this.prevEditor.column.property], this.prevEditor.row);
            }
            this.prevEditor.dom.querySelector('.el-input').style.display = 'none';
            break;
          case 'combobox':
            this.prevEditor.dom.querySelector('.el-select').style.display = 'none';
            break;
          case 'date':
            this.prevEditor.dom.querySelector('.el-date-editor').style.display = 'none';
            break;
          default:
            break;
        }
        this.prevEditor.row['_state'] === 'added' ? this.prevEditor.row['_state'] = 'added' : this.prevEditor.row['_state'] = 'modified';
        if (currentColumn.length === 0) return;
        else currentColumn = currentColumn[0];
        let value = this.prevEditor.row[this.prevEditor.column.property];
        if (currentColumn.editor.type === 'input' && currentColumn.numberFormat) {
          let fixedArr = currentColumn.numberFormat.split('.');
          if (fixedArr.length > 0) {
            let fixedLength = fixedArr[1].length;
            this.$set(this.prevEditor.row, this.prevEditor.column.property, isNaN(Number(Number(value).toFixed(fixedLength))) ? null : Number(Number(value).toFixed(fixedLength)));
          }
        } else if (currentColumn.editor.type === 'date' && currentColumn.dateFormat) {
          this.$set(this.prevEditor.row, this.prevEditor.column.property, value ? DateFormat(new Date(value), currentColumn.dateFormat) : '');
        }
        if (currentColumn.editor.endEdit && typeof currentColumn.editor.endEdit === 'function') currentColumn.editor.endEdit(this.prevEditor);
        this.prevEditor = null;
      }
    },
    // 排序
    handleSortChange({ column, prop, order }) {
      this.cleanEdit();
      let currentColumn = TreeToArray(this.columns).filter(v => v.field === prop);
      if (currentColumn.length === 0) return;
      else currentColumn = currentColumn[0];
      this.data = this.data.sort((prev, curr) => {
        if (currentColumn.dateFormat) {
          return order === 'ascending' ? new Date(prev[prop]) - new Date(curr[prop]) : new Date(curr[prop]) - new Date(prev[prop]);
        } else if (currentColumn.numberFormat !== undefined) {
          return order === 'ascending' ? Number(prev[prop]) - Number(curr[prop]) : Number(curr[prop]) - Number(prev[prop]);
        } else {
          return order === 'ascending' ? String(prev[prop]).localeCompare(String(curr[prop])) : String(curr[prop]).localeCompare(String(prev[prop]));
        }
      });
    },
    // 合计行计算方法
    handleSummaries({ columns, data }) {
      const sums = [];
      TreeToArray(this.columns.filter(v => v.viewVisible !== false)).forEach((column, index) => {
        if (column.summaryTitle) {
          sums[this.multiple ? index + 1 : index] = column.summaryTitle;
          return;
        }
        const values = data.map(item => Number(item[column.field]));
        if (!values.every(value => isNaN(value)) && column.summary === true) {
          sums[this.multiple ? index + 1 : index] = values.reduce((prev, curr) => {
            const value = Number(curr);
            if (!isNaN(value)) {
              return prev + curr;
            } else {
              return prev;
            }
          }, 0);
          if (column.numberFormat) sums[this.multiple ? index + 1 : index] = NumberFormat(sums[this.multiple ? index + 1 : index], column.numberFormat);
        } else {
          sums[this.multiple ? index + 1 : index] = '';
        }
      });
      return sums;
    },
    getMergeEndRow(rowIndex, column, cellValue) {
      let result = {
        endIndex: rowIndex,
        colspan: 1,
        rowspan: 1
      };
      for (let i = rowIndex + 1; i < this.data.length; i++) {
        const row = this.data[i];
        const prevRow = this.data[i - 1];
        if (
          row[column.property] !== cellValue &&
          prevRow[column.property] === cellValue
        ) {
          const rowspan = i - rowIndex;
          return {
            endIndex: i,
            rowspan: rowspan,
            colspan: rowspan < 1 ? 0 : 1
          };
        }

        if (
          i === this.data.length - 1 &&
          row[column.property] === cellValue
        ) {
          const rowspan = i - rowIndex + 1;
          return {
            endIndex: i,
            rowspan: rowspan < 1 ? 0 : rowspan,
            colspan: rowspan < 1 ? 0 : 1
          };
        }
      }
      return result;
    },
    /**
     * 列合并
     * */
    handleColSpan(params) {
      const { row, column, columnIndex, rowIndex } = params;
      const indexOfMerge = this.mergeTable.indexOf(columnIndex);
      if (indexOfMerge < 0) {
        return { colspan: 1, rowspan: 1 };
      }
      const cellValue = row[column.property];
      if (rowIndex > 0) {
        const prevCellValue = this.data[rowIndex - 1][column.property];
        if (prevCellValue === cellValue) {
          return { colspan: 0, rowspan: 0 };
        }
      }
      return this.getMergeEndRow(rowIndex, column, cellValue);
    },
    // 切换分组
    toggleExpand(row, index) {
      if (this.groupField.length) {
        if (this.name) {
          document.querySelectorAll('.np-table .current-row').forEach(v => {
            v.classList.remove('current-row');
          });
          this.$refs[`npTable${this.name}`].setCurrentRow(row);
        }
        if (!row.isGroupField || index !== 1) return;
        if (row.__expand === true) {
          this.$set(row, '__expand', false);
          this.$emit('update:data', this.data.map(v => {
            if (v[this.groupField[0]] === row[this.groupField[0]]) {
              v.parentID = null;
            }
            return v;
          }));
        } else {
          this.$set(row, '__expand', true);
          this.$emit('update:data', this.data.map(v => {
            if (v[this.groupField[0]] === row[this.groupField[0]] && v.ID !== row.ID) {
              v.parentID = row.ID;
            }
            return v;
          }));
        }
      }
    },
    /**
     * 显示分组图标
     * */
    RenderTreeIcon(scope) {
      let iconClass = '';
      if (scope.row.children && !scope.row.__expand) {
        iconClass = 'el-icon el-icon-plus';
      }

      if (scope.row.__expand) {
        iconClass = 'el-icon el-icon-minus';
      }
      return `tree-icon  ${iconClass || 'hide'}`;
    },
    // 树转行
    TreeToArray(data) {
      return TreeToArray(data);
    },
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.$emit('current-change', { currentRow, oldCurrentRow });
    },
    handleRowClick(row, event, column) {
      this.currentRow = row;
      this.$emit('row-click', { row, event, column });
    },
    handleSelectionChange(selection) {
      this.$emit('selection-change', { selection });
    },
    handleRowDblClick(row) {
      this.currentRow = row;
      this.$emit('row-dblclick', row);
    },
    /* 树表格方法 */
    // 行展开动画
    showRow(row) {
      const show = (row.row.parent ? (row.row.parent._expanded && row.row.parent._show) : true);
      row.row._show = show;
      return show ? 'animation:treeTableShow 1s;-webkit-animation:treeTableShow 1s;' : 'display:none;';
    },
    // 切换下级是否展开
    toggleExpanded(trIndex) {
      const record = this.viewData[trIndex];
      record._expanded = !record._expanded;
    },
    // 图标显示
    iconShow(index, record) {
      return (index === 0 && record.children && record.children.length > 0);
    }
  },
  /* beforeUpdate() {
    if (this.allowImport) {
      console.log(document.activeElement);
      const domTable = document.querySelector('#' + this.name);
      const name = this.name;
      const columns = TreeToArray(this.columns).filter(
        v => v.field && v.visible !== false && (!v.children || !v.children[0])
      );
      const copyData = this.data.map(v => v);

      // 绑定表格事件 始终focus在textArea上
      'blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu'
        .split(' ')
        .forEach(funcName => {
          domTable[`on${funcName}`] = event => {
            const ss = document.querySelector(`#${name}textArea`);
            ss.focus();
            ss.select();

            // 获取textArea值 防抖操作
            setTimeout(() => {
              const data = ss.value;
              ss.value = '';
              if (data && this.lastCopyValue !== data) {
                if (!this.currentInfo) return;
                const { row, column } = this.currentInfo;
                const currentRowIndex = copyData.indexOf(row);
                const currentColumnIndex = columns.indexOf(column);
                if (currentRowIndex < 0 && currentColumnIndex < 0) return;
                let beginRowIndex = currentRowIndex || 0;
                // 解析粘贴的值
                data
                  .trim()
                  .split('\n')
                  .forEach((strRow, rowIndex) => {
                    const itemRow = {};
                    // 分解行的值 并赋值
                    strRow.trim().split('\t').forEach((val, i) => {
                      columns[i + currentColumnIndex] ? (itemRow[columns[i + currentColumnIndex].field || ''] = val) : '';
                    });
                    copyData[rowIndex + beginRowIndex] ? Object.keys(itemRow).forEach(k => (copyData[rowIndex + beginRowIndex][k] = itemRow[k])) : (copyData[rowIndex + beginRowIndex] = itemRow);
                  });
                // 传值方法 避免在组件中操作 传输过来的data值
                this.$emit('event-copy-data', copyData);

                // 避免重复粘贴
                this.lastCopyValue = data;
              }
            }, 500);
          };
        });
    }
  }, */
  watch: {
    data(val) {
      // 数据分组
      if (this.groupField && this.groupField.length > 0) {
        let result = [];
        let groupFiledIndex = this.columns.some(v => v.type === 'index' && v.visible !== false) ? 1 : 0;
        let groupData = _.groupBy(this.data, this.groupField[0]);
        Object.keys(groupData).forEach(key => {
          // 一级分组父级
          let parent = null;
          if (this.groupData.length > 0) {
            parent = this.groupData.find(v => v.__expandRow === true && v['__groupRowID'] === key + '1');
          } else {
            parent = { [this.columns[groupFiledIndex].field]: `${this.renderGroupRow ? this.renderGroupRow(key, groupData[key]) : key}`, __expandRow: true, __level: 1, __expand: this.groupExpandLevel > 0, __groupRowID: key + '1' };
          }
          groupData[key] = groupData[key].map(v => {
            v['__parent'] = parent;
            v['__level'] = 1;
            return v;
          });
          parent['children'] = groupData[key];
          if (groupData[key].length > 0) {
            groupData[key].unshift(parent);
          }
          if (this.groupField[1]) {
            let groupData2 = _.groupBy(groupData[key], this.groupField[1]);
            Object.keys(groupData2).forEach(key2 => {
              // 二级分组父级
              let parent2 = null;
              if (this.groupData.length > 0) {
                parent2 = this.groupData.find(v => v.__expandRow === true && v['__groupRowID'] === key + key2 + '2');
              } else {
                parent2 = { [this.columns[groupFiledIndex].field]: `${this.renderGroupRow ? this.renderGroupRow(key2, groupData2[key2]) : key2}`, __expandRow: true, __level: 2, __parent: parent, __expand: this.groupExpandLevel === 2, __groupRowID: key + key2 + '2' };
              }
              if (groupData2[key2].filter(v => !v.__expandRow).length > 0) {
                groupData2[key2].splice(0, 0, parent2);
              }
              groupData2[key2] = groupData2[key2].map(v => {
                if (!v.__expandRow) {
                  v['__parent'] = parent2;
                  v['__level'] = 2;
                }
                return v;
              });
              parent2['children'] = groupData2[key2].filter(v => v['__expand'] !== true);
              result = result.concat(groupData2[key2]);
            });
          } else {
            result = result.concat(groupData[key]);
          }
        });
        this.groupData = result;
      }
    }
  },
  mounted() {
    // this.$emit('table', this.$ref[this[`npEdiTable${name}`]]);
    document.body.addEventListener('click', () => {
      this.cleanEdit();
    });
    // this.$nextTick(() => {
    //   // this.scroll = new Bscroll(this.$refs.wrapper, {})
    //   let bs = new BScroll(this.$el.querySelector('.el-table__body-wrapper'));
    //   console.log(bs);
    // });
    // this.$nextTick(() => {
    //   new Vue.$geminiScrollbar({
    //     element: this.$el.querySelector('.el-table__body-wrapper'),
    //     autoshow: true
    //   }).create();
    // });
    const el = this.$el.querySelectorAll('.el-table__body-wrapper > table > tbody')[0];
    if (this.dragable) {
      this.sortable = Sortable.create(el, {
        ghostClass: 'sortable-ghost', // Class name for the drop placeholder,
        // setData: function(dataTransfer) {
        //   dataTransfer.setData('Text', '');
        //   // to avoid Firefox bug
        //   // Detail see : https://github.com/RubaXa/Sortable/issues/1012
        // },
        onEnd: evt => {
          // const targetRow = this.list.splice(evt.oldIndex, 1)[0];
          // this.list.splice(evt.newIndex, 0, targetRow);

          // // for show the changes, you can delete in you code
          // const tempIndex = this.newList.splice(evt.oldIndex, 1)[0];
          // this.newList.splice(evt.newIndex, 0, tempIndex);
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
$color-blue: #2196F3;
$space-width: 18px;

.np-table /deep/ {
  .el-table__header-wrapper,.el-table__fixed-header-wrapper {
    th {
      padding: 0;
      color: #ffffff;
      border-bottom: 1px solid #ebeef5 !important;
      background-color: #6f89a5;
      height: 34px;
    }
    .cell {
      padding: 0 3px !important;
    }
    .descending {
      .sort-caret.descending {
        border-top-color: #333333;
      }
    }
    .ascending {
      .sort-caret.ascending {
        border-bottom-color: #333333;
      }
    }
    .el-table__column-filter-trigger {
      line-height: unset;
    }
    .caret-wrapper {
      height: 21px;
    }
    .sort-caret.ascending {
      top: -2px;
    }
    .sort-caret.descending {
      bottom: 1px;
    }
    .el-table__column-filter-trigger {
      .el-icon-arrow-down {
        color: #ffffff;
      }
    }
  }
  .el-table__body-wrapper,.el-table__fixed-body-wrapper {
    tr.current-row > td {
      background-color: #9dcbff;
    }
    td {
      padding: 0;
      border-bottom: 1px solid #ebeef5 !important;
      height: 30px;
      line-height: 30px;
    }
    .ms-tree-space {
      position: relative;
      top: 1px;
      display: inline-block;
      font-style: normal;
      font-weight: 400;
      line-height: 1;
      width: 18px;
      height: 14px;
      &::before {
        content: ""
      }
    }
    .tree-ctrl{
      margin-right: 3px;
      font-size: 14px;
      position: relative;
      cursor: pointer;
    }
    .cell {
      padding: 0 3px !important;
      line-height: none;
      .el-input .el-input__inner {
        padding: 0px 5px;
      }
      .el-input.el-date-editor .el-input__inner {
        padding: 0px 30px;
      }
    }
  }
  .el-table__footer {
    .cell {
      color: red;
      font-weight: bold;
    }
  }
}

/* 树表格样式 */
.tree-table /deep/ {
  $color-blue: #2196F3;
  $space-width: 18px;
  .cell {
    height: 28px;
    line-height: 28px;
  }
  .processContainer {
    width: 100%;
    height: 100%;
  }
  table td {
    line-height: 26px;
  }
  .el-table__body-wrapper {
    overflow: auto;
  }
  .tree-ctrl{
    position: relative;
    cursor: pointer;
    color: $color-blue;
    margin-left: -$space-width;
  }
}
</style>

<style lang="scss">
.el-date-picker {
  width: 240px;
  .el-date-picker__header {
    margin: 5px 12px 0 12px;
    .el-date-picker__header-label {
      font-size: 12px;
    }
  }
  .el-picker-panel__content {
    width: inherit;
    margin: 0 7px 7px 7px;
  }
  .el-date-table {
    th {
      padding: 0;
    }
    td {
      padding: 0;
    }
  }
}
</style>
