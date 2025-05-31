from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'teams', views.TeamViewSet)

app_name = 'teams'

urlpatterns = [
    path('', include(router.urls)),
] 