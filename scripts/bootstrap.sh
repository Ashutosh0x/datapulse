#!/bin/bash
# Bootstrap script for DataPulse local development

echo "================================"
echo "DataPulse Bootstrap Script"
echo "================================"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required but not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Error: python3 is required but not installed."; exit 1; }

echo " Prerequisites check passed"

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "  Please edit .env and fill in your credentials!"
else
    echo " .env already exists"
fi

# Start docker-compose
echo ""
echo "Starting infrastructure with docker-compose..."
cd infra/local
docker-compose up -d

echo ""
echo "Waiting for Elasticsearch to be ready..."
until curl -s http://localhost:9200 >/dev/null; do
    echo -n "."
    sleep 2
done
echo ""
echo " Elasticsearch is up!"

echo ""
echo "Waiting 10s for services to stabilize..."
sleep 10

# Generate demo data
echo ""
echo "Generating demo data..."
cd ../../data/generator
python3 generate_data.py

echo ""
echo "================================"
echo "[DONE] Bootstrap Complete!"
echo "================================"
echo ""
echo "Services:"
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"
echo "  API Gateway:   http://localhost:8000"
echo "  API Docs:      http://localhost:8000/docs"
echo ""
echo "To start the frontend:"
echo "  cd frontend/kibana-plugin"
echo "  npm install && npm start"
echo ""
echo "To view logs:"
echo "  docker-compose -f infra/local/docker-compose.yml logs -f"
