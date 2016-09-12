/*
	Robot command server
	Author: Siriwat K.
	Created: 16 August 2016
*/

// Log timing functions
function printLogTime() {

  var curr_time = new Date();

  var hour = curr_time.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min = curr_time.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var sec = curr_time.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec; // 0 padding

  var msec = curr_time.getMilliseconds();
  msec = (msec < 100 ? "0" : "") + msec;

  return "[" + hour + ":" + min + ":" + sec + "." + msec + "]";
}

// --------------- Express API server initialize ---------------
var express = require('express');
var app = express();

// Body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var listening_ip = '0.0.0.0';
var listening_port = 80;

var server = app.listen(process.env.SKYBOT_PORT || listening_port, process.env.SKYBOT_IP || listening_ip, function () {
  console.log(printLogTime() + " " + 'Waiting for robots at %s:%s', server.address().address, server.address().port);
});

// --------------- Basic response ---------------
app.use('/', express.static(__dirname + '/client_ui'));

// --------------- Latency test ---------------
app.get('/latency', function (req, res) {
  var ret = {};

  // Get client IP address  
  var client_ip = req.connection.remoteAddress;

  console.log(printLogTime() + " Connected from " + client_ip);

  // Success response
  res.statusCode = 200;
  ret.message = "Welcome bot: " + client_ip;
  ret.error = 0;
  res.json(ret);
});

// --------------- Socket.io ---------------
var bot_sockid;
var web_sockid;

var io = require('socket.io')(server);
io.on('connection', function (socket) {
  //var socketId = socket.id;
  var clientIp = socket.request.socket._peername.address;
  var clientPort = socket.request.socket._peername.port;
  console.log('New connection from IP: ' + clientIp + " Port: " + clientPort);

  socket.on('login', function (data) {
    console.log("Client login as a: " + data.mode);
    socket.emit('set ip', { ip: clientIp });

    // Grap socket id to it's role
    switch (data.mode) {
      case 'bot':
        bot_sockid = socket.id;
        break;
      case 'web':
        web_sockid = socket.id;
        break;
      default:
        console.log("Unknow role " + data.mode);
        break;
    }
  });

  socket.on('leave', function (agent_param) {
    console.log("Disconnecting from " + agent_param.mode + " IP: " + agent_param.ip);
  });

  socket.on('send car cmd', function (car_cmd) {
    io.to(bot_sockid).emit('car cmd', car_cmd);
    console.log("transmitted car_cmd fw:" + car_cmd.fw + " bw:" + car_cmd.bw + " tl:" + car_cmd.tl + " tr:" + car_cmd.tr + " fp:" + car_cmd.fp + " bp:" + car_cmd.bp);
  });
});


// --------------- Terminate cleanup ---------------
function terminate_cleanup() {
  console.log("Closing server");

  if (io) {
    io.close();
    process.exit();
  }
}

// CTRL-C
process.on('SIGINT', function () {
    terminate_cleanup();
});

// Kill
process.on('SIGTERM', function () {
    terminate_cleanup();
});