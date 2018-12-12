import NpTable from './src/NpTable';
import NpRenderTable from './src/NpRenderTable';
import NpTreeTable2 from './src/NpTreeTable2';

// Enterprise 企业版  Professional  专业版
NpTable.install = function(Vue) {
  Vue.component(NpTable.name, NpTable); // 标准版table组件：最多支持两级多表头，兼顾老的table组件？
  Vue.component(NpRenderTable.name, NpRenderTable); // 企业版table组件：render函数递归渲染多级多表头表格（功能更多）
  Vue.component(NpTreeTable2.name, NpTreeTable2); // 树网格组件NpTreeTable
};

export default NpTable;
