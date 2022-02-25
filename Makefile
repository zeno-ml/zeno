all: lint typecheck book check

.PHONY: test
test:
	@echo "==> 🧪 Tests"
	@poetry run pytest -svv zeno/tests/

.PHONY: lint
lint:
	@echo "==> 👕 Linting"
	@poetry run black zeno/
	@poetry run usort format zeno/
	@poetry run flake8 zeno --statistics

.PHONY: typecheck
typecheck:
	@echo "==> ✅ Type checks"
	@make mypy pyright

.PHONY: mypy
mypy:
	@poetry run mypy -p zeno 

.PHONY: pyright
pyright:
	@poetry run pyright zeno 

book:
	@echo "==> 📕 Book"
	@poetry run jupyter-book build docs

.PHONY: book-strict
book-strict:
	@poetry run jupyter-book build -W -n --keep-going docs

.PHONY: build
build:
	@echo "==> 👷‍♀️ Build"
	@poetry build -vvv

.PHONY: check
check:
	@poetry check

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
