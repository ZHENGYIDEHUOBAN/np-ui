<template>
  <el-table-column
    v-if="col.visible !== false"
    :sortable="col.sortable === true ? 'custom' : false"
    :label="col.headerI18n ? $t(col.headerI18n) : col.header"
    :prop="col.field"
    :fixed="col.fixed || null"
    :width="(col.editor && col.editor.type) === 'date' ? (col.width > 130 ? col.width : 130) : (col.width ? col.width : null)"
    :header-align="col.headerAlign"
    :align="col.align || 'left'"
    :type="col.type || null"
    :filters="col.filters"
    :filter-method="col.filterMethod"
  >
    <template slot-scope="scope">
      <div :style="[!col.renderCell && !col.align ? { display: 'flex' } : '']">
        <!-- 树表格 -->
        <span style="white-space: nowrap;">
          <span v-if="col.treeField && !(scope.row._level === 1 && !scope.row.children)" v-for="i in scope.row._level" :key="i" class="ms-tree-space"></span>
        </span>
        <span v-if="col.treeField && scope.row.children && scope.row.children.length > 0" class="tree-ctrl" @click="($event) => { return toggleExpanded(scope.$index); }">
          <i v-show="!scope.row._expanded" class="el-icon-plus"/>
          <i v-show="scope.row._expanded" class="el-icon-minus"/>
        </span>
        <!-- 分组表格 -->
        <span v-if="groupField.length > 0 && scope.row.__expandRow && index === (columns.some(v => v.type === 'index' && v.visible !== false) ? 1 : 0) && scope.column.level === 1" class="tree-ctrl" @click="($event) => { return handleExpandClick(scope.row); }">
          <span style="white-space: nowrap;">
            <span v-for="i in scope.row.__level - 1" :key="i" class="ms-tree-space"></span>
            <i v-show="!scope.row.__expand" class="zk-table--tree-icon zk-icon zk-icon-plus-square-o"/>
            <i v-show="scope.row.__expand" class="zk-table--tree-icon zk-icon zk-icon-minus-square-o"/>
          </span>
        </span>
        <span v-if="groupField.length > 0 && !scope.row.__expandRow && index === columns.some(v => v.type === 'index' && v.visible !== false) ? 1 : 0 && scope.column.level === 1" style="white-space: nowrap;">
          <span v-for="i in scope.row.__level" :key="i" class="ms-tree-space"></span>
        </span>
        <!-- 输入框 -->
        <el-input
          v-if="col.editor && col.editor.type === 'input'"
          @keyup.native.enter="cleanEdit()"
          size="mini"
          v-model="scope.row[col.field]"
          style="display: none">
        </el-input>
        <!-- 下拉框 -->
        <el-select
          v-if="col.editor && col.editor.type === 'combobox'"
          :clearable="col.editor.clearable"
          size="mini"
          v-model="scope.row[col.field]"
          placeholder="请选择"
          style="width:100%;display:none">
          <el-option
            v-for="(item, index) in col.editor.data"
            :key="index"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        <!-- 单选框 -->
        <el-checkbox
          v-if="col.editor && col.editor.type === 'checkbox'"
          size="mini"
          v-model="scope.row[col.field]">
        </el-checkbox>
        <!-- 日期 -->
        <el-date-picker
          v-if="col.editor && col.editor.type === 'date'"
          class="np-table-date-picker"
          size="mini"
          v-model="scope.row[col.field]"
          type="date"
          format="yyyy-MM-dd"
          placeholder="选择日期"
          style="width:100%;display:none">
        </el-date-picker>
        <div
          v-if="!col.slotCell && !col.renderCell"
          v-show="!(col.editor && col.editor.type === 'checkbox')"
          class="cell-text"
          :title="typeof renderText(scope, col) !== 'string' ? '' : renderText(scope, col).replace(/<[^>]+>/g, '')"
          :style="[col.nowrap ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : '']"
          :column-field="col.field"
          v-html="renderText(scope, col)">
        </div>
        <div
          v-if="col.slotCell"
          v-show="!(col.editor && col.editor.type === 'checkbox')"
          class="cell-text"
          :title="typeof renderText(scope, col) !== 'string' ? '' : renderText(scope, col).replace(/<[^>]+>/g, '')"
          :style="col.nowrap ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : ''"
          :column-field="col.field"
          v-slot="renderText(scope, col)">
        </div>
        <np-cell v-if="col.renderCell" :render="col.renderCell" :row="scope.row" :index="scope.$index" :column="col"></np-cell>
      </div>
    </template>
    <template v-for="(c, ind) in col.children">
      <np-table-column :col="c" :type="type" :key="`c${ind}`" :columns="col.children" :groupField="groupField"></np-table-column>
    </template>
  </el-table-column>
</template>

<script>
import NpCell from './NpCell';
import { DateFormat, NumberFormat } from './utils/data-format';
export default {
  name: 'NpTableColumn',
  components: {
    NpCell
  },
  props: {
    columns: {
      type: Array,
      default: () => []
    },
    col: {
      type: Object,
      default: () => {}
    },
    type: {
      type: String,
      default: 'dataTable'
    },
    groupField: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    // 切换下级是否展开
    toggleExpanded(trIndex) {
      this.$emit('toggleExpanded', trIndex);
    },
    // 图标显示
    iconShow(index, record) {
      return (index === 0 && record.children && record.children.length > 0);
    },
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
    }
  }
};
</script>

<style>

</style>
