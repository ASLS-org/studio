import { createRouter, createWebHistory } from 'vue-router'
import ShowSingleton from '@/singletons/show.singleton'
import {
  ProxifySingleton
} from '@/models/utils/proxify.utils';


const AppActivity = () => import('@/views/activities/app/app.activity')
const VisualizerActivity = () => import('@/views/activities/visualizer/visualizer.activity');

// const DefaultModifier = () => import('@/views/activities/app/fragments/modifiers/default.modifier.fragment.vue');
const UniverseModifier = () => import('@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue');
const ChaseModifier = () => import('@/views/activities/app/fragments/modifiers/chase/chase.modifier.fragment.vue');
const GroupModifier = () => import('@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue');

const routes = [{
    path: '/',
    component: AppActivity,
    meta: {
      auth: true,
      appRoot: true
    },
    children: [{
      path: '',
      name: 'Default',
      component: UniverseModifier
    }, {
      path: '/universe/:universeId',
      name: 'Universe',
      component: UniverseModifier
    },{
      path: '/functions/chase/:chaseId',
      name: 'Chase',
      component: ChaseModifier
    }, {
      path: '/group/:groupId',
      name: 'Group',
      component: GroupModifier
    }, {
      path: '/group/:groupId/cue/:cueId',
      name: 'Cue',
      component: GroupModifier
    }, {
      path: '/group/:groupId/chase/:chaseId',
      name: 'Chase',
      component: ChaseModifier
    }]
  }, {
    path: '/visualizer',
    component: VisualizerActivity,
    name: 'Visualizer'
  }
]

const router = new createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (from, to, next) => {
  console.log(from, to, next)
  if (ShowSingleton.ready || to.name == 'Default' || from.name == "Visualizer" || to.name == "Visualizer") {
    return next()
  } else if (from.name != 'Default') {
    return next({
      name: 'Default'
    })
  } else {
    return next();
  }
})

ProxifySingleton.on("undo", (data) => {
  router.push(data.path).catch(()=>{});
});

export default router;