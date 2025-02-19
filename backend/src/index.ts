import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORSの設定
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  maxAge: 86400,
}))

app.get('/', (c) => {
  return c.json({ message: 'KC3-Project API is running!' })
})

app.post('/transcribe', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return c.json({ 
        error: 'ファイルが提供されていません',
        code: 'NO_FILE'
      }, 400);
    }

    // ファイルタイプの検証
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      return c.json({
        error: '対応していない音声フォーマットです',
        code: 'INVALID_FILE_TYPE',
        supportedTypes: validTypes
      }, 400);
    }

    const whisperForm = new FormData();
    whisperForm.append('file', file);

    try {
      const res = await fetch('http://whisper:5000/transcribe', {
        method: 'POST',
        body: whisperForm,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '文字起こし処理に失敗しました');
      }

      const json = await res.json();
      return c.json({
        success: true,
        transcription: json.transcription,
      });

    } catch (error) {
      console.error('Whisper service error:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      return c.json({
        error: '文字起こし処理中にエラーが発生しました',
        code: 'TRANSCRIPTION_ERROR',
        details: errorMessage
      }, 500);
    }

  } catch (error) {
    console.error('Request handling error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return c.json({
      error: 'リクエスト処理中にエラーが発生しました',
      code: 'REQUEST_ERROR',
      details: errorMessage
    }, 500);
  }
});

const port = Number(process.env.PORT) || 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: port
})