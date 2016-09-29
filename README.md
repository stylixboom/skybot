SKYBOT server: A server for controlling a Raspberry Pi based RC bot over the internet.
===================

![Bot prototype v.1](https://raw.githubusercontent.com/stylixboom/skybot/master/bot_prototype.jpg)

A prototyped experiment based on an **lr_motor** project (https://github.com/stylixboom/lr_motor) with the extended communication from a keypress event of SSH terminal, which give us one channel at a time, to a joystick control over the internet that give us a pure multi-channel control based on HTML5 and canvas, which works on both PC/mobile web browser.

The key ability is to control each bot over the internet. By placing a bot server somewhere that the bot can have access to it. The client web-based interface will be served as an online joystick to control the connected bot. Once joystick is adjusted, the transformed RC commands will be send to the skybot_server as to enable/disable/PWM the GPIO pin on Raspberry Pi. Then, the server will forward the commands to the bot. The system has been tested perfectly with no delay on the route from Japan (client) to Singapore (server) and end at Thailand (bot).

This project mainly aims to give me ability to walk around my house in Thailand while I'm in Japan. While the bot is moving, my family can also put the smartphone running Skype, Facetime, and Line video, etc. on top of it. Imagine how fun I'm able to move around my house to see my family and dog :)

> **Note:** By using a kind of push message, a bot no need of a configuration, just only a predefined wifi connection. It can be placed any where in the world that have an internet access. BTW, a good internet connection is prefered. For example, I have a one-way ping time from Japan-Singapore-Thailand about 100 ms, and that makes no delay for controlling the bot.

----------

[![Skybot in action](https://raw.githubusercontent.com/stylixboom/skybot/master/skybot_in_action.jpg)](https://youtu.be/KuwRwkkmNok "Skybot in action")


Requirements
--------
1. Raspberry Pi
2. Node.js
3. Motor driver (IC) - Usage ref: https://github.com/stylixboom/lr_motor
4. pigpio - Installing ref: https://www.npmjs.com/package/pigpio
5. RC car with front and rear motor to control steering and acceration.

Optional
--------
6. Button 
7. Buzzer
8. Bi-colored LED

----------

Architecture
-------

![Skybot architecture](https://raw.githubusercontent.com/stylixboom/skybot/master/skybot_architecture.png)

The architecture is designed to works with the internet available environment. The server side need to open a port as for accepting the connections from both client and the bot, where 80 is the default port of this skybot server. Making any change need to follow the modification through the following files
- server.js
- bot_module/bot.js
- client_ui/joystick_control.js

----------

Wiring
-------
![Wiring diagram for RC toy with TB6612FNG](https://raw.githubusercontent.com/stylixboom/skybot/master/wiring_diagram.png)

----------

Pin configuration
-------
```
|     Function    | TB6612FNG pin | GPIO pin |
|:---------------:|:-------------:|:--------:|
|    Rear wheel   |      PWMA     |    18    |
|                 |      AIN2     |    23    |
|                 |      AIN1     |    24    |
|                 |      STBY     |    25    |
|   Front wheel   |      BIN1     |    22    |
|                 |      BIN2     |    27    |
|                 |      PWMB     |    17    |
| Shutdown switch |               |     5    |
|   LED1 (green)  |               |     6    |
|    LED2 (red)   |               |    13    |
|      Buzzer     |               |    19    |
```

----------

Usage
--------
**Bot**

Installing a bot module as a service on Raspberry Pi, where you need *root* access.

```
$ cd path_to_skybot_server/bot_module
$ ./install_service.sh
```

**Server**

Running a server skybot service with
```
$ cd path_to_skybot_server
$ node server.js
```
> **Note:** Running server module as a service will be available in the next release. In this time, running `node server.js` under **tmux** or **screen** are recommended.

**Client**

Joystick control is accessible through a web browser, both PC and mobile. By locating to a server hostname or IP address, the joystick interface will be shown up.

----------

Author: Siriwat Kasamwattanarote
Email: siriwat@live.jp