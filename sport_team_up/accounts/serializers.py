from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'confirm_password', 'age', 'gender', 'wechat_id')
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate(self, attrs):
        """验证密码确认"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("两次输入的密码不一致")
        return attrs
    
    def create(self, validated_data):
        """创建用户"""
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    """用户登录序列化器"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        """验证用户登录"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('用户名或密码错误')
            if not user.is_active:
                raise serializers.ValidationError('用户账户已被禁用')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('必须提供用户名和密码')

class UserProfileSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'age', 'gender', 'wechat_id', 'date_joined')
        read_only_fields = ('id', 'username', 'date_joined') 