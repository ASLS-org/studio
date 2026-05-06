import {
  createMemoryHistory,
  createRouter,
} from 'vue-router';
import ShowSingleton from '@/singletons/show.singleton';
import {
  ProxifySingleton,
} from '@/models/utils/proxify.utils';

import GroupModifier from '@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue';
import AppActivity from '@/views/activities/app/app.activity.vue';
import VisualizerActivity from '@/views/activities/visualizer/visualizer.activity.vue';
import UniverseModifier from '@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue';
import ChaseModifier from '@/views/activities/app/fragments/modifiers/chase/chase.modifier.fragment.vue';

const routes = [{
  path: '/',
  component: AppActivity,
  meta: {
    auth: true,
    appRoot: true,
  },
  children: [{
    path: '',
    name: 'Default',
    component: UniverseModifier,
  }, {
    path: '/universe/:universeId',
    name: 'Universe',
    component: UniverseModifier,
  }, {
    path: '/functions/chase/:chaseId',
    name: 'Chase',
    component: ChaseModifier,
  }, {
    path: '/group/:groupId',
    name: 'Group',
    component: GroupModifier,
  }, {
    path: '/group/:groupId/cue/:cueId',
    name: 'Cue',
    component: GroupModifier,
  }, {
    path: '/group/:groupId/chase/:chaseId',
    name: 'Chase',
    component: ChaseModifier,
  }],
}, {
  path: '/visualizer',
  component: VisualizerActivity,
  name: 'Visualizer',
}];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.beforeEach(async (from, to, next) => {
  if (ShowSingleton.ready || to.name === 'Default' || from.name === 'Visualizer' || to.name === 'Visualizer') {
    return next();
  } if (from.name !== 'Default') {
    return next({
      name: 'Default',
    });
  }
  return next();
});

ProxifySingleton.on('undo', (data) => {
  router.push(data.path).catch(() => {});
});

export default router;
