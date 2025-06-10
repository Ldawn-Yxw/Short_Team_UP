from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Team, Registration, Notification
from .serializers import TeamCreateSerializer, TeamListSerializer, TeamDetailSerializer, TeamMemberSerializer, NotificationSerializer
# Create your views here.

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def teams(request):
    
    """获取组队列表或创建新组队"""
    if request.method == 'GET':
        # 获取查询参数
        sport_type = request.GET.get('sport_type', '')
        created_by_me = request.GET.get('created_by_me', '').lower() == 'true'
        joined_teams = request.GET.get('joined_teams', '').lower() == 'true'
        my_teams = request.GET.get('my_teams', '').lower() == 'true'
        
        queryset = Team.objects.all()
        
        # 按运动类型筛选
        if sport_type:
            queryset = queryset.filter(sport_type=sport_type)
        
        # 我创建的组队
        if created_by_me:
            queryset = queryset.filter(creator=request.user)
        
        # 我参与的组队
        elif joined_teams:
            user_registrations = Registration.objects.filter(
                user=request.user,
                status='joined'
            ).values_list('team_id', flat=True)
            queryset = queryset.filter(id__in=user_registrations)
        
        # 我的组队（创建的和参与的）
        elif my_teams:
            user_registrations = Registration.objects.filter(
                user=request.user,
                status='joined'
            ).values_list('team_id', flat=True)
            queryset = queryset.filter(
                Q(creator=request.user) | Q(id__in=user_registrations)
            ).distinct()
        
        serializer = TeamListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
    # 创建新组队
        serializer = TeamCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            team = serializer.save()
            # 创建组队成功通知
            create_notification(
                user=request.user,
                type='team_created',
                title='创建组队成功',
                content=f'您已成功创建组队"{team.title}"'
            )
            return Response(
                TeamDetailSerializer(team, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_detail(request, team_id):
    """获取组队详情"""
    team = get_object_or_404(Team, id=team_id)
    serializer = TeamDetailSerializer(team, context={'request': request})
    return Response(serializer.data)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_team(request, team_id):
    """加入组队"""
    team = get_object_or_404(Team, id=team_id)
    user = request.user
    
    # 检查是否已满员
    if team.is_full:
        return Response({'error': '该组队已满员'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查是否已过期
    if team.is_expired:
        return Response({'error': '该组队已过期'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查是否已经加入
    existing_registration = Registration.objects.filter(
        user=user,
        team=team,
        status='joined'
    ).first()
    
    if existing_registration:
        return Response({'error': '您已经加入了该组队'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查是否有退出记录，如果有则更新状态
    old_registration = Registration.objects.filter(
        user=user,
        team=team
    ).first()
    
    if old_registration:
        old_registration.status = 'joined'
        old_registration.save()
    else:
        Registration.objects.create(
            user=user,
            team=team,
            status='joined'
        )
    
    # 更新当前人数
    team.current_number = Registration.objects.filter(
        team=team,
        status='joined'
    ).count()
    team.save()
    
    # 添加加入组队成功通知
    create_notification(
        user=user,
        type='team_joined',
        title='加入组队成功',
        content=f'您已成功加入组队"{team.title}"'
    )
    
    return Response({'message': '成功加入组队'}, status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_team(request, team_id):
    """退出组队"""
    team = get_object_or_404(Team, id=team_id)
    user = request.user
    
    # 检查是否已经加入
    registration = Registration.objects.filter(
        user=user,
        team=team,
        status='joined'
    ).first()
    
    if not registration:
        return Response({'error': '您尚未加入该组队'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查是否是创建者
    if team.creator == user:
        return Response({'error': '创建者不能退出自己创建的组队'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 更新状态为已退出
    registration.status = 'left'
    registration.save()
    
    # 更新当前人数
    team.current_number = Registration.objects.filter(
        team=team,
        status='joined'
    ).count()
    team.save()
    
    # 添加退出组队成功通知
    create_notification(
        user=user,
        type='team_left',
        title='退出组队成功',
        content=f'您已成功退出组队"{team.title}"'
    )
    
    return Response({'message': '成功退出组队'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_members(request, team_id):
    """获取组队成员列表"""
    team = get_object_or_404(Team, id=team_id)
    
    # 获取所有已加入的成员
    members = Registration.objects.filter(
        team=team,
        status='joined'
    ).select_related('user').order_by('registration_time')
    
    serializer = TeamMemberSerializer(members, many=True)
    return Response(serializer.data)

@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_team(request, team_id):
    """删除组队"""
    team = get_object_or_404(Team, id=team_id)
    user = request.user
    
    # 检查是否是创建者
    if team.creator != user:
        return Response({'error': '只有创建者可以删除组队'}, status=status.HTTP_403_FORBIDDEN)
    
    # 获取所有组队成员（除了创建者）
    members = Registration.objects.filter(team=team, status='joined').exclude(user=user)
    
    # 给所有成员发送组队解散通知
    for registration in members:
        create_notification(
            user=registration.user,
            type='team_disbanded',
            title='组队已解散',
            content=f'您加入的组队"{team.title}"已被创建者解散'
        )
    
    # 给创建者发送删除成功通知
    create_notification(
        user=user,
        type='team_deleted',
        title='删除组队成功',
        content=f'您已成功删除组队"{team.title}"'
    )
    
    # 删除组队（这会自动删除相关的registration记录，因为我们使用了外键的CASCADE）
    team.delete()
    
    return Response({'message': '成功删除组队'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    """获取用户的消息通知列表"""
    notifications = Notification.objects.filter(user=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """标记消息为已读"""
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.is_read = True
    notification.save()
    return Response({'message': '已标记为已读'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """获取未读消息数量"""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'count': count})

def create_notification(user, type, title, content):
    """创建消息通知的辅助函数"""
    Notification.objects.create(
        user=user,
        type=type,
        title=title,
        content=content
    )
