# multislide-ex-romeo-and-juliet main

multislide = require('./server')

assetpath = __dirname + '/../../multislide-ex-romeo-and-juliet/assets'
configpath = __dirname + '/../../multislide-ex-romeo-and-juliet/multislides.json'

multislide.createServer configpath,assetpath

