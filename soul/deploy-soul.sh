#!/bin/bash

BLUEPRINT_STAGING="milton"
BLUEPRINT_PRODUCTION="milton-production"

sed -i '' "s/\"name\": \"$BLUEPRINT_STAGING\"/\"name\": \"$BLUEPRINT_PRODUCTION\"/" package.json

echo "Deploying to production..."
npx soul-engine dev &> /dev/null &
PID=$!

echo "Soul Engine CLI PID: $PID"

if ! ps -p $PID > /dev/null; then
    echo "Error: Failed to start 'npx soul-engine dev'. Aborting."
    sed -i '' "s/\"name\": \"$BLUEPRINT_PRODUCTION\"/\"name\": \"$BLUEPRINT_STAGING\"/" package.json
    exit 1
fi

echo "Interrupting the Soul Engine CLI process..."
sleep 5

echo "Almost there..."
sleep 5

kill -9 $PID
sleep 1

if ps -p $PID > /dev/null; then
    echo "Error: Failed to kill the 'npx soul-engine dev' process. Attempting to revert package name change."
    sed -i '' "s/\"name\": \"$BLUEPRINT_PRODUCTION\"/\"name\": \"$BLUEPRINT_STAGING\"/" package.json
    exit 2
fi

echo "✅ Done. (\"Killed: 9\" means it worked.)"

sed -i '' "s/\"name\": \"$BLUEPRINT_PRODUCTION\"/\"name\": \"$BLUEPRINT_STAGING\"/" package.json
