# MultiSlide test/sample nodeapp

Initial test/dev node application that will show a set of synchronized slides (actually HTML fragments) on a set number of devices.

Status: design

## Build / install

Uses node and coffeescript. Requires something like:
```
npm install -g coffee-script
npm install coffee-script stitch
coffee build.coffee
coffee -o lib -w server/
```

## Configuration / authoring

multislides.json format:

- title (string) - script title
- roles (role array) - pre-defined client roles, with fields:
 - title (string) - role title
 - optional (boolean)
- slide-sets (array of multislides) time sequence of slide sets, with multislide object fields:
 - auto-advance (int) seconds until auto-advance (missing or 0 implies never)
 - slides (array of slides), with slide object fields:
  - html (string) - display fragment
  - controls (object) including options
   - advance (boolean) - client can signal advance to next slide
   - back (boolean) - client can signal go back to previous slide
   - restart (boolean) - client can restart whole presentation

## Protocol / execution

Server runs http and socket.io. 

Server, on client join, sends `available-roles` message with `roles` array. 

Client shows roles; on user selection sends `announce-role` message with `role` (string).

Server, on client `announce-role` assigns role to client state and sends `show-slide` with `id` (index) and `slide` (including `html` and `can-advance`).

Client, on `show-slide` replaces visible html and shows/hides advance button.

Client, on advance button pressed sends `advance` with `from` (index in show-slide to avoid race/multiple advance).

Server, on `advance` checks `from` with current slide and if matches and we have clients for all roles, advances and sends `show-slide` to all current clients. If there are not enough clients then sends `awaiting-roles` message with `roles` array.

Client, on `awaiting-roles` shows an alert to that effect.

