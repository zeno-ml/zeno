all: check format lint typecheck cover book 

.PHONY: install
install:
	@echo "==> 📦 Installing"
	@chmod +x ./build-views.sh
	@./build-views.sh
	@poetry install
	@cd frontend && npm i && npm run build

.PHONY: test
test:
	@echo "==> 🧪 Tests"
	@poetry run pytest -svv zeno/tests/*

.PHONY: cover
cover:
	@echo "==> 🧪 Tests with Coverage =="
	@poetry run pytest --cov=zeno --cov-report=term-missing ./zeno/tests/*

.PHONY: format
format:
	@echo "==> 🧩 Formatting"
	@cd frontend && npx prettier --write ./src/**/*

.PHONY: lint
lint:
	@echo "==> 👕 Linting"
	@poetry run black zeno/
	@poetry run usort format zeno/
	@poetry run flake8 zeno --statistics

.PHONY: typecheck
typecheck:
	@echo "==> ✅ Type checks"
	@make mypy pyright eslint

.PHONY: mypy
mypy:
	@poetry run mypy -p zeno 

.PHONY: pyright
pyright:
	@poetry run pyright zeno 

.PHONY: eslint
eslint:
	@cd frontend && ./node_modules/.bin/eslint ./src/

book:
	@echo "==> 📕 Book"
	@poetry run jupyter-book build docs

.PHONY: build
build:
	@echo "==> 👷‍♀️ Build"
	@cd frontend && npm run build
	@poetry build -vvv

.PHONY: check
check:
	@poetry check

.PHONY: publish
publish: build
	@echo "==> 📰 Publish"
	@poetry publish

.PHONY: clean
clean:
	@poetry run jupyter-book clean docs
	@rm -rf .coverage
	@rm -rf dist
	@find . -type d -name '.mypy_cache' -exec rm -rf {} +
	@find . -type d -name '__pycache__' -exec rm -rf {} +
	@find . -type d -name '*pytest_cache*' -exec rm -rf {} +
	@find . -type f -name "*.py[co]" -exec rm -rf {} +
	@find . -type d -name '*.ipynb_checkpoints' -exec rm -r {} +
