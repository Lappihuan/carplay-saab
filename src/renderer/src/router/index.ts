import { createRouter, createWebHashHistory } from 'vue-router'
import Carplay from '../views/Carplay.vue'
import Settings from '../views/Settings.vue'
import Info from '../views/Info.vue'
import Camera from '../views/Camera.vue'

const routes = [
  {
    path: '/',
    component: Carplay,
    name: 'Carplay'
  },
  {
    path: '/settings',
    component: Settings,
    name: 'Settings'
  },
  {
    path: '/info',
    component: Info,
    name: 'Info'
  },
  {
    path: '/camera',
    component: Camera,
    name: 'Camera'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
