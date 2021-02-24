const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const pipeline = require('util').promisify(require('stream').pipeline);


const { EncryptTransform } = require('./encrypt-transform');


// Generate random crypto key and iv
const algorithm = 'aes-256-cbc-hmac-sha256';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const cryptoConfig = {
  algorithm,
  key,
  iv
}

async function main() {
  const input = fs.createReadStream('./input.txt');
  const encryptTransform = new EncryptTransform(cryptoConfig);
  const output = fs.createWriteStream('./output.bin');
  await pipeline([input, encryptTransform, output]);
  console.log('encryption done');

  
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
    process.exit();
  });

  const encryptedFileStream = fs.createReadStream('output.bin');
  encryptedFileStream.pipe(decipher);
}

main();