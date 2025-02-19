from flask import Flask, request, jsonify
import whisper
import os
import logging
from datetime import datetime
import traceback

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('whisper-service')

app = Flask(__name__)

try:
    logger.info("Whisperモデルを読み込んでいます...")
    model = whisper.load_model('base')
    logger.info("Whisperモデルの読み込みが完了しました")
except Exception as e:
    logger.error(f"モデルの読み込みに失敗しました: {str(e)}")
    raise

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        logger.warning("ファイルが提供されていません")
        return jsonify({
            'error': 'ファイルが提供されていません',
            'code': 'NO_FILE'
        }), 400

    file = request.files['file']
    if not file.filename:
        logger.warning("ファイル名が空です")
        return jsonify({
            'error': 'ファイル名が無効です',
            'code': 'INVALID_FILENAME'
        }), 400

    temp_filename = f'temp_{datetime.now().strftime("%Y%m%d_%H%M%S")}.wav'
    try:
        logger.info(f"音声ファイルを保存しています: {temp_filename}")
        file.save(temp_filename)

        logger.info("文字起こしを開始します")
        result = model.transcribe(temp_filename)
        
        transcribed_text = result.get('text', '').strip()
        if not transcribed_text:
            logger.warning("文字起こし結果が空でした")
            return jsonify({
                'error': '文字起こし結果が空です',
                'code': 'EMPTY_TRANSCRIPTION'
            }), 422

        logger.info("文字起こしが完了しました")
        return jsonify({
            'transcription': transcribed_text,
            'language': result.get('language', 'unknown'),
            'duration': result.get('duration', 0)
        })

    except Exception as e:
        logger.error(f"エラーが発生しました: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': '文字起こし処理中にエラーが発生しました',
            'code': 'PROCESSING_ERROR',
            'details': str(e)
        }), 500

    finally:
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
                logger.info(f"一時ファイルを削除しました: {temp_filename}")
            except Exception as e:
                logger.error(f"一時ファイルの削除に失敗しました: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
