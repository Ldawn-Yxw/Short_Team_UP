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

class TeamMemberSerializer(serializers.ModelSerializer):
    """组队成员序列化器"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    age = serializers.IntegerField(source='user.age', read_only=True)
    gender = serializers.CharField(source='user.gender', read_only=True)
    wechat_id = serializers.CharField(source='user.wechat_id', read_only=True)
    joined_at = serializers.DateTimeField(source='registration_time', read_only=True)
    is_creator = serializers.SerializerMethodField()
    join_order = serializers.SerializerMethodField()
    
    class Meta:
        model = Registration
        fields = ('username', 'user_id', 'age', 'gender', 'wechat_id', 'joined_at', 
                 'is_creator', 'join_order')
    
    def get_is_creator(self, obj):
        """检查是否是创建者"""
        return obj.team.creator == obj.user
    
    def get_join_order(self, obj):
        """获取加入顺序（第几个加入的）"""
        earlier_members = Registration.objects.filter(
            team=obj.team,
            status='joined',
            registration_time__lt=obj.registration_time
        ).count()
        return earlier_members + 1 