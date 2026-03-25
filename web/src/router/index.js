import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '../layout/AdminLayout.vue';
import DashboardView from '../views/dashboard/DashboardView.vue';
import HelpCenterDetailView from '../views/help-center/HelpCenterDetailView.vue';
import HelpCenterListView from '../views/help-center/HelpCenterListView.vue';
import LoginView from '../views/public/LoginView.vue';
import PublicHelpRequestView from '../views/public/PublicHelpRequestView.vue';
import PublicHelpQueryView from '../views/public/PublicHelpQueryView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      component: LoginView,
      meta: {
        public: true
      }
    },
    {
      path: '/help-request',
      component: PublicHelpRequestView,
      meta: {
        public: true
      }
    },
    {
      path: '/help-query',
      component: PublicHelpQueryView,
      meta: {
        public: true
      }
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '/dashboard',
          component: DashboardView
        },
        {
          path: '/help-center',
          component: HelpCenterListView
        },
        {
          path: '/help-center/:id',
          component: HelpCenterDetailView
        }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem('nextlaunch_hub_token');
  if (!to.meta.public && !token) {
    return '/login';
  }
  if (to.path === '/login' && token) {
    return '/dashboard';
  }
  return true;
});

export default router;
