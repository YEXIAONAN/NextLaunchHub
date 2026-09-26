import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import { setupRealtime } from './realtime/socket';
import { useAuthStore } from './stores/auth';
import './styles/theme.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);

setupRealtime({ router, pinia });

async function bootstrap() {
  const authStore = useAuthStore(pinia);
  await authStore.restoreSession();
  await router.isReady();
  app.mount('#app');
}

bootstrap();
