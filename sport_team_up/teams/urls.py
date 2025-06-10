from django.urls import path
from . import views

app_name = 'teams'

urlpatterns = [
    path('', views.teams, name='teams'),
    path('<int:team_id>/', views.team_detail, name='team_detail'),
    path('<int:team_id>/join/', views.join_team, name='join_team'),
    path('<int:team_id>/leave/', views.leave_team, name='leave_team'),
    path('<int:team_id>/members/', views.team_members, name='team_members'),
    path('<int:team_id>/delete/', views.delete_team, name='delete_team'),
    path('notifications/', views.notifications, name='notifications'),
    path('notifications/unread/', views.unread_count, name='unread_count'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
] 