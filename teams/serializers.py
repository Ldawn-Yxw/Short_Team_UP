from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Team, TeamMember, TeamTag

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TeamTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamTag
        fields = ['name']

class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = TeamMember
        fields = ['user', 'joined_at']

class TeamListSerializer(serializers.ModelSerializer):
    creator = UserSerializer()
    tags = TeamTagSerializer(many=True)
    member_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'id', 'title', 'creator', 'sport_type', 'date', 'time',
            'location', 'min_players', 'max_players', 'skill_level',
            'description', 'tags', 'member_count', 'is_joined', 'is_liked',
            'created_at'
        ]

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(user=request.user, is_active=True).exists()
        return False

    def get_is_liked(self, obj):
        # TODO: 实现点赞功能后添加此逻辑
        return False

class TeamDetailSerializer(TeamListSerializer):
    members = TeamMemberSerializer(many=True, source='members.filter(is_active=True)')

    class Meta(TeamListSerializer.Meta):
        fields = TeamListSerializer.Meta.fields + ['members']

class TeamCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False
    )

    class Meta:
        model = Team
        fields = [
            'title', 'sport_type', 'date', 'time', 'location',
            'min_players', 'max_players', 'skill_level', 'description',
            'tags'
        ]

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        team = Team.objects.create(
            creator=self.context['request'].user,
            **validated_data
        )
        
        # 创建标签
        for tag_name in tags_data:
            TeamTag.objects.create(team=team, name=tag_name)
        
        # 创建者自动加入队伍
        TeamMember.objects.create(
            team=team,
            user=team.creator,
            is_active=True
        )
        
        return team

class TeamUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False
    )

    class Meta:
        model = Team
        fields = [
            'title', 'sport_type', 'date', 'time', 'location',
            'min_players', 'max_players', 'skill_level', 'description',
            'tags'
        ]

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        
        # 更新基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 更新标签
        if tags_data is not None:
            instance.tags.all().delete()
            for tag_name in tags_data:
                TeamTag.objects.create(team=instance, name=tag_name)

        return instance 