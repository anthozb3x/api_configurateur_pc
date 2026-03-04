#!/bin/sh
set -e

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
until node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => { mongoose.connection.close(); process.exit(0); })
    .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "MongoDB not ready, retrying in 2s..."
  sleep 2
done
echo "MongoDB is ready."

# Seed data if SEED_DATA is enabled
if [ "$SEED_DATA" = "true" ]; then
  echo "Seeding mock data..."
  node dist/scripts/create-mocks.js
  echo "Seeding complete."
fi

# Start the API server
exec node dist/server.js
