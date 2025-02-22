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

app.post('/analyze-kansai', async (c) => {
  try {
    const { standardText, kansaiText } = await c.req.json()

    if (!standardText || !kansaiText) {
      return c.json({ error: 'Both standard and Kansai texts are required' }, 400)
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `関西弁の分析を短く簡潔に行ってください。

回答は以下の形式で、2-3行程度でまとめてください：

関西弁レベル: [0-100の数字]
分析:
[関西弁の特徴や自然さについて、2-3行で簡潔に説明]`
        },
        {
          role: "user",
          content: `標準語: "${standardText}"
関西弁: "${kansaiText}"

上記のテキストを比較して、関西弁の特徴を簡潔に分析してください。`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    if (!completion.choices[0].message.content) {
      return c.json({ error: 'Failed to get analysis result' }, 500)
    }

    const response = completion.choices[0].message.content
    let kansaiLevel = 0

    // レスポンスから数値を抽出
    const match = response.match(/関西弁レベル:\s*(\d+)/i)
    if (match) {
      kansaiLevel = parseInt(match[1])
    }

    // 分析部分を抽出（改行を保持）
    const analysisMatch = response.match(/分析:[\s\n]*([\s\S]+?)(?=---|$)/i)
    const analysis = analysisMatch 
      ? analysisMatch[1].trim()
      : "分析結果を取得できませんでした。"

    return c.json({
      kansaiLevel,
      analysis,
      standardText,
      kansaiText
    })

  } catch (error) {
    console.error('Kansai analysis error:', error)
    return c.json({ error: 'Failed to analyze Kansai dialect' }, 500)
  }
})

const port = Number(process.env.PORT) || 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: port
})