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

const tessel = require('tessel')
const av = require('tessel-av')

// leds to display if user is connected
const usersLed = tessel.led[2]
const noUsersLed = tessel.led[3]

// start with noUsersLed turned on
noUsersLed.on()

// motor pins
const pin0 = tessel.port.B.pin[0]
const pin1 = tessel.port.B.pin[1]
const pin2 = tessel.port.B.pin[2]
const pin3 = tessel.port.B.pin[3]

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

const address = os.networkInterfaces()['wlan0'][0].address
const port = 3000

httpServer.listen(port)

io.on('connection', function (socket) {
  let camera = new av.Camera()

  socket.on('ready', () => {
    console.log('user ready for images, init stream ...')
    camera.stream()
  })

  camera.on('data', (data) => {
    //console.log('frame: ', new Date().valueOf())
    io.sockets.emit('image', data.toString('base64'))
  })

  // logging user an socketId
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
})

// stop both motors
function stopVehicle() {
  brake(pin0, pin1)
  brake(pin2, pin3)
}

// indicate if any users are connected
function updateUserLeds(usersCount) {
  if (usersCount > 0) {
    usersLed.on()
    noUsersLed.off()
  } else {
    usersLed.off()
    noUsersLed.on()
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

// setting app stuff
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

app.get('/mobile', function(req, res, next) {
  res.send('/public/mobile.html')
})

// get Tessel 2 IP address via cli with `t2 wifi`
console.log(`Server running at http://${address}:${port}`)