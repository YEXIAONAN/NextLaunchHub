import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '../layout/AdminLayout.vue';
import DashboardView from '../views/dashboard/DashboardView.vue';
import HelpCenterDetailView from '../views/help-center/HelpCenterDetailView.vue';
import HelpCenterListView from '../views/help-center/HelpCenterListView.vue';
import NotificationsView from '../views/notifications/NotificationsView.vue';
import ProjectDetailView from '../views/projects/ProjectDetailView.vue';
import ProjectsListView from '../views/projects/ProjectsListView.vue';
import TasksListView from '../views/tasks/TasksListView.vue';
import DictionariesView from '../views/system/DictionariesView.vue';
import LoginView from '../views/public/LoginView.vue';
import PublicHelpQueryView from '../views/public/PublicHelpQueryView.vue';
import PublicHelpRequestView from '../views/public/PublicHelpRequestView.vue';
import UsersListView from '../views/users/UsersListView.vue';

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
        },
        {
          path: '/projects',
          component: ProjectsListView
        },
        {
          path: '/projects/:id',
          component: ProjectDetailView
        },
        {
          path: '/tasks',
          component: TasksListView
        },
        {
          path: '/notifications',
          component: NotificationsView
        },
        {
          path: '/users',
          component: UsersListView,
          meta: {
            adminOnly: true
          }
        },
        {
          path: '/system/dictionaries',
          component: DictionariesView,
          meta: {
            adminOnly: true
          }
        }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem('nextlaunch_hub_token');
  const user = JSON.parse(localStorage.getItem('nextlaunch_hub_user') || 'null');
  if (!to.meta.public && !token) {
    return '/login';
  }
  if (to.path === '/login' && token) {
    return '/dashboard';
  }
  if (to.meta.adminOnly && user?.role !== 'admin') {
    return '/dashboard';
  }
  return true;
});

export default router;
