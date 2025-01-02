#!/bin/bash

# Start Redis and PostgreSQL using docker-compose
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Set development environment variables
export DJANGO_SETTINGS_MODULE=geodjango_tutorial.settings_dev
export DJANGO_DEVELOPMENT=True

# Install required packages
pip install daphne channels channels-redis

# Run migrations
python manage.py migrate

# Start the development server using Daphne
python run_dev.py 