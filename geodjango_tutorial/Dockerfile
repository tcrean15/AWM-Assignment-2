FROM continuumio/miniconda3

LABEL maintainer="Thomas Crean"

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=geodjango_tutorial.settings

WORKDIR /app

# Install curl and postgresql-client for healthcheck
RUN apt-get update && apt-get install -y curl postgresql-client

# Create the environment:
COPY ENV.yml .
RUN conda env create -f ENV.yml

# Add these lines to install pip packages
RUN pip install python-dotenv
RUN /opt/conda/envs/awm_env/bin/pip install django-crispy-forms django-leaflet

# Create necessary directories
RUN mkdir -p /app/static /app/staticfiles

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

# Add this before the CMD line
ENV PYTHONPATH=/app:${PYTHONPATH}

CMD ["/app/entrypoint.sh"]