"""
ASGI config for geodjango_tutorial project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from world.consumers import GameConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geodjango_tutorial.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path('ws/game/<int:game_id>/', GameConsumer.as_asgi()),
        ])
    ),
})
