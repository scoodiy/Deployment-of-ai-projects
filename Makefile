.PHONY: install dev test lint format build deploy clean

install:
	pip install -r backend/requirements.txt
	pip install -r strategy-engine/requirements.txt
	pip install -r risk-engine/requirements.txt
	pip install -r data-collector/requirements.txt
	pip install -r qa-bot/requirements.txt
	cd frontend && npm install

dev:
	docker-compose -f deploy/docker/docker-compose.yml up -d postgres redis
	uvicorn backend.app.main:app --reload --port 8000 &
	cd frontend && npm run dev &

test:
	pytest tests/ -v --tb=short

lint:
	ruff check .
	mypy backend/ strategy-engine/ risk-engine/ data-collector/ qa-bot/

format:
	black .
	ruff check --fix .

build:
	bash deploy/scripts/build_images.sh

deploy:
	bash deploy/scripts/deploy.sh

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf frontend/node_modules frontend/dist
