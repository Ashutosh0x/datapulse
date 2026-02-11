FROM python:3.10-slim

WORKDIR /app

COPY backend/api_gateway/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/api_gateway/src/ ./src/
COPY integrations/mcp-adapters/ ./integrations/mcp-adapters/

ENV PYTHONPATH=/app/src:/app/integrations/mcp-adapters

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
