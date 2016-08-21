/*
	Robot command server
	Author: Siriwat K.
	Created: 16 August 2016
*/

var args = process.argv.slice(2);

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
// Defining a port we want to listen to
const LISTENING_ADDR = '0.0.0.0';
var LISTENING_PORT = 10101;

// --------------- Validator initialize ---------------
var validator = require('validator');

// --------------- Server Parameter ---------------
// Explicit PORT
if (args[0]) {
  if (!isNaN(args[0])) {
    LISTENING_PORT = parseInt(args[0]);
  }
  else {
    console.log(printLogTime() + " " + "Error: Listening port incorrect");
    process.exit();
  }
}

// --------------- Hashmap initialize ---------------
var HashMap = require('hashmap');
var uuid_map = new HashMap();

// Body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(process.env.PORT || LISTENING_PORT, process.env.ADDR || LISTENING_ADDR, function () {
  console.log(printLogTime() + " " + 'Waiting for robots at %s:%s', server.address().address, server.address().port);
});

function check_active_by_heartbeat_timeout() {
  // Reset active list
  active_node = "";
  uuid_map.forEach(function (client, key) {
    //console.log(client.last_online);
    if (client.last_online &&
      (new Date() - client.last_online) < 30000) {  // Check if client is online within 30 seconds
      if (active_node != "")
        active_node += ",";
      active_node += client.ipaddr;
      //console.log(active_node);
    }
  });
}

var active_checker = setInterval(function () {
  //check_active_by_ping();
  check_active_by_heartbeat_timeout();
}, 1000);

// --------------- Registering client UUID ---------------
app.post('/hello', function (req, res) {
  var ret = {};

  // Get client IP address  
  var client_ip = req.connection.remoteAddress;
  
  // Success response
  res.statusCode = 200;
  ret.message = "Welcome bot: " + client_ip;
  ret.error = 0;
  res.json(ret);
});