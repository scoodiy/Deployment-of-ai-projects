#!/bin/bash
set -e

echo "Running code style checks..."

black --check .
ruff check .
mypy backend/ strategy-engine/ risk-engine/ data-collector/ qa-bot/

echo "All checks passed!"
