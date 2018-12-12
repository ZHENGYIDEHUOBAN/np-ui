import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import 'element-ui/lib/theme-chalk/index.css';
/* ElementUI组件 */
import ElementUI from 'element-ui';

/* 自定义组件 */
import NpComponents from '@/components';
Vue.use(ElementUI);
Vue.use(NpComponents);

if (window && window.Vue) {
  window.Vue.use(NpComponents);
}

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
