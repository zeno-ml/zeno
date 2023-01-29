all: check lint typecheck test 

.PHONY: install
install:
	@echo "==> 📦 Installing"
	@cd frontend && npm i && npm run build
	@poetry install

.PHONY: check
check:
	@echo "==> 🧩 Checking Validity"
	@poetry check
	@cd frontend && npm run check

.PHONY: lint
lint:
	@echo "==> 👕 Linting"
	@poetry run black zeno/
	@poetry run usort format zeno/
	@poetry run flake8 zeno --statistics
	@cd frontend && npm run format && npm run lint

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

.PHONY: profile 
profile:
	@echo "==> 🧪 Profile"
	@poetry run python -m cProfile -o p.profile -m zeno        
	@snakeviz p.profile

.PHONY: profile-import
profile-import:
	@echo "==> 🧪 Profile Imports"
	@poetry run python -X importtime -m zeno 2> p.profile      
	@tuna p.profile

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
	@rm -rf dist
	@find . -type d -name '.mypy_cache' -exec rm -rf {} +
	@find . -type d -name '__pycache__' -exec rm -rf {} +
	@find . -type d -name '*pytest_cache*' -exec rm -rf {} +
	@find . -type f -name "*.py[co]" -exec rm -rf {} +
	@find . -type d -name '*.ipynb_checkpoints' -exec rm -r {} +
