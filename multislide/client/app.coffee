# client app main module, exports init

exports.init = () ->
  console.log "client inited"

  socket = io.connect('http://localhost')
  socket.on 'news', (data) ->
    console.log "news: #{data}"
    socket.emit 'my other event', { my: 'data' }

