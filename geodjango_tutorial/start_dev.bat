@echo off

REM Start Redis and PostgreSQL using docker-compose
docker-compose -f docker-compose.dev.yml up -d

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 5

REM Set development environment variables
set DJANGO_SETTINGS_MODULE=geodjango_tutorial.settings_dev
set DJANGO_DEVELOPMENT=True

REM Install required packages
pip install uvicorn[standard] channels channels-redis django-cors-headers

REM Run migrations
python manage.py migrate

REM Start the development server using uvicorn
python run_dev.py 