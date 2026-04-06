#!/bin/sh

echo "Running the app..."

cd "$(dirname "$0")"

exec node packages/app/server.js
