FROM python:3.12-slim

WORKDIR /app

RUN pip uninstall -y torch torchvision torchaudio


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /models

COPY . .

ENV PYTHONPATH=/app

CMD ["./docker-entrypoint.sh"]