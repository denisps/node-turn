const dgram = require('dgram');

var udp = function(type) {
  this.socket = dgram.createSocket(type);
  this.onClose = new Promise((resolve, reject) => {
    this.socket.on('close', resolve);
    this.socket.on('error', reject);
  });
};

udp.prototype.bind = function(options) {
  return new Promise((resolve, reject) => {
    this.socket.on('error', reject);
    this.socket.on('listening', () => {
      this.socket.off('error', reject);
      resolve();
    });
    this.socket.bind(options);
  });
};

udp.prototype.address = function() {
  return this.socket.address();
};

udp.prototype.on = function(event, listener) {
  return this.socket.on(event, listener);
};

udp.prototype.send = function(msg, port, address, cb) {
  return new Promise((resolve, reject) => {
    this.socket.send(msg, port, address, err => {
      if (cb) cb(err);
      if (err) reject(err);
      else resolve();
    });
  });
};

udp.prototype.close = function() {
  this.socket.close();
  return this.onClose;
};

module.exports = udp;