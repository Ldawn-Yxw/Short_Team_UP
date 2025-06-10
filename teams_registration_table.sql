-- 创建团队表
CREATE TABLE IF NOT EXISTS teams_team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '活动标题',
    sport_type VARCHAR(50) NOT NULL COMMENT '运动类型',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    location VARCHAR(255) NOT NULL COMMENT '活动地点',
    target_number INT NOT NULL COMMENT '目标人数',
    requirements TEXT COMMENT '活动要求',
    creator_id INT NOT NULL COMMENT '创建者ID',
    current_number INT DEFAULT 1 COMMENT '当前成员数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_sport_type (sport_type),
    INDEX idx_start_time (start_time),
    INDEX idx_creator (creator_id)
);

-- 创建报名记录表 (teams_registration)
CREATE TABLE IF NOT EXISTS teams_registration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    team_id INT NOT NULL COMMENT '团队ID',
    registration_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    status VARCHAR(10) DEFAULT 'joined' COMMENT '状态：joined/left',
    UNIQUE KEY unique_user_team (user_id, team_id),
    INDEX idx_user_id (user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_status (status),
    INDEX idx_registration_time (registration_time)
); 