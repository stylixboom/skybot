var SERVER_ADDR = 'skybot.baimai.live';
var SERVER_PORT = 80;
var agent_param = { mode: 'bot', ip: ''};

// ---- Create a new socket connection ----
var socket = require('socket.io-client')("http://" + SERVER_ADDR + ":" + SERVER_PORT);


// ---- Socket events send from the server ----
socket.on('connect', function () {
    socket.emit('login', { mode: agent_param.mode });

    console.log("Connected as a " + agent_param.mode);
});

socket.on('set ip', function (data) {
    agent_param.ip = data.ip;
    console.log("Connected through IP: " + agent_param.ip);
});

socket.on('disconnect', function () {
    console.log("Server " + SERVER_ADDR + " shutdown, waiting for a new connection...");
});

// ---- RC command ----
socket.on('car cmd', function (car_cmd) {
    console.log("Got command Forward:" + car_cmd.fw + " Backward:" + car_cmd.bw + " Left:" + car_cmd.tl + " Right:" + car_cmd.tr + " FrontPow:" + car_cmd.fp + " BackPow:" + car_cmd.bp);
    // Send car_cmd to GPIO
    //puppet_ctl(car_cmd);
});


// --------------- Terminate cleanup ---------------
function terminate_cleanup() {
    console.log("Disconnecting");

    if (socket) {
        socket.emit('leave', agent_param);
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