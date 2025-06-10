from django.db import models
from django.conf import settings
from django.utils import timezone

class Team(models.Model):
    """
    组队信息模型
    根据ER图包含：组队ID、地点、开始时间、结束时间、目标人数、当前人数、运动类型、需求等
    """
    
    SPORT_TYPE_CHOICES = [
        ('basketball', '篮球'),
        ('football', '足球'),
        ('pingpong', '乒乓球'),
        ('running', '跑步'),
        ('volleyball', '排球'),
        ('badminton', '羽毛球'),
        ('tennis', '网球'),
        ('fitness', '有氧健身'),
        ('swimming', '游泳'),
    ]
    
    # 组队ID（Django自带的id字段）
    title = models.CharField(max_length=200, verbose_name='活动标题')
    location = models.CharField(max_length=200, verbose_name='地点')
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(verbose_name='结束时间')
    target_number = models.PositiveIntegerField(verbose_name='目标人数')
    current_number = models.PositiveIntegerField(verbose_name='当前人数', default=0)
    sport_type = models.CharField(max_length=20, choices=SPORT_TYPE_CHOICES, verbose_name='运动类型')
    requirements = models.TextField(verbose_name='需求', blank=True)
    
    # 创建者
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                               related_name='created_teams', verbose_name='创建者')
    
    # 创建时间
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '组队信息'
        verbose_name_plural = '组队信息'
        db_table = 'teams_team'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.sport_type}"
    
    @property
    def is_full(self):
        """检查是否已满员"""
        return self.current_number >= self.target_number
    
    @property
    def is_expired(self):
        """检查是否已过期"""
        return timezone.now() > self.end_time


class Registration(models.Model):
    """
    报名记录模型
    根据ER图包含：报名记录ID、报名时间、状态
    """
    
    STATUS_CHOICES = [
        ('joined', '已加入'),
        ('left', '已退出'),
    ]
    
    # 报名记录ID（Django自带的id字段）
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                            related_name='registrations', verbose_name='用户')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, 
                            related_name='registrations', verbose_name='组队')
    registration_time = models.DateTimeField(verbose_name='报名时间', auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, 
                             verbose_name='状态', default='joined')
    
    class Meta:
        verbose_name = '报名记录'
        verbose_name_plural = '报名记录'
        db_table = 'teams_registration'
        unique_together = ['user', 'team']  # 确保同一用户不能重复加入同一组队
        ordering = ['-registration_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.team.title} - {self.status}"
