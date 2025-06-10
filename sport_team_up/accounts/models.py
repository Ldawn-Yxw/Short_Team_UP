from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    自定义用户模型，扩展Django默认用户模型
    根据ER图添加：年龄、性别、微信号等字段
    """
    
    GENDER_CHOICES = [
        ('male', '男'),
        ('female', '女'),
    ]
    
    # ER图中的用户字段
    age = models.PositiveIntegerField(verbose_name='年龄', null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name='性别', null=True, blank=True)
    wechat_id = models.CharField(max_length=100, verbose_name='微信号', null=True, blank=True)
    
    # 用户ID字段（Django自带的id字段）
    # 密码字段（Django自带的password字段）
    # 用户名字段（Django自带的username字段）
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        db_table = 'accounts_user'
    
    def __str__(self):
        return self.username
