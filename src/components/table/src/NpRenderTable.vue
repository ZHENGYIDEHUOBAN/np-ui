<script>
// import BScroll from 'better-scroll';
// import Vue from 'vue';
import _ from 'lodash';
import NpCell from './NpCell';
import { DateFormat, NumberFormat } from './utils/data-format';
import { TreeToArray } from './utils/data-translate';
import buildTree from './utils/eval';
import Sortable from 'sortablejs';
export default {
  name: 'NpRenderTable',
  components: {
    NpCell
  },
  props: {
    /* 合并单元格 */
    'merge-table': {
      type: Array,
      default() {
        return [];
      }
    },
    /* 拖拽 */
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
    /* 最大高度 */
    maxHeight: {
      type: [String, Number]
    },
    /* 高度 */
    height: {
      type: [String, Number]
    },
    /* 多选 */
    multiple: {
      type: Boolean,
      default: true
    },
    /* 名称 */
    name: {
      type: String,
      default: ''
    },
    /* 合并单元格 */
    spanMethod: {
      type: Function,
      default: () => {}
    },
    /* 导入 */
    allowImport: { type: Boolean, default: true },
    /* 分组字段 */
    groupField: {
      type: Array,
      default: () => []
    },
    /* 单元格样式 */
    cellStyle: {
      type: [Object, Function]
    },
    /* 分组单元格样式 */
    gourpCellStyle: {
      type: [Object, Function]
    },
    /* 表头样式 */
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
  render(h) {
    return (
      <div class={[{ 'data-table': this.type === 'dataTable', 'tree-table': this.type === 'treeTable' }]}>
        <el-table
          id={`${this.name}`}
          data={this.viewData}
          border
          size="mini"
          class="np-table"
          highlight-current-row={true}
          max-height={this.maxHeight || null}
          height={this.height || null}
          default-sort={this.sort}
          show-summary={TreeToArray(this.columns).some(v => v.summary)}
          summary-method={() => this.handleSummaries}
          span-method={this.groupField.length > 0 ? this.handleGroupRowSpan : this.handleColSpan}
          cell-style={this.handleCellStyle}
          header-cell-style={this.headerCellStyle}
          row-style={this.showRow}
          on-cell-click={this.handleCellClick}
          on-sort-change={this.handleSortChange}
          on-current-change={this.handleCurrentChange}
          on-row-click={this.handleRowClick}
          on-row-dblclick={this.handleRowDblClick}
          on-selection-change={this.handleSelectionChange}
          ref={`npTable${this.name}`}
        >
          {
            [null].map(v => {
              if (this.multiple) {
                /* if (this.groupField.length > 0) {
                  return (
                    <el-table-column
                      align="center"
                      width={28}
                      label="多选"
                      fixed="left"
                      render-header={(h) => {
                        let indeterminate = true;
                        let allCheck = false;
                        return (
                          <np-checkbox
                            indeterminate={indeterminate}
                            value={allCheck}>
                          </np-checkbox>
                        );
                      }}
                      scopedSlots={
                        {
                          default: scope => {
                            let indeterminate = true;
                            let allCheck = false;
                            let { row, $index: rowIndex } = scope;
                            return (
                              <np-checkbox
                                indeterminate={indeterminate}
                                value={allCheck}
                                onOn-change={isChecked => this.handleCheckbox({ row, rowIndex }, { isChecked })}>
                              </np-checkbox>
                            );
                          }
                        }
                      }
                    >
                    </el-table-column>
                  );
                } else {
                  return (
                    <el-table-column type="selection" align="center" width="28"></el-table-column>
                  );
                } */
                return (
                  <el-table-column type="selection" align="center" width="28"></el-table-column>
                );
              }
            })
          }
          {
            this.recursiveColumms(h, this.columns, 0)
          }
        </el-table>
        <textarea id={this.name + 'textArea'} style="height: 0;width: 0; border: 0; position: absolute;display:none"></textarea>
      </div>
    );
  },
  data() {
    return {
      prevEditor: null, // 前一个编辑器
      groupData: [],
      currentRow: {},
      /* 版本 Professional-Enterprise */
      version: 'Professional'
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
        // if (this.name && this.$refs[`npTable${this.name}`]) {
        //   let index = this.data.map(v => (v.ID || v.Id)).indexOf(this.currentRow.ID || this.currentRow.Id);
        //   if (index > -1) {
        //     this.$refs[`npTable${this.name}`].setCurrentRow(this.data[index]);
        //   }
        // }
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
          let data = func.apply(this, args);
          return data;
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
          let value = scope.row[column.field];
          return column.drawCell({ row: scope.row, column, value, index: scope.$index });
        } else if (column.slotCell && typeof column.slotCell === 'function') {
          const cell = document.createElement('div');
          let value = scope.row[column.field];
          column.slotCell({ cell, row: scope.row, column, value, index: scope.$index });
          return cell;
        }
        return scope.row[column.field] || null;
      }
    },
    // 开启编辑
    handleCellClick(row, column, cell, event) {
      event.stopPropagation();
      if (this.readOnly === true) return;
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
      TreeToArray(this.columns).forEach((column, index) => {
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
    // 列合并
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
    // 分组行合并
    handleGroupRowSpan(params) {
      const { row, columnIndex } = params;
      let spanColIndex = this.columns.some(v => v.type === 'index') ? 2 : 1;
      if (columnIndex === spanColIndex && row.__expandRow) {
        return { colspan: TreeToArray(this.columns.filter(col => col.visible !== false)).length - spanColIndex, rowspan: 1 };
      } else {
        return { colspan: 1, rowspan: 1 };
      }
    },
    // 树转行
    treeToArray(data) {
      return TreeToArray(data);
    },
    // 递归列
    recursiveColumms(h, columns, columnIndex) {
      let ele = columns.filter(col => {
        return col.visible !== false;
      }).map((col, index) => {
        return (
          <el-table-column
            key={`col${index}`}
            sortable={col.sortable === true ? 'custom' : false}
            label={col.headerI18n ? this.$t(col.headerI18n) : col.header}
            prop={col.field}
            fixed={col.fixed || null}
            width={(col.editor && col.editor.type) === 'date' ? (col.width > 130 ? col.width : 130) : (col.width ? col.width : null)}
            header-align={col.headerAlign}
            align={col.align || 'left'}
            type={col.type || null}
            filters={this.type !== 'treeTable' && this.groupField.length === 0 ? col.filters : null}
            filter-method={this.type !== 'treeTable' && this.groupField.length === 0 ? col.filterMethod : null}
            scopedSlots={
              {
                default: scope => {
                  return (
                    <div style={[!col.renderCell && !col.align ? { display: 'flex' } : '']}>
                      {
                        [null].map(v => {
                          if (this.type === 'treeTable' && columns.length === 0) {
                            return (
                              <span>
                                <span class="ms-tree-space"></span>
                                {
                                  this.iconShow(0, scope.row, col)
                                    ? <span class="tree-ctrl" on-click={($event) => { return this.toggleExpanded(scope.$index); }}>
                                      {
                                        !scope.row._expanded ? <i class="el-icon-plus"></i> : <i class="el-icon-minus"></i>
                                      }
                                    </span>
                                    : null
                                }
                                {
                                  scope.$index
                                }
                              </span>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (this.type === 'treeTable' && columns.length !== 0) {
                            return (
                              <span style="white-space: nowrap;">
                                {
                                  Array.apply(null, { length: scope.row._level === 1 && !scope.row.children ? 0 : scope.row._level }).map(v => {
                                    if (col.treeField) {
                                      return (
                                        <span class="ms-tree-space"></span>
                                      );
                                    }
                                  })
                                }
                                {
                                  [null].map(v => {
                                    if (this.iconShow(index, scope.row, col)) {
                                      return (
                                        <span class="tree-ctrl" on-click={($event) => { return this.toggleExpanded(scope.$index); }}>
                                          {
                                            !scope.row._expanded ? <i class="el-icon-plus"></i> : <i class="el-icon-minus"></i>
                                          }
                                        </span>
                                      );
                                    }
                                  })
                                }
                              </span>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          let spanColIndex = this.columns.some(v => v.type === 'index' && v.visible !== false) ? 1 : 0;
                          if (this.groupField.length > 0 && scope.row.__expandRow && index === spanColIndex && scope.column.level === 1) {
                            return (
                              <span class="tree-ctrl" on-click={($event) => { return this.handleExpandClick(scope.row); }}>
                                <span style="white-space: nowrap;">
                                  {
                                    Array.apply(null, { length: scope.row.__level - 1 }).map(v => {
                                      return (
                                        <span class="ms-tree-space"></span>
                                      );
                                    })
                                  }
                                </span>
                                {
                                  !scope.row.__expand ? <i class="zk-table--tree-icon zk-icon zk-icon-plus-square-o"></i> : <i class="zk-table--tree-icon zk-icon zk-icon-minus-square-o"/>
                                }
                              </span>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          let spanColIndex = this.columns.some(v => v.type === 'index' && v.visible !== false) ? 1 : 0;
                          if (this.groupField.length > 0 && !scope.row.__expandRow && index === spanColIndex && scope.column.level === 1) {
                            return (
                              <span style="white-space: nowrap;">
                                {
                                  Array.apply(null, { length: scope.row.__level }).map(v => {
                                    return (
                                      <span class="ms-tree-space"></span>
                                    );
                                  })
                                }
                              </span>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (col.editor && col.editor.type === 'input' && this.readOnly !== true) {
                            return (
                              <el-input
                                nativeOn-keyup={(event) => {
                                  if (event.keyCode === 13) return this.cleanEdit();
                                }}
                                size="mini"
                                value={scope.row[col.field]}
                                on-change={(val) => { this.$set(scope.row, col.field, val); }}
                                style="display:none">
                              </el-input>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (col.editor && col.editor.type === 'combobox' && this.readOnly !== true) {
                            return (
                              <el-select
                                clearable={col.editor.clearable}
                                size="mini"
                                value={scope.row[col.field]}
                                on-change={(val) => { this.$set(scope.row, col.field, val); }}
                                placeholder="请选择"
                                style="width:100%;display:none">
                                {
                                  col.editor.data.map((item, index) => {
                                    return (
                                      <el-option
                                        key={index}
                                        label={item.label}
                                        value={item.value}>
                                      </el-option>
                                    );
                                  })
                                }
                              </el-select>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (col.editor && col.editor.type === 'checkbox' && this.readOnly !== true) {
                            return (
                              <el-checkbox size="mini"
                                checked={scope.row[col.field]}
                                on-change={(val) => { this.$set(scope.row, col.field, val); }}>
                              </el-checkbox>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (col.editor && col.editor.type === 'date' && this.readOnly !== true) {
                            return (
                              <el-date-picker
                                class="np-table-date-picker"
                                size="mini"
                                value={scope.row[col.field]}
                                on-input={(val) => { this.$set(scope.row, col.field, val); }}
                                type="date"
                                format="yyyy-MM-dd"
                                placeholder="选择日期"
                                style="width:100%;display:none">
                              </el-date-picker>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (!col.slotCell && !col.renderCell) {
                            return [
                              <div
                                v-show={!(col.editor && col.editor.type === 'checkbox')}
                                class="cell-text" title={typeof this.renderText(scope, col) !== 'string' ? '' : this.renderText(scope, col).replace(/<[^>]+>/g, '')}
                                style={[col.nowrap ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : '']}
                                column-field={col.field}
                                domPropsInnerHTML={this.renderText(scope, col)}>
                              </div>
                            ];
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (col.slotCell) {
                            return (
                              <div
                                v-show={!(col.editor && col.editor.type === 'checkbox')}
                                class="cell-text" title={typeof this.renderText(scope, col) !== 'string' ? '' : this.renderText(scope, col).replace(/<[^>]+>/g, '')}
                                style={col.nowrap ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : ''}
                                column-field={col.field}
                                v-slot={this.renderText(scope, col)}>
                              </div>
                            );
                          }
                        })
                      }
                      {
                        [null].map(v => {
                          if (col.renderCell) {
                            return (
                              <np-cell render={col.renderCell} row={scope.row} index={scope.$index} column={col}></np-cell>
                            );
                          }
                        })
                      }
                    </div>
                  );
                }
              }
            }
          >
            {
              [null].map(v => {
                if (col.children && col.children.length > 0) {
                  return this.recursiveColumms(h, col.children, columnIndex);
                }
              })
            }
          </el-table-column>
        );
      });
      return ele;
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
      if (row['__expandRow'] === true) return;
      this.$emit('row-dblclick', row);
    },
    handleCellStyle({ row, column, rowIndex, columnIndex }) {
      let spanColIndex = this.columns.some(v => v.type === 'index' && v.visible !== false) ? 2 : 1;
      if (row.__expandRow && columnIndex === spanColIndex) {
        if (this.gourpCellStyle) {
          if (typeof this.gourpCellStyle === 'function') {
            return this.gourpCellStyle({ row, column, rowIndex, columnIndex });
          } else if (typeof this.gourpCellStyle === 'object') {
            return this.gourpCellStyle;
          } else {
            return { 'font-weight': 'bold', 'font-size': '14px' };
          }
        } else {
          return { 'font-weight': 'bold', 'font-size': '14px' };
        }
      } else {
        if (this.cellStyle) {
          if (typeof this.cellStyle === 'function') {
            return this.cellStyle({ row, column, rowIndex, columnIndex });
          } else {
            return this.cellStyle;
          }
        }
      }
    },
    handleCheckbox({ row, rowIndex }, { isChecked }) {
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
    iconShow(index, record, col) {
      return (col.treeField && record.children && record.children.length > 0);
    },
    // 分组展开
    handleExpandClick(row) {
      this.$set(row, '__expand', !row.__expand);
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
              if (parent2) {
                parent2['children'] = groupData2[key2].filter(v => v['__expand'] !== true);
              }
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
