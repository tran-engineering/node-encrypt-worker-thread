const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { Worker } = require('worker_threads');

// Generate random crypto key and iv
const algorithm = 'aes-256-cbc-hmac-sha256';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const cryptoConfig = {
  algorithm,
  key,
  iv
}

async function encryptFile(encryptedFile, outputFile) {
  return new Promise((resolve, reject) => {

    // Spawn a new worker
    const encryptWorker = new Worker(path.join(__dirname, 'worker.js'), {
      stdin: true,
      workerData: {
        cryptoConfig
      }
    });

    const input = fs.createReadStream(encryptedFile);

    // send input data to worker
    input.pipe(encryptWorker.stdin, { end: true });

    const outputStream = fs.createWriteStream(outputFile);

    encryptWorker.on('message', ({ event, data }) => {
      switch (event) {
        case 'encryptedChunk':
          console.info('received encrypted chunk, length', data.length);
          outputStream.write(data);
          break;
        case 'lastChunk':
          console.info('received last chunk, length', data.length);
          outputStream.write(data);
          outputStream.end();
          resolve();
          break;
      }
    });
    encryptWorker.on('error', reject);
    encryptWorker.on('messageerror', reject);
  });
}

(async function main() {
  try {
    await encryptFile('input.txt', 'encrypted.bin');

    // test whether input and decrypted output are the same
    const decipher = crypto.createDecipheriv(cryptoConfig.algorithm, cryptoConfig.key, cryptoConfig.iv);
    const inputData = fs.readFileSync('input.txt');
    const inputHash = crypto.createHash('md5').update(inputData).digest('hex');
    let decrypted = new Uint8Array();
    decipher.on('readable', () => {
      while (null !== (chunk = decipher.read())) {
        decrypted = Buffer.concat([decrypted, chunk]);
      }
    });

    decipher.on('end', () => {
      const decryptedHash = crypto.createHash('md5').update(decrypted).digest('hex');
      console.log('Hashes input and decrypted match?', inputHash == decryptedHash, fs.readFileSync('input.txt').length, decrypted.length);
    });

    const encryptedFileStream = fs.createReadStream('encrypted.bin');
    encryptedFileStream.pipe(decipher);
  } catch (err) {
    console.error('Error during encryption.', err);
  }
})();
