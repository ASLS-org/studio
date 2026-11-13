import {
  createMemoryHistory,
  createRouter,
} from 'vue-router';

import AppActivity from '@/views/activities/app/app.activity.vue';
import VisualizerActivity from '@/views/activities/visualizer/visualizer.activity.vue';

/**
 * Activities only: the app and the separate visualizer window. What the app shows (panel,
 * selection, popups) is the view state's (`$view`, src/views/view.state.js), not the route's.
 */
const routes = [{
  path: '/',
  name: 'App',
  component: AppActivity,
}, {
  path: '/visualizer',
  name: 'Visualizer',
  component: VisualizerActivity,
}];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
