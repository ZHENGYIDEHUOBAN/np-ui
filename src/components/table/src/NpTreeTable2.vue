<template>
  <div class="tree-view">
    <div class="tree-view-flex tree-view-header">
      <div v-for="(col, index) in columns" :key="index"
      :style="colStyle(col)" class="title">{{col.header}}</div>
      <div :style="actionsStyle" v-if="actions" class="title">操作</div>
    </div>
    <el-tree :data="viewData" :show-checkbox="true" ref="tree">
      <div slot-scope="{ node, data }" class="tree-view-flex tree-view-row">
        <div class="cell" v-for="(col, index) in columns" :key="index" :style="rowStyle(col, index)">
          {{data[col.field]}}
        </div>
        <!-- <el-table-cell v-for="(col, index) in columns" :key="index"
        :col="col" :row="data" :style="rowStyle(col)"/> -->
      </div>
    </el-tree>
  </div>
</template>

<script>
import ElTableCell from './NpTreeCell';

export default {
  name: 'NpTreeTable',
  props: ['columns', 'data', 'actions'],
  components: {
    ElTableCell
  },
  computed: {
    actionsStyle() {
      const width = this.actions ? `${this.actions.items.length * 80}px` : 0;
      return {
        width
      };
    },
    viewData() {
      return this.data;
    }
  },
  methods: {
    ajax(act) {
      this.$emit('action', act);
    },
    /**
     * 重置选中行
     */
    rowSelect(s) {
      if (s) this.$refs.tree.setCheckedKeys(s);
    },
    colStyle(col) {
      const style = {
        width: typeof (col.width) === 'string' ? col.width : col.width + 'px' || '60px',
        align: col.align || 'center'
      };
      return style;
    },
    rowStyle(col, index) {
      let width = col.width;
      if (index === 0) width = parseInt(width) - 45;
      width = typeof (width) === 'string' ? width : width + 'px' || '60px';
      const style = {
        width,
        align: col.align || 'center'
      };
      return style;
    }
  }
};
</script>

<style>
.tree-view {
  overflow: auto;
  flex: 1;
}
.tree-view-box {
  flex: 1;
  align-items: center;
}

.tree-view-flex {
  display: -webkit-box;
}

.title {
  font-size: 12px;
  background-color: #6f89a5;
  border-right : 1px solid #e0e6ed;
  white-space: nowrap;
  overflow: hidden;
  height: 40px;
  line-height: 40px;
  min-width: 0;
  text-overflow: ellipsis;
  box-sizing: border-box;
  color: #ffffff;
}

.tree-view-header {
  border: 1px solid #e0e6ed;
  margin-bottom: 5px;
}
.tree-view-header>:last-child {
  border-right: 0;
}

.tree-view-row>div {
  /* border-right: solid 1px #000000; */
  align-items: center;
  display: flex;
}

.tree-view-row>:last-child {
  border-right: 0;
}
.tree-view-row .tree-actions {
  align-items: center;
  display: flex;
  justify-content: center;
}
.tree-view-header>div {
  text-align: center;
}
.el-tree-node__content {
  border-bottom: 1px solid #ebeef5 ;
}
.cell {
  font-size:12px;
  overflow:hidden;
  padding:0 5px;
  box-sizing:border-box;
  border-right: 1px solid #ebeef5;
  height: 27px;
  line-height: 27px;
}
</style>
