from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('csrf/', views.csrf_token, name='csrf_token'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('check-auth/', views.check_auth, name='check_auth'),
] 