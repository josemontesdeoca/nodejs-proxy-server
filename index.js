let http = require('http')
let path = require('path')
let fs = require('fs')
let request = require('request')
let argv = require('yargs')
  .default('host', '127.0.0.1')
  .argv
let scheme = 'http://'
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logPath = argv.log && path.join(__dirname, argv.log)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout


http.createServer((req, res) => {
  logStream.write('\nEcho request: \n' + JSON.stringify(req.headers))

  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }

  req.pipe(logStream, {end: false})
  req.pipe(res)
}).listen(8000)

logStream.write('Listening at http://127.0.0.1:8000')

http.createServer((req, res) => {
  let url = destinationUrl

  if (req.headers['x-destination-url']) {
    url = req.headers['x-destination-url']
  }

  let options = {
    headers: req.headers,
    url: url + req.url
  }

  logStream.write('\nDestination URL: \n' + url)
  logStream.write('\nProxy request: \n' + JSON.stringify(req.headers))

  req.pipe(logStream, {end: false})

  let destinationResponse = req.pipe(request(options))

  logStream.write('\nProxy response: \n' + JSON.stringify(destinationResponse.headers))

  destinationResponse.pipe(res)
  destinationResponse.pipe(logStream, {end: false})
}).listen(8001)
