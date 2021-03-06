'use strict'

// node express
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const app = express()

const httpServer = require('http').Server(app)
const io = require('socket.io')(httpServer)
const os = require('os')
const address = os.networkInterfaces()['wlan0'][0].address
const port = 3000

const tessel = require('tessel')

// leds to display if user is connected
const usersLed = tessel.led[2]
const noUsersLed = tessel.led[3]
let noUserBlinkInterval

// motor pins
const pin0 = tessel.port.A.pin[0]
const pin1 = tessel.port.A.pin[1]
const pin2 = tessel.port.A.pin[2]
const pin3 = tessel.port.A.pin[3]

pin0.output(0)
pin1.output(0)
pin2.output(0)
pin3.output(0)

function forward(p1, p2) {
  console.log('forward!')
  p1.output(1)
  p2.output(0)
}

function reverse(p1, p2) {
  console.log('reverse!')
  p1.output(0)
  p2.output(1)
}

function brake(p1, p2) {
  console.log('brake!')
  p1.output(0)
  p2.output(0)
}

function steerLeft(p1, p2) {
  steerStraight(pin2, pin3)
  p1.output(0)
  p2.output(1)
  forward(pin0, pin1)
}

function steerRight(p1, p2) {
  steerStraight(pin2, pin3)
  p1.output(1)
  p2.output(0)
  forward(pin0, pin1)
}

function steerStraight(p1, p2) {
  p1.output(0)
  p2.output(0)
  brake(pin0, pin1)
}

function steerLeftReverse(p1, p2) {
  steerStraight(pin2, pin3)
  p1.output(0)
  p2.output(1)
  reverse(pin0, pin1)
}

function steerRightReverse(p1, p2) {
  steerStraight(pin2, pin3)
  p1.output(1)
  p2.output(0)
  reverse(pin0, pin1)
}

// stop both motors
function stopVehicle() {
  brake(pin0, pin1)
  brake(pin2, pin3)
}

function blinkNoUsersLed() {
  clearInterval(noUserBlinkInterval)

  noUserBlinkInterval = setInterval(function () {
    noUsersLed.toggle()
  }, 1000/8)
}

// indicate if any users are connected
function updateUserLeds(usersCount) {
  if (usersCount > 0) {
    usersLed.on()
    clearInterval(noUserBlinkInterval)
    noUsersLed.off()

  } else {
    usersLed.off()
    blinkNoUsersLed()
    console.log('Awaiting users to join...')
  }
}

// emit usersCount to all sockets
function emitUsersCount(io) {
  io.sockets.emit('usersCount', {
    totalUsers: io.engine.clientsCount
  })

  updateUserLeds(io.engine.clientsCount)
}

function checkForZeroUsers(io) {
  if (io.engine.clientsCount === 0) {
    stopVehicle()
    updateUserLeds(io.engine.clientsCount)
  }
}

// emit signal received to all sockets
function emitSignalReceived(io, message) {
  io.sockets.emit('signal:received', {
    date: new Date().getTime(),
    value: message || 'Signal received.'
  })
}

updateUserLeds()

httpServer.listen(port)

io.on('connection', function (socket) {
  console.log(`New connection to socketId: ${socket.id}`)

  // emit usersCount on new connection
  emitUsersCount(io)

  // emit usersCount when connection is closed
  socket.on('disconnect', function () {
    emitUsersCount(io)
    checkForZeroUsers(io)
  })

  // Power Commands
  socket.on('command:forward:on', function (data) {
    forward(pin0, pin1)
    console.log('command received! --> FORWARD ON')
  })

  socket.on('command:forward:off', function (data) {
    brake(pin0, pin1)
    console.log('command received! --> FORWARD OFF')
  })

  socket.on('command:reverse:on', function (data) {
    reverse(pin0, pin1)
    console.log('command received! --> REVERSE ON')
  })

  socket.on('command:reverse:off', function (data) {
    brake(pin0, pin1)
    console.log('command received! --> REVERSE OFF')
  })

  // Steering Commands
  socket.on('command:left:on', function (data) {
    steerLeft(pin2, pin3)
    console.log('command received! --> LEFT ON')
  })

  socket.on('command:left:off', function (data) {
    steerStraight(pin2, pin3)
    console.log('command received! --> LEFT OFF')
  })

  socket.on('command:right:on', function (data) {
    steerRight(pin2, pin3)
    console.log('command received! --> RIGHT ON')
  })

  socket.on('command:right:off', function (data) {
    steerStraight(pin2, pin3)
    console.log('command received! --> RIGHT OFF')
  })

  socket.on('command:leftReverse:on', function () {
    steerLeftReverse(pin2, pin3)
    console.log('command received! --> LEFT REVERSE ON')
  })

  socket.on('command:leftReverse:off', function () {
    steerStraight(pin2, pin3)
    console.log('command received! --> LEFT REVERSE OFF')
  })

  socket.on('command:rightReverse:on', function () {
    steerRightReverse(pin2, pin3)
    console.log('command received! --> RIGHT REVERSE ON')
  })

  socket.on('command:rightReverse:off', function () {
    steerStraight(pin2, pin3)
    console.log('command received! --> RIGHT REVERSE OFF')
  })
})

// setting app title
app.locals.title = 'Tessel 2 New Bright RC Hack'

// view engine setup
app.set('views', path.join(__dirname, 'views'))
// current issues with jade/pug
// will look into this later but for now just serve html
//app.set('view engine', 'jade')

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.get('/', function(req, res, next) {
  res.send('/public/index.html')
})

// log Tessel address
console.log(`Server running at http://${address}:${port}`)