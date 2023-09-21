import {
	GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import axios from 'axios';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('libs/gltf/');

/**
 * Global handler to GLTF loader
 * 
 * @constant loader
 */
const loader = new GLTFLoader()
.setCrossOrigin('anonymous')
.setDRACOLoader( dracoLoader  )

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
		let len = Object.keys(listData).length
		for (let i = 0; i < len; i++) {
			let model = Object.keys(listData)[i]
			if (typeof listData[model] === 'object' && !listData[model]._loaded) {
				listData[model] = await this.parseList(listData[model], url + `/${model}`);
			} else if (typeof listData[model] === 'string') {
				await new Promise(resolve=>{
					loader.load(url + `/${listData[model]}`, (gltf) => {
						listData[model] = gltf
						listData[model]._loaded = true;
						resolve()
					})
				})
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