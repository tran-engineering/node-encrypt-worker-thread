const crypto = require('crypto');

const { parentPort, workerData } = require('worker_threads');

const { cryptoConfig } = workerData;
const cipher = crypto.createCipheriv(cryptoConfig.algorithm, cryptoConfig.key, cryptoConfig.iv);
process.stdin.on('data', chunk => {
  const data = cipher.update(chunk);
  parentPort.postMessage({
    event: 'encryptedChunk',
    data
  });
});

process.stdin.on('end', chunk => {
  const data = Buffer.concat([cipher.update(chunk || new Uint8Array()), cipher.final()]);
  parentPort.postMessage({
    event: 'lastChunk',
    data
  });
});