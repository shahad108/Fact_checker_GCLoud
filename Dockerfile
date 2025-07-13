FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    gfortran \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-minimal.txt .
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir --timeout=1000 -r requirements-minimal.txt

RUN mkdir -p /models

COPY . .

ENV PYTHONPATH=/app
ENV PORT=8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]