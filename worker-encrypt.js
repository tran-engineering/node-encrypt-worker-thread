const crypto = require('crypto');

const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const {cryptoConfig} = workerData;

const cipher = crypto.createCipheriv( 
  cryptoConfig.algorithm, cryptoConfig.key, cryptoConfig.iv); 
console.log(cipher);

parentPort.postMessage('hello');
parentPort.postMessage(workerData);