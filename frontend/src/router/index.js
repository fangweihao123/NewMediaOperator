import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AuthSuccess from '../views/AuthSuccess.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/auth-success',
    name: 'AuthSuccess',
    component: AuthSuccess
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 