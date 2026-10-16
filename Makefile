# ==============================================================================
# Crypto-Apples Management Commands
# ==============================================================================

.PHONY: help dev dev-api build preview lint db-migrate db-seed sync deploy-api

help:
	@echo "Available commands for Crypto-Apples:"
	@echo "  make dev          - Start frontend Vite dev server (port 3000)"
	@echo "  make dev-api      - Start Cloudflare Worker API locally (wrangler dev)"
	@echo "  make build        - Build production bundle for frontend"
	@echo "  make lint         - Run TypeScript type checking"
	@echo "  make db-migrate   - Run NeonDB schema migration (schema.sql)"
	@echo "  make db-seed      - Seed NeonDB with top 100 coins & initial promotions"
	@echo "  make sync         - Manually sync top 100 market coins from CoinGecko to NeonDB"
	@echo "  make deploy-api   - Deploy Cloudflare Worker API to Cloudflare Edge"

dev:
	pnpm dev

dev-api:
	pnpm dev:api

build:
	pnpm build

preview:
	pnpm preview

lint:
	pnpm lint

db-migrate:
	pnpm db:migrate

db-seed:
	pnpm db:seed

sync:
	pnpm sync:market

deploy-api:
	pnpm deploy:api
