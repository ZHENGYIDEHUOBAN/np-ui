<template>
  <el-table
    class="np-table"
    :data="formatData"
    :row-style="showRow"
    v-bind="$attrs"
    border
    size="mini"
    :highlight-current-row="true"
    @current-change="handleCurrentChange"
    @row-dblclick="handleDblClick"
    @selection-change="hanldeSelectionChange"
    :style="{maxHeight: '600px', overflow: 'auto'}"
  >
    <el-table-column v-if="multiple" type="selection" width="80" align="center"></el-table-column>
    <el-table-column v-if="columns.length === 0" width="150" :align="columns.align || 'left'">
      <template slot-scope="scope">
        <span v-for="space in scope.row._level" class="ms-tree-space" :key="space"></span>
        <span class="tree-ctrl" v-if="iconShow(0,scope.row)" @click="toggleExpanded(scope.$index)">
          <i v-if="!scope.row._expanded" class="el-icon-plus"></i>
          <i v-else class="el-icon-minus"></i>
        </span>
        {{scope.$index}}
      </template>
    </el-table-column>
    <el-table-column v-else v-for="(column, index) in columns" :prop="column.field" :key="column.field" :label="column.header" :width="column.width" :align="columns.align || 'left'">
      <template slot-scope="scope">
        <span v-if="index === 0" v-for="space in scope.row._level" class="ms-tree-space" :key="space"></span>
        <span class="tree-ctrl" v-if="iconShow(index,scope.row)" @click="toggleExpanded(scope.$index)">
          <i v-if="!scope.row._expanded" class="el-icon-plus"></i>
          <i v-else class="el-icon-minus"></i>
        </span>
        <el-input @keydown.native.enter="cleanEdit" v-if="column.editor && column.editor.type === 'input'" size="mini" style="display:none" v-model="scope.row[column.field]"></el-input>
        <el-select v-if="column.editor && column.editor.type === 'combobox'" size="mini" v-model="scope.row[column.field]" placeholder="请选择" style="width:100%;display:none">
          <el-option
            v-for="item in column.editor.data"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        <el-date-picker v-if="column.editor && column.editor.type === 'date'" size="mini" v-model="scope.row[column.field]" type="date" format="yyyy-MM-dd" placeholder="选择日期" style="width:100%;display:none"></el-date-picker>
        <span class="cell-text">{{scope.row[column.field]}}</span>
      </template>
    </el-table-column>
    <slot></slot>
  </el-table>
</template>

<script>
import treeToArray from './utils/eval';
import { TreeToArray } from './utils/data-translate';
export default {
  name: 'NpTreeTable',
  props: {
    multiple: {
      type: Boolean,
      default: true
    },
    data: {
      type: [Array, Object],
      required: true
    },
    columns: {
      type: Array,
      default: () => []
    },
    evalFunc: Function,
    evalArgs: Array,
    expandAll: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      prevEditor: null
    };
  },
  computed: {
    // 格式化数据源
    formatData: function() {
      let tmp;
      if (!Array.isArray(this.data)) {
        tmp = [this.data];
      } else {
        tmp = this.data;
      }
      const func = this.evalFunc || treeToArray;
      const args = this.evalArgs ? Array.concat([tmp, this.expandAll], this.evalArgs) : [tmp, this.expandAll];
      return func.apply(null, args);
    }
  },
  methods: {
    // 清除编辑
    cleanEdit() {
      if (this.prevEditor) {
        this.prevEditor.dom.querySelector('.cell-text').style.display = 'inline';
        if (this.prevEditor.dom.querySelector('.ms-tree-space')) this.prevEditor.dom.querySelector('.ms-tree-space').style.display = 'inline';
        switch (this.prevEditor.type) {
          case 'input':
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
        let currentColumn = TreeToArray(this.columns).filter(v => v.field === this.prevEditor.column.property);
        if (currentColumn.length === 0) return;
        else currentColumn = currentColumn[0];
        if (currentColumn.editor.type === 'input' && currentColumn.numberFormat) {
          let fixedArr = currentColumn.numberFormat.split('.');
          if (fixedArr.length > 0) {
            let fixedLength = fixedArr[1].length;
            this.prevEditor.row[this.prevEditor.column.property] = Number(this.prevEditor.row[this.prevEditor.column.property]).toFixed(fixedLength);
          }
        }
        if (currentColumn.editor.endEdit && typeof currentColumn.editor.endEdit === 'function') currentColumn.editor.endEdit(this.prevEditor);
        this.prevEditor = null;
      }
    },
    // 开启编辑
    handleCellClick(row, column, cell, event) {
      event.stopPropagation();
      let currentColumn = TreeToArray(this.columns).filter(v => v.field === column.property);
      if (currentColumn.length === 0) return;
      else currentColumn = currentColumn[0];
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
      cell.querySelector('.cell-text').style.display = 'none';
      if (cell.querySelector('.ms-tree-space')) cell.querySelector('.ms-tree-space').style.display = 'none';
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
      this.prevEditor = {
        dom: cell,
        column,
        row,
        type: currentColumn.editor.type
      };
    },
    showRow: function(row) {
      const show = (row.row.parent ? (row.row.parent._expanded && row.row.parent._show) : true);
      row.row._show = show;
      return show ? 'animation:treeTableShow 1s;-webkit-animation:treeTableShow 1s;' : 'display:none;';
    },
    // 切换下级是否展开
    toggleExpanded: function(trIndex) {
      const record = this.formatData[trIndex];
      record._expanded = !record._expanded;
    },
    // 图标显示
    iconShow(index, record) {
      return (index === 0 && record.children && record.children.length > 0);
    },
    handleCurrentChange(currentRow) {
      this.$emit('current-change', { currentRow });
    },
    handleDblClick(row, event) {
      this.$emit('row-dblclick', { row, event });
    },
    hanldeSelectionChange(selection) {
      this.$emit('selection-change', selection);
    }
  },
  mounted() {
    document.body.addEventListener('click', () => {
      this.cleanEdit();
    });
  }
};
</script>
<style rel="stylesheet/css">
  @keyframes treeTableShow {
    from {opacity: 0;}
    to {opacity: 1;}
  }
  @-webkit-keyframes treeTableShow {
    from {opacity: 0;}
    to {opacity: 1;}
  }
</style>

<style lang="scss" rel="stylesheet/scss" scoped>
  $color-blue: #2196F3;
  $space-width: 18px;
  .ms-tree-space {
    position: relative;
    top: 1px;
    display: inline-block;
    font-style: normal;
    font-weight: 400;
    line-height: 1;
    width: $space-width;
    height: 14px;
    &::before {
      content: ""
    }
  }
  .processContainer{
    width: 100%;
    height: 100%;
  }
  table td {
    line-height: 26px;
  }

  .tree-ctrl{
    position: relative;
    cursor: pointer;
    color: $color-blue;
    margin-left: -$space-width;
  }
</style>
