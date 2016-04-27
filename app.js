'use strict'

// node express
let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')

let app = express()

let httpServer = require('http').Server(app)
let io = require('socket.io')(httpServer)

let tessel = require('tessel')
let pin0 = tessel.port.A.pin[0]
let pin1 = tessel.port.A.pin[1]
let pin2 = tessel.port.A.pin[2]
let pin3 = tessel.port.A.pin[3]

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

httpServer.listen(3000)

io.on('connection', function (socket) {
  console.log(`New connection to socketId: ${socket.id}`)

  // emit usersCount on new connection
  emitUsersCount(io)

  // emit usersCount when connection is closed
  socket.on('disconnect', function () {
    emitUsersCount(io)
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

// emit usersCount to all sockets
function emitUsersCount(io) {
  io.sockets.emit('usersCount', {
    totalUsers: io.engine.clientsCount
  })
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

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.get('/', function(req, res, next) {
  res.send('/public/index.html')
})

let address = httpServer.address()

// get Tessel 2 IP address via cli with `t2 wifi`
console.log(`Server running at http://tessel2IpAddress:${address.port}`)
