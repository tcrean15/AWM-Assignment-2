FROM continuumio/miniconda3

LABEL maintainer="Thomas Crean"

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=geodjango_tutorial.settings

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    redis-server

# Create the environment
COPY ENV.yml .
RUN conda env create -f ENV.yml

# Install additional Python packages
RUN /opt/conda/envs/awm_env/bin/pip install \
    channels \
    channels-redis \
    django-cors-headers \
    pillow \
    python-dotenv \
    django-crispy-forms \
    django-leaflet

# Create necessary directories
RUN mkdir -p /app/static /app/staticfiles /app/media

# Copy the application code
COPY . /app/

# Make sure files are readable
RUN chmod -R 755 /app

# Copy entrypoint script
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Set environment variables for the superuser
ENV DJANGO_SUPERUSER_PASSWORD=admin123

EXPOSE 8001

ENV PYTHONPATH=/app:${PYTHONPATH}

CMD ["/app/entrypoint.sh"]