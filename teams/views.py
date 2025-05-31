from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Count, Q
from django.utils import timezone
from .models import Team, TeamMember
from .serializers import (
    TeamListSerializer,
    TeamDetailSerializer,
    TeamCreateSerializer,
    TeamUpdateSerializer
)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return TeamCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return TeamUpdateSerializer
        elif self.action == 'retrieve':
            return TeamDetailSerializer
        return TeamListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 过滤运动类型
        sport_type = self.request.query_params.get('sport_type', None)
        if sport_type:
            queryset = queryset.filter(sport_type=sport_type)
        
        # 过滤技能水平
        skill_level = self.request.query_params.get('skill_level', None)
        if skill_level:
            queryset = queryset.filter(skill_level=skill_level)
        
        # 过滤日期范围
        date_filter = self.request.query_params.get('date_filter', None)
        if date_filter:
            today = timezone.now().date()
            if date_filter == 'today':
                queryset = queryset.filter(date=today)
            elif date_filter == 'week':
                queryset = queryset.filter(date__range=[today, today + timezone.timedelta(days=7)])
            elif date_filter == 'month':
                queryset = queryset.filter(date__range=[today, today + timezone.timedelta(days=30)])

        # 过滤标签
        tags = self.request.query_params.getlist('tags', None)
        if tags:
            queryset = queryset.filter(tags__name__in=tags).distinct()

        # 我创建的
        created_by_me = self.request.query_params.get('created_by_me', None)
        if created_by_me and self.request.user.is_authenticated:
            queryset = queryset.filter(creator=self.request.user)

        # 我参加的
        joined_by_me = self.request.query_params.get('joined_by_me', None)
        if joined_by_me and self.request.user.is_authenticated:
            queryset = queryset.filter(members__user=self.request.user, members__is_active=True)

        # 热门活动
        hot = self.request.query_params.get('hot', None)
        if hot:
            queryset = queryset.annotate(
                member_count=Count('members', filter=Q(members__is_active=True))
            ).order_by('-member_count')

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        team = self.get_object()
        
        # 检查是否已经加入
        if TeamMember.objects.filter(team=team, user=request.user, is_active=True).exists():
            return Response({'detail': '您已经加入了这个队伍'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查人数是否已满
        current_members = team.members.filter(is_active=True).count()
        if current_members >= team.max_players:
            return Response({'detail': '队伍人数已满'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 加入队伍
        TeamMember.objects.create(
            team=team,
            user=request.user,
            is_active=True
        )
        
        return Response({'detail': '成功加入队伍'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        team = self.get_object()
        
        # 检查是否是创建者
        if team.creator == request.user:
            return Response({'detail': '创建者不能退出队伍'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 查找并更新成员状态
        member = TeamMember.objects.filter(team=team, user=request.user, is_active=True).first()
        if not member:
            return Response({'detail': '您不是这个队伍的成员'}, status=status.HTTP_400_BAD_REQUEST)
        
        member.is_active = False
        member.save()
        
        return Response({'detail': '成功退出队伍'})

    def perform_destroy(self, instance):
        # 软删除
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取运动项目统计信息"""
        stats = Team.objects.filter(is_active=True).values('sport_type').annotate(
            total=Count('id'),
            active_teams=Count('id', filter=Q(date__gte=timezone.now().date())),
            total_members=Count('members', filter=Q(members__is_active=True))
        )
        return Response(stats) 