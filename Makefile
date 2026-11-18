.PHONY: up down logs db backend frontend test reset

up:            ## build and start the whole stack
	docker compose up --build -d

down:          ## stop the stack (keeps database volume)
	docker compose down

reset:         ## stop and DELETE the database volume
	docker compose down -v

logs:          ## follow logs
	docker compose logs -f

db:            ## only MySQL, for local development
	docker compose up -d mysql

backend:       ## run Spring Boot locally against the dockerised MySQL
	cd backend && mvn spring-boot:run

frontend:      ## run the Vite dev server
	cd frontend && npm install && npm run dev

test:
	cd backend && mvn -B verify
	cd frontend && npm ci && npm run build
