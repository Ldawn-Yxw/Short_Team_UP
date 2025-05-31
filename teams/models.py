from django.db import models
from django.contrib.auth.models import User

class Team(models.Model):
    SPORT_CHOICES = [
        ('basketball', '篮球'),
        ('football', '足球'),
        ('pingpong', '乒乓球'),
        ('running', '跑步'),
        ('volleyball', '排球'),
    ]

    SKILL_LEVEL_CHOICES = [
        ('beginner', '新手友好'),
        ('intermediate', '有一定基础'),
        ('advanced', '有较多经验'),
        ('expert', '高手级别'),
    ]

    title = models.CharField('活动标题', max_length=100)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_teams', verbose_name='发起人')
    sport_type = models.CharField('运动类型', max_length=20, choices=SPORT_CHOICES)
    date = models.DateField('活动日期')
    time = models.TimeField('活动时间')
    location = models.CharField('活动地点', max_length=200)
    min_players = models.IntegerField('最少人数')
    max_players = models.IntegerField('最多人数')
    skill_level = models.CharField('技能水平', max_length=20, choices=SKILL_LEVEL_CHOICES)
    description = models.TextField('活动描述')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    is_active = models.BooleanField('是否活跃', default=True)

    class Meta:
        verbose_name = '运动组队'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members', verbose_name='组队')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='joined_teams', verbose_name='成员')
    joined_at = models.DateTimeField('加入时间', auto_now_add=True)
    is_active = models.BooleanField('是否活跃', default=True)

    class Meta:
        verbose_name = '组队成员'
        verbose_name_plural = verbose_name
        unique_together = ['team', 'user']

    def __str__(self):
        return f'{self.user.username} - {self.team.title}'

class TeamTag(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='tags', verbose_name='组队')
    name = models.CharField('标签名', max_length=50)

    class Meta:
        verbose_name = '组队标签'
        verbose_name_plural = verbose_name
        unique_together = ['team', 'name']

    def __str__(self):
        return self.name 