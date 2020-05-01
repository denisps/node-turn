//const dgram = require('dgram');
const UDP = require('./udp');
const Message = require('./message');
const Transport = require('./transport');
const Address = require('./address');
const CONSTANTS = require('./constants');

var network = function(server) {
  this.sockets = [];
  this.server = server;
  this.listeningIps = server.listeningIps;
  this.listeningPort = server.listeningPort;
  this.debug = server.debug.bind(server);
  this.debugLevel = server.debugLevel;
};

network.prototype.start = function() {
  return Promise.all(this.listeningIps.map(async ip => {
    const dst = new Address(ip, this.listeningPort);
    const udp = new UDP(dst.family === CONSTANTS.TRANSPORT.FAMILY.IPV4 ? 'udp4' : 'udp6');
    //const udpSocket = dgram.createSocket(dst.family === CONSTANTS.TRANSPORT.FAMILY.IPV4 ? 'udp4' : 'udp6');

    //udpSocket.on('error', function(err) {
    //  self.debug('FATAL', err);
    //});

    udp.on('message', (udpMessage, rinfo) => {
      const src = new Address(rinfo.address, rinfo.port);
      const transport = new Transport(CONSTANTS.TRANSPORT.PROTOCOL.UDP, src, dst, udp);
      var msg = new Message(this.server, transport);
      if (msg.read(udpMessage)) {
        this.server.emit('message', msg);
      }
    });

    await udp.bind({
      address: ip,
      port: this.listeningPort,
      exclusive: true
    });

    this.debug('INFO', 'Server is listening on ' + dst.toString());

    //udpSocket.on('listening', function() {
    //  self.debug('INFO', 'Server is listening on ' + ip + ':' + self.listeningPort);
    //});

    //udpSocket.on('close', function() {
    //  self.debug('INFO', 'Server is no more listening on ' + ip + ':' + self.listeningPort);
    //});

    //udpSocket.bind({
    //  address: ip,
    //  port: self.listeningPort,
    //  exclusive: true
    //});

    this.sockets.push(udp);
  }));
};

network.prototype.running = function() {
  return Promise.all(this.sockets.map(socket => socket.running()));
};

network.prototype.stop = async function() {
  return Promise.all(this.sockets.map(async socket => {
    return socket.close();
  }));
};

module.exports = network;
