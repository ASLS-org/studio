import Worker from 'worker-loader!./worker.js'
const worker = new Worker();
export default worker;