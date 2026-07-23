FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV MODEL_NAME=all-MiniLM-L6-v2
ENV CROSS_ENCODER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2

COPY services/ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ml/ .

EXPOSE 8000
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
