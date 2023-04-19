all: lint typecheck clean

.PHONY: install
install:
	@echo "==> 📦 Installing"
	@cd frontend && npm i && npm run build
	@poetry install

.PHONY: lint
lint:
	@echo "==> 👕 Linting"
	@poetry check
	@poetry run black zeno/
	@poetry run ruff check zeno/
	@cd frontend && npm run lint

.PHONY: typecheck
typecheck:
	@echo "==> ✅ Type checks"
	@poetry run pyright zeno 
	@cd frontend && npm run check

.PHONY: test
test:
	@echo "==> 🧪 Tests"
	@poetry run pytest -svv zeno/tests/
	@cd frontend && npm run test

.PHONY: build
build:
	@echo "==> 👷‍♀️ Build"
	@cd frontend && npm run build
	@cd frontend && node build.js
	@mv zeno/frontend/index.html zeno/frontend/index_og.html
	@mv zeno/frontend/index_tmp.html zeno/frontend/index.html
	@poetry build -v
	@rm zeno/frontend/index.html
	@mv zeno/frontend/index_og.html zeno/frontend/index.html

.PHONY: clean
clean:
	@rm -rf dist
	@rm -rf ./.zeno_cache
	@find . -type d -name '__pycache__' -exec rm -rf {} +
	@find . -type d -name '*pytest_cache*' -exec rm -rf {} +
	@find . -type f -name "*.py[co]" -exec rm -rf {} +
	@find . -type d -name '*.ipynb_checkpoints' -exec rm -r {} +

.PHONY: publish
publish:
	@echo "==> 🚀 Publishing"
	@git commit -am "chore: bump version to $(shell poetry version -s)"
	@git tag "v$(shell poetry version -s)"
	@make build
	@poetry publish
	@git push && git push --tags