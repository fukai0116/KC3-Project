# Whisper Dockerfile to build local Whisper service
FROM python:3.9-slim

WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg
RUN pip install flask openai-whisper
COPY docker/whisper_service.py /app/whisper_service.py
EXPOSE 5000
CMD ["python", "whisper_service.py"]
