#!/bin/sh
# Run a .test.js file with the framework loader.
# Usage: ./scripts/run-tests.sh public/framework/core/Item/0/Item0.test.js
node --import ./scripts/register.mjs "$@"
