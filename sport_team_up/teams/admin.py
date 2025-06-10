from django.contrib import admin
from .models import Team, Registration

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    """组队管理界面"""
    list_display = ('title', 'sport_type', 'location', 'start_time', 'current_number', 
                   'target_number', 'creator', 'created_at')
    list_filter = ('sport_type', 'created_at', 'start_time')
    search_fields = ('title', 'location', 'creator__username')
    date_hierarchy = 'start_time'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'sport_type', 'creator')
        }),
        ('时间地点', {
            'fields': ('start_time', 'end_time', 'location')
        }),
        ('人数设置', {
            'fields': ('target_number', 'current_number')
        }),
        ('详细信息', {
            'fields': ('requirements',)
        }),
        ('时间戳', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    """报名记录管理界面"""
    list_display = ('user', 'team', 'registration_time', 'status')
    list_filter = ('status', 'registration_time', 'team__sport_type')
    search_fields = ('user__username', 'team__title')
    date_hierarchy = 'registration_time'
    
    fieldsets = (
        ('报名信息', {
            'fields': ('user', 'team', 'status')
        }),
        ('时间信息', {
            'fields': ('registration_time',)
        }),
    )
