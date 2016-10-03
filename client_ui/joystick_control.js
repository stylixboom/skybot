/* 
 * ---- Joystick controller -----
 * By: Siriwat Kasamwattanarote
 * Date: 9 September 2016
 * http://stylixboom.github.io
 * 
 * Forked from
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 */

// Joypad threshold
var max_motor_power = 250;
var max_fwbw_border = 20;
var max_fwbw_power;
var center_fwbw;
var max_fw;
var max_bw;
var start_turn = 25;
var max_tltr_border = 20;
var max_tltr_power;
var center_tltr;
var start_tl;
var start_tr;
var max_tl;
var max_tr;

// Keep everything in anonymous function, called on window load.
if (window.addEventListener) {
    window.addEventListener('load', function () {
        var canvas, context;

        function init() {
            // Find the canvas element.
            canvas = document.getElementById('joystick_control');
            if (!canvas) {
                alert('Error: I cannot find the canvas element!');
                return;
            }

            if (!canvas.getContext) {
                alert('Error: no canvas.getContext!');
                return;
            }

            // Get the 2D canvas context.
            context = canvas.getContext('2d');
            if (!context) {
                alert('Error: failed to getContext!');
                return;
            }

            // Scale canvas to window
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // resize the canvas to fill browser window dynamically
            window.addEventListener('resize', resizeCanvas, false);

            // Attach the mousedown, mousemove and mouseup event listeners.
            canvas.addEventListener('mousedown', ev_canvas, false);
            canvas.addEventListener('mousemove', ev_canvas, false);
            canvas.addEventListener('mouseup', ev_canvas, false);

            // Touch event
            canvas.addEventListener("touchstart", ev_canvas, false);
            canvas.addEventListener("touchmove", ev_canvas, true);
            canvas.addEventListener("touchend", ev_canvas, false);

            // Grab event up outside
            document.body.addEventListener('mouseup', ev_canvas, false);
            document.body.addEventListener("touchcancel", ev_canvas, false);
        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Initial threshold
            center_fwbw = canvas.height / 2;
            max_fwbw_power = center_fwbw - max_fwbw_border;
            max_fw = center_fwbw - max_fwbw_power;
            max_bw = center_fwbw + max_fwbw_power;
            center_tltr = canvas.width / 2;
            start_tl = center_tltr - start_turn;
            start_tr = center_tltr + start_turn;
            max_tltr_power = center_tltr - max_tltr_border;
            max_tl = center_tltr - max_tltr_power;
            max_tr = center_tltr + max_tltr_power;

            joystick.reset();
        }

        // The general-purpose event handler. This function just determines the mouse 
        // position relative to the canvas element.
        var started = false;
        function ev_canvas(ev) {
            if (ev.type != 'touchend' && ev.type != 'touchcancel') {
                if (ev.targetTouches || ev.layerX == 0) { // Touch device
                    ev.preventDefault();
                    ev._x = ev.targetTouches[0].pageX;
                    ev._y = ev.targetTouches[0].pageY;
                } else if (ev.layerX || ev.layerX == 0) { // Firefox
                    ev._x = ev.layerX;
                    ev._y = ev.layerY;
                } else if (ev.offsetX || ev.offsetX == 0) { // Opera
                    ev._x = ev.offsetX;
                    ev._y = ev.offsetY;
                }
            }

            // Call the event handler of the tool.
            switch (ev.type) {
                case 'mousedown':
                case 'touchstart':
                    started = true;
                // need to continue on move event
                case 'mousemove':
                case 'touchmove':
                    if (started) {
                        // Draw joy
                        joystick.draw(ev._x, ev._y);

                        // Translate and send RC commands
                        joy_translate(ev._x, ev._y);
                    }
                    break;
                case 'mouseup':
                case 'touchend':
                case 'touchcancel':
                    if (started) {
                        joystick.reset();

                        // Send 0,0 for stop command
                        joy_translate(0, 0);
                        started = false;
                    }
                    break;
            }
        }



        // Forked from: http://cssdeck.com/labs/lets-make-a-bouncing-joystick-in-html5-canvas
        var joystick = {
            radius: 25,

            bg: function () {
                //--- Draw start threshold
                context.lineWidth = 1;
                context.beginPath();
                // Forward/Backward
                context.moveTo(0, center_fwbw);
                context.lineTo(canvas.width, center_fwbw);
                // Left/Right
                context.moveTo(start_tl, 0);
                context.lineTo(start_tl, canvas.height);
                context.moveTo(start_tr, 0);
                context.lineTo(start_tr, canvas.height);
                context.strokeStyle = 'lightgray';
                context.stroke();

                //--- Draw max threshold
                context.lineWidth = 2;
                context.beginPath();
                // Forward/Backward
                context.moveTo(0, max_fw);
                context.lineTo(canvas.width, max_fw);
                context.moveTo(0, max_bw);
                context.lineTo(canvas.width, max_bw);
                // Left/Right
                context.moveTo(max_tl, 0);
                context.lineTo(max_tl, canvas.height);
                context.moveTo(max_tr, 0);
                context.lineTo(max_tr, canvas.height);
                context.strokeStyle = '#FFABAB';
                context.stroke();
            },

            clear: function () {
                context.clearRect(0, 0, canvas.width, canvas.height);
                this.bg();
            },

            draw: function (x, y) {
                this.clear();

                // Here, we'll first begin drawing the path and then use the arc() function to draw the circle. The arc function accepts 6 parameters, x position, y position, radius, start angle, end angle and a boolean for anti-clockwise direction.
                context.beginPath();
                context.arc(x, y, this.radius, 0, Math.PI * 2, false);
                context.fillStyle = "#0B42E5";
                context.fill();
                context.closePath();
            },

            reset: function () {
                this.draw(canvas.width / 2, canvas.height / 2);
            }
        };

        init();

        resizeCanvas();

    }, false);


    // ----------- Server configuration and parameters -----------
    var SERVER_ADDR = location.host;
    var agent_param = { mode: 'web', ip: '' };

    // ---- Create a new socket connection ----
    var socket = io.connect("http://" + SERVER_ADDR);

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

    window.addEventListener("beforeunload", function (e) {
        socket.emit('leave', agent_param);
    });

    // ----------- Joystick translater (to RC command) -----------
    function joy_translate(x, y) {

        var car_cmd = {
            fw: 0,
            bw: 0,
            tl: 0,
            tr: 0,
            fp: 0,
            bp: 0
        };

        // Stop
        if (x == 0 && y == 0) {
            car_cmd.fw = 0;
            car_cmd.bw = 0;
            car_cmd.tl = 0;
            car_cmd.tr = 0;
            car_cmd.fp = 0;
            car_cmd.bp = 0;
        } else {
            // Up
            if (y < center_fwbw) {
                car_cmd.fw = 1;
                car_cmd.bw = 0;

                // Back motor power
                car_cmd.bp = (center_fwbw - y) * max_motor_power / max_fwbw_power;
            }

            // Down
            if (y > center_fwbw) {
                car_cmd.fw = 0;
                car_cmd.bw = 1;

                // Back motor power
                car_cmd.bp = (y - center_fwbw) * max_motor_power / max_fwbw_power;
            }

            // Left
            if (x < start_tl) {
                car_cmd.tl = 1;
                car_cmd.tr = 0;

                // Front motor power
                car_cmd.fp = (center_tltr - x) * max_motor_power / max_tltr_power;
            }

            // Right
            if (x > start_tr) {
                car_cmd.tl = 0;
                car_cmd.tr = 1;

                // Front motor power
                car_cmd.fp = (x - center_tltr) * max_motor_power / max_tltr_power;
            }
        }

        if (car_cmd.fp > max_motor_power)
            car_cmd.fp = max_motor_power;
        if (car_cmd.bp > max_motor_power)
            car_cmd.bp = max_motor_power;

        console.log("translate x:" + x + " y:" + y);
        console.log("send car_cmd fw:" + car_cmd.fw + " bw:" + car_cmd.bw + " tl:" + car_cmd.tl + " tr:" + car_cmd.tr + " fp:" + car_cmd.fp + " bp:" + car_cmd.bp);
        socket.emit('send car cmd', car_cmd);
    }
}

