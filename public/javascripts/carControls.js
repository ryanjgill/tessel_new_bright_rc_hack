$(function () {
    var socket = io()

    socket.on('led:change', function (data) {
        console.log(data)
    })

    socket.on('signal:received', function (data) {
        console.log(data)
    })

    $('#forward').mousedown(function () {
        socket.emit('command:forward:on')
    })

    $('#forward').mouseup(function () {
        socket.emit('command:forward:off')
    })

    $('#reverse').mousedown(function () {
        socket.emit('command:reverse:on')
    })

    $('#reverse').mouseup(function () {
        socket.emit('command:reverse:off')
    })

    $('#left').mousedown(function () {
        socket.emit('command:left:on')
    })

    $('#left').mouseup(function () {
        socket.emit('command:left:off')
    })

    $('#right').mousedown(function () {
        socket.emit('command:right:on')
    })

    $('#right').mouseup(function () {
        socket.emit('command:right:off')
    })

})