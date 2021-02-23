const crypto = require('crypto');
const fs = require('fs');

const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

if (isMainThread) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const algorithm = 'aes-256-cbc-hmac-sha256'

  const cryptoConfig = {
    algorithm,
    key,
    iv
  }

  const encryptWorker = new Worker(__filename, {
    stdin: true,
    workerData: {
      cryptoConfig
    }
  });

  const outputFile = fs.createWriteStream('encrypted.bin');

  encryptWorker.on('message', ({ event, data }) => {
    switch (event) {
      case 'encryptedChunk':
        console.log('received encrypted chunk, length', data.length);
        // encryptedData = Buffer.concat([encryptedData, data]);
        outputFile.write(data);
        break;
      case 'lastChunk':
        console.log('received last chunk, length', data.length);
        outputFile.write(data);
        outputFile.end();
        break;
    }
  });

  const input = fs.createReadStream('input.txt');
  input.pipe(encryptWorker.stdin, { end: true });
  encryptWorker.on('exit', code => {
    console.log('worker done - exit code', code);
    const encryptedFileStream = fs.createReadStream('encrypted.bin');
        const decipher = crypto.createDecipheriv(cryptoConfig.algorithm, cryptoConfig.key, cryptoConfig.iv);
        let decrypted = '';
        decipher.on('readable', () => {
          while (null !== (chunk = decipher.read())) {
            decrypted += chunk.toString('utf8');
          }
        });

        decipher.on('end', () => {
          console.log(decrypted);
        });

        encryptedFileStream.pipe(decipher);
  });
} else {

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
    const data = Buffer.concat([cipher.update(chunk || Buffer.of('')), cipher.final()]);
    parentPort.postMessage({
      event: 'lastChunk',
      data
    });
  });
}