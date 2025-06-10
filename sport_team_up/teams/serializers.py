from rest_framework import serializers
from .models import Team, Registration
from accounts.serializers import UserProfileSerializer

class TeamCreateSerializer(serializers.ModelSerializer):
    """创建组队序列化器"""
    
    class Meta:
        model = Team
        fields = ('title', 'location', 'start_time', 'end_time', 'target_number', 
                 'sport_type', 'requirements')
    
    def create(self, validated_data):
        """创建组队时设置创建者"""
        validated_data['creator'] = self.context['request'].user
        validated_data['current_number'] = 1  # 创建者自动加入
        team = Team.objects.create(**validated_data)
        
        # 创建者自动加入组队
        Registration.objects.create(
            user=self.context['request'].user,
            team=team,
            status='joined'
        )
        
        return team

class TeamListSerializer(serializers.ModelSerializer):
    """组队列表序列化器"""
    creator = UserProfileSerializer(read_only=True)
    is_full = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    is_joined = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ('id', 'title', 'location', 'start_time', 'end_time', 
                 'target_number', 'current_number', 'sport_type', 'requirements',
                 'creator', 'created_at', 'is_full', 'is_expired', 'is_joined')
    
    def get_is_joined(self, obj):
        """检查当前用户是否已加入该组队"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Registration.objects.filter(
                user=request.user,
                team=obj,
                status='joined'
            ).exists()
        return False

class TeamDetailSerializer(serializers.ModelSerializer):
    """组队详情序列化器"""
    creator = UserProfileSerializer(read_only=True)
    is_full = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    is_joined = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ('id', 'title', 'location', 'start_time', 'end_time', 
                 'target_number', 'current_number', 'sport_type', 'requirements',
                 'creator', 'created_at', 'updated_at', 'is_full', 'is_expired', 
                 'is_joined', 'members')
    
    def get_is_joined(self, obj):
        """检查当前用户是否已加入该组队"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Registration.objects.filter(
                user=request.user,
                team=obj,
                status='joined'
            ).exists()
        return False
    
    def get_members(self, obj):
        """获取组队成员列表"""
        active_registrations = Registration.objects.filter(
            team=obj,
            status='joined'
        ).select_related('user')
        
        return [UserProfileSerializer(reg.user).data for reg in active_registrations]

class RegistrationSerializer(serializers.ModelSerializer):
    """报名记录序列化器"""
    user = UserProfileSerializer(read_only=True)
    team = TeamListSerializer(read_only=True)
    
    class Meta:
        model = Registration
        fields = ('id', 'user', 'team', 'registration_time', 'status') 