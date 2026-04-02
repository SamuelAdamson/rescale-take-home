.PHONY: build up test e2e_test backend_unit_test frontend_unit_test stop clean

build:
	docker compose build

up:
	docker compose up -d && echo "Running app at http://localhost:3000/"

backend_unit_test:
	@echo "Running backend unit tests..."
	docker compose --profile test run --build --rm backend-test
	@echo "Backend unit tests complete!"

frontend_unit_test:
	@echo "Running frontend unit tests..."
	docker compose --profile test run --build --rm frontend-test
	@echo "Frontend unit tests complete!"

e2e_test: clean # Ensures dependent services are stopped
	@echo "Running E2E tests..."
	@docker compose --profile test run --build --rm e2e-test; \
	EXIT_CODE=$$?; \
	docker compose stop frontend backend db; \
	docker compose down --volumes --remove-orphans; \
	echo "E2E tests complete!"; \
	exit $$EXIT_CODE

test: backend_unit_test frontend_unit_test e2e_test

stop:
	docker compose stop

clean:
	docker compose down --volumes --remove-orphans
