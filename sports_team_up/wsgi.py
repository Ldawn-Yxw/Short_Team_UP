"""
WSGI config for sports_team_up project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sports_team_up.settings')

application = get_wsgi_application() 