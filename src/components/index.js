import Vue from 'vue';
import 'element-ui/lib/theme-chalk/index.css';
/* ElementUI组件 */
import ElementUI from 'element-ui';

import NpRenderTable from './table/src/NpRenderTable';

Vue.use(ElementUI);
const components = [
  NpRenderTable
];

components.install = function() {
  components.forEach(v => {
    Vue.component(v.name, v);
  });
};

export default components;
