'use strict'

let tessel = require('tessel')
let pin0 = tessel.port.A.pin[0]
let pin1 = tessel.port.A.pin[1]

let duration = 4000

pin0.output(0)
pin1.output(0)


function forward(pinOne, pinTwo) {
  console.log('forward!')
  pinOne.output(1)
  pinTwo.output(0)
}

function reverse(pinOne, pinTwo) {
  console.log('reverse!')
  pinOne.output(0)
  pinTwo.output(1)
}

function brake(p1, p2) {
  console.log('brake!')
  p1.output(0)
  p2.output(0)
}


setInterval(function () {

  forward(pin0, pin1)

  setTimeout(function () {
    reverse(pin0, pin1)
  }, duration/2)

  setTimeout(function () {
    brake(pin0, pin1)
  }, duration - 500)

}, duration)

pin0.read(function(error, value) {
  // print the pin value to the console
  console.log(value)
})

pin1.read((error, value) => console.log(value))
