# multislide-ex-romeo-and-juliet main

multislide = require('multislide')

assetpath = __dirname + '/../assets'
configpath = __dirname + '/../multislides.json'

multislide.createServer configpath,assetpath

