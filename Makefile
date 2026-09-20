DOCKER := $(shell which docker 2>/dev/null || echo /usr/local/bin/docker)

.PHONY: dev dev-build down clean logs logs-server logs-client logs-db prisma-generate prisma-push prisma-studio seed db-shell db-status db-init

dev:
	$(DOCKER) compose up

dev-build:
	$(DOCKER) compose up --build

dev-detach:
	$(DOCKER) compose up -d

dev-build-detach:
	$(DOCKER) compose up --build -d

down:
	$(DOCKER) compose down

clean:
	$(DOCKER) compose down -v

logs:
	$(DOCKER) compose logs -f

logs-server:
	$(DOCKER) compose logs -f server

logs-client:
	$(DOCKER) compose logs -f client

logs-db:
	$(DOCKER) compose logs -f mongodb

db-shell:
	$(DOCKER) compose exec mongodb mongosh crm

db-status:
	$(DOCKER) compose exec mongodb mongosh --eval "rs.status()"

db-init:
	$(DOCKER) compose exec mongodb mongosh --eval "try { rs.status() } catch (e) { rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongodb:27017' }] }) }"

prisma-generate:
	$(DOCKER) compose exec server npx prisma generate

prisma-push:
	$(DOCKER) compose exec server npx prisma db push

prisma-studio:
	$(DOCKER) compose exec server npx prisma studio

seed:
	$(DOCKER) compose exec server npm run seed
