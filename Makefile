all: lint typecheck  test 

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
	@poetry run usort format zeno/
	@poetry run flake8 zeno --statistics
	@cd frontend && npm run lint

.PHONY: typecheck
typecheck:
	@echo "==> ✅ Type checks"
	@poetry run mypy -p zeno 
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
	@find . -type d -name '.mypy_cache' -exec rm -rf {} +
	@find . -type d -name '__pycache__' -exec rm -rf {} +
	@find . -type d -name '*pytest_cache*' -exec rm -rf {} +
	@find . -type f -name "*.py[co]" -exec rm -rf {} +
	@find . -type d -name '*.ipynb_checkpoints' -exec rm -r {} +
