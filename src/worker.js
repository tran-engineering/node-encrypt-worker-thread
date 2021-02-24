const crypto = require('crypto');

const { parentPort, workerData } = require('worker_threads');

const { cryptoConfig } = workerData;
const cipher = crypto.createCipheriv(cryptoConfig.algorithm, cryptoConfig.key, cryptoConfig.iv);
process.stdin.on('data', chunk => {
  console.log('Worker received chunk');
  const data = cipher.update(chunk);
  parentPort.postMessage({
    event: 'encryptedChunk',
    data
  });
});

process.stdin.on('end', () => {
  console.log('Worker received end');
  const data = cipher.final();
  parentPort.postMessage({
    event: 'lastChunk',
    data
  });
});