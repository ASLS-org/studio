var THREE = window.THREE = require('three');
require('three/examples/js/loaders/GLTFLoader');
import axios from 'axios';

/**
 * Global handler to GLTF loader
 * 
 * @constant loader
 */
const loader = new THREE.GLTFLoader();

/**
 * @class
 * @classdesc 3D MODEL instancer singleton. Handles 3D model preloading and instanciation.
 */
class ModelInstancer {

	constructor() {
		if (!instance) { //ensuring singlelessness
			this._ready = false; //Setting readystate to false on start
			this._models = {} //Preparing models container object
			this._path = "";
		}
		instance = this;
	}

	/**
	 * @property {Object} models instanced models list
	 */
	get models() {
		return this._models;
	}

	/**
	 * Initialises Model instancer.
	 * Loads model list using provided JSON-formated model list path
	 * 
	 * @public
	 * @async
	 * @param {String} path path to JSON-formated model list
	 */
	async init(path) {
		if (!this._ready) {
			this._path = path;
			let modelList = await this.loadModelList();
			this._models = await this.parseList(modelList);
			this._ready = true;
		}
	}

	/**
	 * Fetches model list from static assets
	 * 
	 * @public
	 * @async
	 * @returns {Object} Model list
	 */
	async loadModelList() {
		try {
			let res = await axios.get(this._path)
			return res.data
		} catch (err) {
			throw new Error(`Could not find model list at ${this._path}`);
		}
	}

	/**
	 * Parses and loads model instances recursively
	 * 
	 * @public
	 * @async
	 * @param {Object} data to be parsed
	 * @param {String} url curent static assets path location of recursive method
	 * @returns {Object} 3D models instances list
	 */
	async parseList(listData, url = "") {
		for (let i = 0; i < Object.keys(listData).length; i++) {
			let model = Object.keys(listData)[i]
			if (typeof listData[model] === 'object') {
				url += `/${model}`
				listData[model] = await this.parseList(listData[model], url)
			} else if (typeof listData[model] === 'string') {
				url += `/${listData[model]}`
				let gltf = await loader.loadAsync(`${url}`);
				listData[model] = gltf.scene.children[0]
			} else {
				throw new Error({
					msg: "Syntax error in model_list.json"
				})
			}
		}
		return listData;
	}

}

var instance = new ModelInstancer();
export default instance;