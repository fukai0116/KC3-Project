import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { OpenAI } from 'openai'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import * as dotenv from 'dotenv'

// .envファイルを読み込む
dotenv.config()

// APIキーが設定されているか確認
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in .env file')
  process.exit(1)
}

ffmpeg.setFfmpegPath(ffmpegPath.path)

const app = new Hono()

// CORSの設定を更新
app.use('/*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
}))

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.get('/', (c) => {
  return c.json({ message: 'KC3-Project API is running!' })
})

app.post('/transcribe', async (c) => {
  try {
    const formData = await c.req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return c.json({ error: 'No audio file provided' }, 400)
    }

    // 一時ファイルパスの設定
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const inputPath = path.join(tempDir, 'input.webm')
    const outputPath = path.join(tempDir, 'output.mp3')

    // 音声ファイルを一時保存
    const arrayBuffer = await audioFile.arrayBuffer()
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer))

    // WebMからMP3に変換
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject)
    })

    // Whisperで文字起こし
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: 'whisper-1'
    })

    // 一時ファイルの削除
    fs.unlinkSync(inputPath)
    fs.unlinkSync(outputPath)

    // レスポンスヘッダーを設定
    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(JSON.stringify({ error: 'Failed to transcribe audio' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})

const port = Number(process.env.PORT) || 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: port
})