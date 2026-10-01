import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router/index.js';
import { i18n } from './i18n/index.js';
import { canDirective } from './directives/permission.js';
import './style.css';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(i18n);

// Register RBAC Permission directive v-can
app.directive('can', canDirective);

app.mount('#app');
