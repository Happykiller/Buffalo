.DEFAULT_GOAL := help

.PHONY: help start stop remove reset start-from-scratch

help: ## Affiche les commandes supportées
	@echo "Commandes supportées :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

start: ## Lance les conteneurs Docker en arrière-plan
	docker compose up -d

stop: ## Arrête les conteneurs Docker
	docker compose stop

remove: ## Supprime les conteneurs Docker
	docker compose down

reset: ## Supprime les conteneurs et les volumes, puis relance tout
	docker compose down -v
	docker compose up -d

start-from-scratch: ## Supprime tout, reconstruit les images sans cache et relance
	docker compose down -v
	docker compose build --no-cache
	docker compose up -d
