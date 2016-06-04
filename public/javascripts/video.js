$(function () {
    var context = document.getElementById("video").getContext("2d")
        , $video = $("#video")
        , socket = io()
        , frame = null

    socket.on("image", (encoded) => {
        frame = "data:image/jpeg;base64," + encoded
    });

    socket.on("signal:received", (data) => {
        console.log(data)
    })

    socket.emit("ready")

    $video.on('click', function () {
        $("div#controls").toggleClass('hide')
    })

    function resizeVideo () {
        $video.height($video.width() / 2.031)
    }

    $(window).resize(function(){
        resizeVideo()
    });

    resizeVideo()

    setInterval(() => {
        if (frame) {
            var image = new Image()
            image.src = frame
            try {
                context.drawImage(image, 0, 0)
            } catch (e) {
                console.log(e);
            }
        }
    }, 1000 / 24)
})