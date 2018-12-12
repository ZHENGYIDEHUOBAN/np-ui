import Vue from 'vue';
import NpRenderTable from './table/src/NpRenderTable';

const components = [
  NpRenderTable
];

components.install = function() {
  components.forEach(v => {
    Vue.component(v.name, v);
  });
};

export default components;
