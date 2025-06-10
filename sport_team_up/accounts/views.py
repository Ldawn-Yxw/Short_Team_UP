from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    """获取CSRF token"""
    from django.middleware.csrf import get_token
    token = get_token(request)
    print(f"生成CSRF token: {token}")  # 调试日志
    response = JsonResponse({'csrfToken': token})
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """用户注册"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # 注册成功后自动登录
        login(request, user)
        return Response({
            'message': '注册成功',
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    print("=====================================================================")
    if request.user.is_authenticated:
        print("用户已登录:", request.user)
    else:
        print("用户未登录")
    """用户登录"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        if request.user.is_authenticated:
            print("用户已登录:", request.user)
        else:
            print("用户未登录")
        return Response({
            'message': '登录成功',
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_200_OK)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """用户登出"""
    logout(request)
    return Response({'message': '登出成功'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """检查认证状态"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserProfileSerializer(request.user).data
        })
    else:
        return Response({
            'authenticated': False,
            'user': None
        })

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """获取或更新用户信息"""
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
