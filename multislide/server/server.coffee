# server main module
fs = require('fs')

ROLEIX = 'roleix'

returnFile = (path, data, res) ->
    headers = {}
    exi = path.lastIndexOf '.'
    if exi>=0
      ext = path.substring exi+1
      if ext=='js'
        headers['Content-Type'] = 'application/javascript'
      else if ext=='css'
        headers['Content-Type'] = 'text/css'
      else if ext=='jpg'
        headers['Content-Type'] = 'image/jpeg'
      else if ext=='png'
        headers['Content-Type'] = 'image/png'
      else if ext=='mp3'
        headers['Content-Type'] = 'audio/mpeg'
      else if ext=='ogg'
        headers['Content-Type'] = 'audio/ogg'
    console.log "data is #{typeof data}"
    headers['Content-Length'] = data.length
    res.writeHead 200, headers
    res.end data


class Multislide
  constructor: (@config,@assetpath) ->
    console.log "New multislide #{@config.title}"

  handler: (req, res) =>
    self = @
    console.log "handler for #{req.method} #{req.url} on port #{@port}"
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
        # try assets
        path = self.assetpath + url
        fs.readFile path, (err, data) -> 
          if err 
            res.writeHead 404 
            return res.end "Error loading #{path} for #{res.url}"
          console.log "send asset file #{url}"
          return returnFile path,data,res
        return false
      console.log "send multislide file #{url}"
      return returnFile path,data,res

  socketsByRole: {}
  slideIx: 0
 
  start: () ->
    self = @
    @app = require('http').createServer(@handler)
    @io = require('socket.io').listen(@app)
  
    # port should be 0=dynamic!!
    @app.listen 8080, () ->
    @port = @app.address().port
    console.log "multislide running on port #{@port}"

    @io.sockets.on 'connection', (socket) ->
      self.onConnection(socket)

  onConnection: (socket)->
    self = @
    socket.on 'disconnect', () ->
      console.log "Disconnect"
      #

    #socket.get 'role', 

    console.log "Send available-roles (#{@config.roles.length})"
    socket.emit 'available-roles', @config.roles

    socket.on 'announce-role', (roleix) ->
      console.log "announce-role #{roleix}"
      socket.set ROLEIX, roleix, ()->
        self.sendSlide socket

    socket.on 'advance', (data) ->
      console.log "advance from #{data.from}"
      if self.slideIx isnt data.from
        return console.log "advance for non-current slide #{data.from} vs #{self.slideIx}"
      self.setSlide 1+self.slideIx

    socket.on 'back', (data) ->
      console.log "back from #{data.from}"
      if self.slideIx isnt data.from
        return console.log "back for non-current slide #{data.from} vs #{self.slideIx}"
      if self.slideIx is 0
        return console.log "back from first slide"
      self.setSlide self.slideIx-1

    socket.on 'restart', (data) ->
      console.log "restart from #{data.from}"
      if self.slideIx isnt data.from
        return console.log "restart for non-current slide #{data.from} vs #{self.slideIx}"
      self.setSlide 0

    #socket.on 'my other event', (data) ->
    #  console.log(data);

  sendSlide: (socket)->
    slideIx = @slideIx
    slides = @config['slide-sets'][slideIx]?.slides
    if not slides?
      return console.log "Current slide #{slideIx} undefined"
    socket.get ROLEIX, (err,roleix) ->
      if err
        return console.log "Could not get #{ROLEIX} for socket"
      roleix = Number(roleix)
      slide = slides[roleix]
      if not slide?
        return console.log "Current slide #{slideIx} undefined for role #{roleix}"
      slide.ix = slideIx
      console.log "show-slide #{@slideIx} for role #{roleix}"
      socket.emit 'show-slide', slide

  setSlide: (ix) ->
    console.log "Go to slide #{ix} from #{@slideIx}"
    @slideIx = ix
    self = @
    @io.sockets.clients().forEach (socket)->
      self.sendSlide socket

exports.createServer = (configpath,assetpath) ->

  console.log "read multislide config #{configpath}"
  fs.readFile configpath, (err,data) ->
    if err
      console.log "error reading config #{configpath}"
      process.exit -1
    try 
      config = JSON.parse data
    catch err
      console.log "error parsing config #{configpath}: #{err.message}"
      process.exit -1

    m = new Multislide config,assetpath  
    m.start()

