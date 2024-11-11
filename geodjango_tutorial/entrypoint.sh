#!/bin/bash

source /opt/conda/etc/profile.d/conda.sh
conda activate awm_env

# Wait for postgres
until pg_isready -h postgis -p 5432 -U ${DB_USER}; do
  echo "Waiting for postgres..."
  sleep 2
done

echo "Postgres is up - executing commands"

# Run migrations in order
python manage.py makemigrations --noinput
python manage.py migrate auth --noinput
python manage.py migrate contenttypes --noinput
python manage.py migrate admin --noinput
python manage.py migrate sessions --noinput
python manage.py migrate world --noinput

# Create superuser
python manage.py createsuperuser --noinput --username admin --email admin@example.com || true

# Collect static files
python manage.py collectstatic --noinput

# Start server
exec gunicorn geodjango_tutorial.wsgi:application --bind 0.0.0.0:8001 