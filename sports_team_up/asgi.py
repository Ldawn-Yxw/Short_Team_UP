"""
ASGI config for sports_team_up project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_team_up.settings')

application = get_asgi_application() 