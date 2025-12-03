# MacroMind Makefile
# Convenient commands for Docker Compose operations

.PHONY: help build up down restart logs clean test

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "MacroMind Docker Compose Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo ""
	@echo "✓ MacroMind is starting up..."
	@echo "✓ Frontend: http://localhost:3000"
	@echo "✓ Auth API: http://localhost:8000/docs"
	@echo "✓ Meal Planner API: http://localhost:8001/docs"
	@echo "✓ Nutrition AI API: http://localhost:8002/docs"

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-auth: ## Show logs from auth service
	docker-compose logs -f auth-service

logs-meal: ## Show logs from meal planner service
	docker-compose logs -f meal-planner-service

logs-ai: ## Show logs from nutrition AI service
	docker-compose logs -f nutrition-ai-service

logs-frontend: ## Show logs from frontend
	docker-compose logs -f frontend

logs-db: ## Show logs from database
	docker-compose logs -f postgres

ps: ## Show running containers
	docker-compose ps

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	@echo "✓ Cleaned up all containers, networks, and volumes"

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

dev: ## Start services in development mode with hot reload
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build: ## Build and start services in development mode
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

test: ## Run tests (placeholder)
	@echo "Running tests..."
	@echo "Backend tests:"
	docker-compose exec auth-service pytest tests/ || true
	docker-compose exec meal-planner-service pytest tests/ || true
	docker-compose exec nutrition-ai-service pytest tests/ || true

shell-auth: ## Open shell in auth service container
	docker-compose exec auth-service /bin/sh

shell-meal: ## Open shell in meal planner service container
	docker-compose exec meal-planner-service /bin/sh

shell-ai: ## Open shell in nutrition AI service container
	docker-compose exec nutrition-ai-service /bin/sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U macromind -d macromind

backup-db: ## Backup database
	docker-compose exec postgres pg_dump -U macromind macromind > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✓ Database backed up to backup_$(shell date +%Y%m%d_%H%M%S).sql"

init: ## Initialize project (copy .env and build)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env file from .env.example"; \
		echo "⚠ Please edit .env and add your OPENAI_API_KEY"; \
	else \
		echo "✓ .env file already exists"; \
	fi
	@docker-compose build
	@echo "✓ Project initialized! Run 'make up' to start services"

