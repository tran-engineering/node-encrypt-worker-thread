const { Transform, Duplex } = require('stream');
const path = require('path');
const { Worker } = require('worker_threads');

class EncryptTransform extends Transform {
  constructor(cryptoConfig, options) {
    super(options);
    this.encryptWorker = new Worker(path.join(__dirname, 'worker.js'), {
      stdin: true,
      workerData: {
        cryptoConfig
      }
    });
    this.encryptWorker.on("message", ({event, data}) => {
      switch (event) {
        case 'encryptedChunk':
          console.info('received worker chunk message, length', data.length);
          this.push(data);
          break;
        case 'lastChunk':
          console.info('received last worker chunk message, length', data.length);
          this.push(data);
          super.end(this.endCb);
          break;
      }
    })
  }

  _transform(chunk, encoding, cb) {
    this.encryptWorker.stdin.write(chunk, encoding, cb);
  }

  end(cb) {
    this.encryptWorker.stdin.end();
    this.endCb = cb;
  }

}

module.exports = {
  EncryptTransform
}