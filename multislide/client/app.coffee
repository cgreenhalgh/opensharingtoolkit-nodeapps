# client app main module, exports init

availableRolesTemplate = require 'templates/available-roles'
slideTemplate = require 'templates/slide'

exports.init = () ->
  console.log "client inited"

  socket = io.connect('http://localhost')
  socket.on 'available-roles', (roles) ->
    console.log "available-roles: #{roles.length}"
    dialog = availableRolesTemplate roles
    $('body').append dialog
    $('#available-roles a').on 'click',(ev) ->
      SELECT_ROLE = 'select-role-'
      if @id.indexOf(SELECT_ROLE)==0
        role = @id.substring(SELECT_ROLE.length)
        console.log "announce-role #{role}"
        socket.emit 'announce-role', role
        ev.preventDefault()
      else
        console.log "Error: select unknown #{@id}"

    $("body").pagecontainer 'change', '#available-roles'

  socket.on 'show-slide', (slide) ->
    console.log "show-slide"
    slideEl = slideTemplate slide
    $('#slide-'+slide.ix).remove()
    $('body').append slideEl
    $('#slide-'+slide.ix+' a').on 'click',(ev) ->
      console.log "click slide #{@id}"
      #ev.preventDefault()
      if @id is 'slide-'+slide.ix+'-advance'
        console.log "advance from #{slide.ix}"
        socket.emit 'advance', {from:slide.ix}
      if @id is 'slide-'+slide.ix+'-back'
        console.log "back from #{slide.ix}"
        socket.emit 'back', {from:slide.ix}
      if @id is 'slide-'+slide.ix+'-restart'
        console.log "restart from #{slide.ix}"
        socket.emit 'restart', {from:slide.ix}

    console.log "show-slide #{slide.ix}"
    $('body').pagecontainer 'change', '#slide-'+slide.ix

