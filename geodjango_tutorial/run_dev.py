import os
import django
import uvicorn

# Set up Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geodjango_tutorial.settings_dev")
os.environ.setdefault("DJANGO_DEVELOPMENT", "True")

# Initialize Django
django.setup()

if __name__ == "__main__":
    uvicorn.run(
        "geodjango_tutorial.asgi:application",
        host="0.0.0.0",
        port=8001,
        reload=True,
        reload_includes=[
            "*.py",
            "*.html",
            "*.js",
            "*.css"
        ],
        log_level="info"
    ) 