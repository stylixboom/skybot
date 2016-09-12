var Gpio = require('pigpio').Gpio;

// Pin number assignment for TB6612FNG
const PWMA_PIN_NUM = 18;    // Rear wheel
const AIN2_PIN_NUM = 23;
const AIN1_PIN_NUM = 24;
const STBY_PIN_NUM = 25;
const BIN1_PIN_NUM = 22;    // Front wheel
const BIN2_PIN_NUM = 27;
const PWMB_PIN_NUM = 17;

const SW1I_PIN_NUM = 5;     // Switch
const LED1_PIN_NUM = 6;     // LED (Yellow)
const LED2_PIN_NUM = 13;    // LED (Red)
const BUZ1_PIN_NUM = 19;    // Buzzer

// GPIO MOTOR Driver PIN open
var PWMA_PIN = new Gpio(PWMA_PIN_NUM, { mode: Gpio.OUTPUT });
var AIN2_PIN = new Gpio(AIN2_PIN_NUM, { mode: Gpio.OUTPUT });
var AIN1_PIN = new Gpio(AIN1_PIN_NUM, { mode: Gpio.OUTPUT });
var STBY_PIN = new Gpio(STBY_PIN_NUM, { mode: Gpio.OUTPUT });
var BIN1_PIN = new Gpio(BIN1_PIN_NUM, { mode: Gpio.OUTPUT });
var BIN2_PIN = new Gpio(BIN2_PIN_NUM, { mode: Gpio.OUTPUT });
var PWMB_PIN = new Gpio(PWMB_PIN_NUM, { mode: Gpio.OUTPUT });

// GPIO Switch PIN open
var SW1I_PIN = new Gpio(SW1I_PIN_NUM, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    edge: Gpio.EITHER_EDGE
});

// GPIO LED PIN open
var LED1_PIN = new Gpio(LED1_PIN_NUM, { mode: Gpio.OUTPUT });
var LED2_PIN = new Gpio(LED2_PIN_NUM, { mode: Gpio.OUTPUT });

// GPIO BUZZER PIN open
var BUZ1_PIN = new Gpio(BUZ1_PIN_NUM, { mode: Gpio.OUTPUT });

/*
TB6612FNG
Ref: http://www.robotshop.com/media/files/PDF/Datasheet%20713.pdf
Truth table
Input                           Output
IN1     IN2     PWM     STBY    OUT1    OUT2    Mode
H       H       H/L     H       L       L       Short brake
L       H       H       H       L       H       CCW
L       H       L       H       L       L       Short brake
H       L       H       H       H       L       CW
H       L       L       H       L       L       Short brake
L       L       H       H       OFF(High ohm)   Stop
H/L     H/L     H/L     L       OFF(High ohm)   Standby
*/

function forword() {
    // ==== Rear ====
    PWMA_PIN.digitalWrite(1);
    AIN1_PIN.digitalWrite(0);
    AIN2_PIN.digitalWrite(1);
    STBY_PIN.digitalWrite(1);
}

function backword() {
    // ==== Rear ====
    PWMA_PIN.digitalWrite(1);
    AIN1_PIN.digitalWrite(1);
    AIN2_PIN.digitalWrite(0);
    STBY_PIN.digitalWrite(1);
}

function turnleft() {
    // ==== Front ====
    PWMB_PIN.digitalWrite(1);
    BIN1_PIN.digitalWrite(0);
    BIN2_PIN.digitalWrite(1);
    STBY_PIN.digitalWrite(1);
}

function turnright() {
    // ==== Front ====
    PWMB_PIN.digitalWrite(1);
    BIN1_PIN.digitalWrite(1);
    BIN2_PIN.digitalWrite(0);
    STBY_PIN.digitalWrite(1);
}

function puppet_ctl(car_cmd) {
    // Forward/Backward
    AIN1_PIN.digitalWrite(car_cmd.bw | 0);
    AIN2_PIN.digitalWrite(car_cmd.fw | 0);
    // TurnLeft/TurnRight
    BIN1_PIN.digitalWrite(car_cmd.tr | 0);
    BIN2_PIN.digitalWrite(car_cmd.tl | 0);
    // MotorPower    
    PWMA_PIN.analogWrite(car_cmd.bp | 0);
    PWMB_PIN.analogWrite(car_cmd.fp | 0);

    STBY_PIN.digitalWrite(1);
}

// Shutdown Switch
var shutdown_timer, shutdown_counter = 0, shutdown_waiting = 5, shutdown_sent = false;
SW1I_PIN.on('interrupt', function (level) {
    if (!shutdown_sent) {
        if (level > 0) {
            process.stdout.write("Shutting down.. ");
            BUZ1_PIN.analogWrite(50);

            // Clear timer before start new.
            if (shutdown_timer)
                clearInterval(shutdown_timer);

            shutdown_timer = setInterval(function () {
                if (shutdown_counter < shutdown_waiting) {
                    process.stdout.write(++shutdown_counter + " ");

                    BUZ1_PIN.analogWrite(50 + (shutdown_counter * 40));
                } else {
                    shutdown_sent = true;
                    console.log("now..");

                    // Halt will send SIGTERM to process
                    require('child_process').exec('sudo halt', function (msg) { console.log(msg) });

                    BUZ1_PIN.digitalWrite(0);
                    clearInterval(shutdown_timer);
                }
            }, 1000);

            // Set Shutdown status to LED
            LED2_PIN.digitalWrite(1);
        } else {
            shutdown_counter = 0;
            console.log("canceled !!");

            // Clear Shutdown status to LED
            LED2_PIN.digitalWrite(0);
            BUZ1_PIN.digitalWrite(0);

            clearInterval(shutdown_timer);
        }
    }
});


// ---- Online status to LED and Buzzer ----
function online_status() {
    LED1_PIN.digitalWrite(1);

    startup_song();
}

function startup_song() {
    var note1 = setInterval(function () {
        BUZ1_PIN.analogWrite(100);
        clearInterval(note1);
    }, 0);
    var note2 = setInterval(function () {
        BUZ1_PIN.analogWrite(170);
        clearInterval(note2);
    }, 200);
    var note3 = setInterval(function () {
        BUZ1_PIN.digitalWrite(0);
        clearInterval(note3);
    }, 400);
}

function clear_pin() {
    // Motor
    STBY_PIN.digitalWrite(0);
    PWMA_PIN.digitalWrite(0);
    AIN1_PIN.digitalWrite(0);
    AIN2_PIN.digitalWrite(0);
    PWMB_PIN.digitalWrite(0);
    BIN1_PIN.digitalWrite(0);
    BIN2_PIN.digitalWrite(0);

    // LED
    LED1_PIN.digitalWrite(0);
    LED2_PIN.digitalWrite(0);

    // Buzzer
    BUZ1_PIN.digitalWrite(0);
}

// Copy from conn.js
var SERVER_ADDR = 'skybot.baimai.live';
var SERVER_PORT = 80;
var agent_param = { mode: 'bot', ip: '' };

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

    // Show online status
    online_status();
});

socket.on('disconnect', function () {
    console.log("Server " + SERVER_ADDR + " shutdown, waiting for a new connection...");
});

// ---- RC command ----
socket.on('car cmd', function (car_cmd) {
    console.log("Got command Forward:" + car_cmd.fw + " Backward:" + car_cmd.bw + " Left:" + car_cmd.tl + " Right:" + car_cmd.tr + " FrontPow:" + car_cmd.fp + " BackPow:" + car_cmd.bp);
    // Send car_cmd to GPIO
    puppet_ctl(car_cmd);
});


// --------------- Terminate cleanup ---------------
function terminate_cleanup() {
    clear_pin();

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




