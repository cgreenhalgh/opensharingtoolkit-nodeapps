# server main module

console.log "server main"

# skeletal node http/socket.io server, from 

handler = (req, res) ->
  console.log "handler for #{req.method} #{req.url}"
  if req.method isnt 'GET'
    res.writeHead 405 
    return res.end "Method #{req.method} not allowed"
  url = req.url
  if url.indexOf('..')>=0
    res.writeHead 400
    return res.end "Bad request including .. #{req.url}"
  qix = url.indexOf '?'
  if qix>=0
    url = url.substring 0,qix
  path = __dirname + '/../public' + url
  fs.readFile path, (err, data) -> 
    if err 
      res.writeHead 500 
      return res.end "Error loading #{path} for #{res.url}"
    headers = {}
    exi = path.lastIndexOf '.'
    if exi>=0
      ext = path.substring exi+1
      if ext=='js'
        headers['Content-Type'] = 'application/javascript'
    res.writeHead 200, headers
    res.end data

app = require('http').createServer(handler)
io = require('socket.io').listen(app)
fs = require('fs')

app.listen(8080);

console.log "running on port 8080"

io.sockets.on 'connection', (socket) ->
  socket.emit 'news', { hello: 'world' }
  socket.on 'my other event', (data) ->
    console.log(data);

