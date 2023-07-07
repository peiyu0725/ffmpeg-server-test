import { WebSocketServer } from 'ws'
import webSocketStream from 'websocket-stream/stream.js'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'

const wss = new WebSocketServer({ port: 8888, perMessageDeflate: false })

wss.on('connection', handleConnection)

function handleConnection(ws, req) {
  const url = req.url.slice(1)
  const stream = webSocketStream(ws, { binary: true, browserBufferTimeout: 1000000 })
  const ffmpegPath = ffmpegInstaller.path;
  ffmpeg.setFfmpegPath(ffmpegPath);

  try {
    ffmpeg(url)
      .addInputOption(
        '-buffer_size', '102400',
        '-analyzeduration', '100000',
        '-max_delay', '1000000'
      )
      .on('start', function () { console.log('Stream started.') })
      .on('codecData', function () { console.log('Stream codecData.') })
      .on('error', function (err, stdout, stderr) {
        console.log('error:', err.message)
        console.log('input error: ', stdout)
        console.log('output error: ', stderr)
        stream.end()
      })
      .on('end', function () {
        console.log('Stream end!')
        stream.end()
      })
      .outputFormat('flv').videoCodec('copy').noAudio().pipe(stream)
  } catch (error) {
    console.error(error)
  }
}
