all: check lint typecheck test book 

.PHONY: install
install:
	@echo "==> 📦 Installing"
	@chmod +x ./build-views.sh
	@./build-views.sh
	@cd frontend && npm i && npm run build
	@poetry install

.PHONY: check
check:
	@echo "==> 🧩 Checking Validity"
	@poetry check

.PHONY: lint
lint:
	@echo "==> 👕 Linting"
	@poetry run black zeno/
	@poetry run usort format zeno/
	@poetry run flake8 zeno --statistics
	@cd frontend && npm run lint 

.PHONY: typecheck
typecheck:
	@echo "==> ✅ Type checks"
	@poetry run mypy -p zeno 
	@poetry run pyright zeno 

.PHONY: test
test:
	@echo "==> 🧪 Tests"
	@poetry run pytest -svv zeno/tests/*
	@cd frontend && npm run test

book:
	@echo "==> 📕 Book"
	@cd docs; npm i; npm run build;

.PHONY: build
build:
	@echo "==> 👷‍♀️ Build"
	@cd frontend && npm run build
	@poetry build -vvv

.PHONY: publish
publish: build
	@echo "==> 📰 Publish"
	@poetry publish

.PHONY: clean
clean:
	@poetry run jupyter-book clean docs
	@rm -rf dist
	@find . -type d -name '.mypy_cache' -exec rm -rf {} +
	@find . -type d -name '__pycache__' -exec rm -rf {} +
	@find . -type d -name '*pytest_cache*' -exec rm -rf {} +
	@find . -type f -name "*.py[co]" -exec rm -rf {} +
	@find . -type d -name '*.ipynb_checkpoints' -exec rm -r {} +
