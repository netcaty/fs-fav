FROM python:3.9-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 使用Gunicorn启动
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "${GUNICORN_WORKERS:-4}", "wsgi:app"]