from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """自定义用户管理界面"""
    list_display = ('username', 'email', 'age', 'gender', 'wechat_id', 'is_active', 'date_joined')
    list_filter = ('gender', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'wechat_id')
    
    fieldsets = UserAdmin.fieldsets + (
        ('额外信息', {'fields': ('age', 'gender', 'wechat_id')}),
    )
