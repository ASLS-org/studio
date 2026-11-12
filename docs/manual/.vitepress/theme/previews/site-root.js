/* eslint-disable import/no-extraneous-dependencies */
/*
 * The engine fetches its files at `${VITE_STATIC_URL}fixtures/…`, relative to the page: Studio
 * always runs at its root, manual pages don't. Relative requests resolve from the site root
 * instead. Its own module, imported first by host.js: Studio's Show is built when its module
 * loads and starts fetching the fixture library index right away.
 */
import axios from 'axios';
import { withBase } from 'vitepress';

axios.defaults.baseURL = withBase('/');
