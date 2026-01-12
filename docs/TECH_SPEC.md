# 🎯 Aura / 诺值 — MVP 技术文档

> 预测你的行为，用 Credit 证明你的决心

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心概念](#2-核心概念)
3. [状态流转](#3-状态流转)
4. [技术架构](#4-技术架构)
5. [数据库设计](#5-数据库设计)
6. [API 设计](#6-api-设计)
7. [页面结构](#7-页面结构)
8. [支付集成](#8-支付集成)
9. [推送与链接](#9-推送与链接)
10. [国际化](#10-国际化)
11. [开发计划](#11-开发计划)

---

## 1. 产品概述

### 1.1 产品定位

Aura（国际）/ 诺值（国内）是一款**行为预测**应用：
- 用户对自己的行为做出预测（目标）
- 投入 Credit 证明信心
- 邀请裁判监督和判定
- 成功返还 Credit，失败则没收

### 1.2 核心机制

| 机制 | 说明 |
|------|------|
| **Stake Credit** | 用户为预测投入的信用点 |
| **Referee（裁判）** | 判定预测结果的人，投票决定成功/失败 |
| **Recovery Mode（恢复模式）** | 首次失败后，连续成功 2 次可恢复 Credit |
| **Social Pressure（社交压力）** | 分享给朋友监督，增加执行动力 |

### 1.3 商业模式

**用户失败 = 平台收入**

失败的 Credit 归平台所有，简单直接。

---

## 2. 核心概念

### 2.1 术语定义

| 术语 | 英文 | 说明 |
|------|------|------|
| 预测 | Prediction | 用户对自己行为的预测/目标 |
| 信用点 | Credit | 平台内部货币，不可提现 |
| 质押 | Stake | 为预测投入的 Credit |
| 裁判 | Referee | 判定预测结果的人 |
| 裁判码 | Referee Code | 邀请裁判的唯一标识 |
| 恢复模式 | Recovery Mode | 失败后的补救阶段 |
| 打卡 | Check-in | 用户上传的进度证明 |

### 2.2 Credit 规则

| 规则 | 国际版 | 国内版 |
|------|--------|--------|
| 汇率 | $1 = 10 Credit | ¥1 = 1 Credit |
| 最小质押 | 10 Credit | 10 Credit |
| 最大质押 | 1000 Credit | 1000 Credit |
| 可提现 | ❌ | ❌ |

### 2.3 裁判规则

| 规则 | 说明 |
|------|------|
| 最少人数 | 1 人 |
| 最多人数 | 无限制 |
| 投票规则 | 同意 > 50% 则成功 |
| 超时处理 | 24h 未投票算同意 |
| 身份要求 | 必须安装 App |

### 2.4 恢复模式规则

| 规则 | 说明 |
|------|------|
| 触发条件 | 首次预测失败 |
| 恢复条件 | 连续成功 2 次 |
| 失败后果 | 中途失败则 Credit 没收 |
| Referee Code | 与原预测共用 |
| 新质押 | 不需要，用原来的 Stake |

---

## 3. 状态流转

### 3.1 预测状态

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  ACTIVE  │───▶│ JUDGING  │───▶│ SUCCESS  │
│ (进行中)  │    │ (判定中)  │    │  (成功)   │
└──────────┘    └────┬─────┘    └──────────┘
                     │
                     ├──────────▶ FAILED (失败)
                     │
                     └──────────▶ (24h无裁判也是失败)
```

| 状态 | 英文 | 触发条件 | Credit 处理 |
|------|------|----------|-------------|
| 进行中 | ACTIVE | 创建预测后立即 | 已扣除，锁定中 |
| 判定中 | JUDGING | 到期/用户主动触发 | 锁定中 |
| 成功 | SUCCESS | 裁判投票 >50% 同意 | 返还用户 |
| 失败 | FAILED | 裁判投票 ≤50% 同意 / 24h无裁判 | 进入恢复或没收 |

### 3.2 用户状态

```
┌──────────┐         ┌──────────┐
│   IDLE   │◀───────▶│ RECOVERY │
│  (空闲)   │         │ (恢复中)  │
└──────────┘         └──────────┘
```

| 状态 | 说明 |
|------|------|
| IDLE | 可以创建新预测 |
| RECOVERY | 恢复模式中，需完成恢复预测 |

### 3.3 完整流转图

```
┌─────────────────────────────────────────────────────────────────┐
│                          创建预测                                │
│                    (扣除 Stake Credit)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ACTIVE（进行中）                            │
│   - 用户分享 Referee Code                                       │
│   - 用户可上传打卡证明（可选）                                    │
│   - 等待截止时间                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ 到期 / 用户主动触发
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JUDGING（判定中）                           │
│   - 检查是否有裁判                                               │
│   - 有裁判：等待投票（24h）                                       │
│   - 无裁判：等待加入（24h）                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    24h 无裁判        裁判投票完成       24h 未投票
         │                 │                 │
         ▼                 │                 ▼
    ┌──────────┐           │           视为全部同意
    │  FAILED  │           │                 │
    │ (无裁判)  │           │                 │
    └──────────┘           │                 │
                           │                 │
              ┌────────────┴────────────┐    │
              │                         │    │
          >50% 同意                 ≤50% 同意 │
              │                         │    │
              ▼                         ▼    │
       ┌──────────┐              ┌──────────┐│
       │ SUCCESS  │              │  FAILED  │◀┘
       │ 返还Credit│              └────┬─────┘
       └──────────┘                   │
              │                       │
              │         ┌─────────────┴─────────────┐
              │         │                           │
              │     首次失败                    恢复中失败
              │         │                           │
              │         ▼                           ▼
              │   进入 RECOVERY               💀 Credit 没收
              │   (需连续成功2次)              用户回到 IDLE
              │         │
              │         │ 设定新预测（不需要再质押）
              │         │ 共用原 Referee Code
              │         ▼
              │   ┌───────────┐
              │   │  ACTIVE   │
              │   │(恢复预测1) │
              │   └─────┬─────┘
              │         │
              │    成功/失败
              │         │
              │   ┌─────┴─────┐
              │   │           │
              │ 成功        失败
              │   │           │
              │   ▼           ▼
              │ 进度1/2    💀没收
              │   │
              │   │ 设定新预测
              │   ▼
              │ ┌───────────┐
              │ │  ACTIVE   │
              │ │(恢复预测2) │
              │ └─────┬─────┘
              │       │
              │  成功/失败
              │       │
              │ ┌─────┴─────┐
              │ │           │
              │成功        失败
              │ │           │
              │ ▼           ▼
              │返还Credit  💀没收
              │ │
              └─┴─▶ 用户回到 IDLE
```

---

## 4. 技术架构

### 4.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 包管理 | pnpm | 快速、节省磁盘 |
| 客户端 | React Native (Expo) | 跨平台移动应用 |
| 路由 | Expo Router | 文件系统路由 |
| UI | NativeWind | Tailwind CSS for RN |
| 状态管理 | Zustand | 轻量级状态管理 |
| 后端 | Supabase | BaaS 平台 |
| 数据库 | PostgreSQL | Supabase 托管 |
| 认证 | Supabase Auth | 多种登录方式 |
| 存储 | Supabase Storage | 图片存储 |
| 定时任务 | pg_cron | 数据库定时任务 |
| 支付 | Stripe / 微信支付 | 根据地区切换 |
| 深度链接 | Firebase Dynamic Links | 智能链接 |

### 4.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native App (Expo)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Screens: Home | Prediction | Profile | Referee           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  State: Zustand (user, prediction, recovery)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Platform                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Auth     │  │  Database   │  │   Storage   │             │
│  │  (登录认证)  │  │ (PostgreSQL)│  │  (图片存储)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   pg_cron   │  │    Edge     │                              │
│  │  (定时任务)  │  │  Functions  │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Stripe    │  │  微信支付    │  │  Firebase   │             │
│  │  (国际支付)  │  │  (国内支付)  │  │ Dynamic Links│            │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 项目结构

```
aura/
├── app/                          # Expo Router 页面
│   ├── (auth)/                   # 认证页面组
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # 主 Tab 页面组
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # 首页
│   │   ├── prediction.tsx        # 预测页
│   │   └── profile.tsx           # 我的页
│   ├── (screens)/                # 其他页面
│   │   ├── prediction/[id].tsx   # 预测详情
│   │   ├── create.tsx            # 创建预测
│   │   ├── share.tsx             # 分享页
│   │   ├── recharge.tsx          # 充值页
│   │   ├── history.tsx           # 历史记录
│   │   ├── payments.tsx          # 充值记录
│   │   └── settings.tsx          # 设置页
│   ├── referee/                  # 裁判相关
│   │   ├── [code].tsx            # 裁判入口
│   │   └── vote/[id].tsx         # 投票页
│   ├── _layout.tsx               # 根布局
│   └── +not-found.tsx
├── components/                   # 组件
│   ├── ui/                       # 基础 UI
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── prediction/               # 预测相关
│   │   ├── PredictionCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Countdown.tsx
│   │   └── RefereeList.tsx
│   ├── home/                     # 首页相关
│   │   ├── BalanceCard.tsx
│   │   ├── ActivePrediction.tsx
│   │   └── RecoveryBanner.tsx
│   └── shared/                   # 共享组件
│       ├── Header.tsx
│       ├── TabBar.tsx
│       └── Avatar.tsx
├── lib/                          # 工具库
│   ├── supabase.ts               # Supabase 客户端
│   ├── constants.ts              # 常量
│   ├── utils.ts                  # 工具函数
│   ├── region.ts                 # 地区检测
│   └── validations.ts            # 数据验证
├── services/                     # 业务逻辑
│   ├── auth.service.ts
│   ├── prediction.service.ts
│   ├── referee.service.ts
│   ├── recovery.service.ts
│   ├── payment.service.ts
│   └── checkin.service.ts
├── stores/                       # Zustand Store
│   ├── useUserStore.ts
│   ├── usePredictionStore.ts
│   └── useRecoveryStore.ts
├── hooks/                        # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useCountdown.ts
│   ├── useRegion.ts
│   └── usePolling.ts
├── types/                        # TypeScript 类型
│   ├── index.ts
│   └── database.types.ts
├── supabase/                     # Supabase 配置
│   ├── migrations/               # 数据库迁移
│   ├── functions/                # Edge Functions
│   └── seed.sql
├── assets/                       # 静态资源
├── app.json
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── .env
```

---

## 5. 数据库设计

### 5.1 ER 图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │ predictions  │       │   referees   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ email        │  │    │ user_id (FK) │◀─┤    │ prediction_id│◀─┐
│ phone        │  │    │ title        │  │    │ user_id (FK) │  │
│ credit_balance│  └───▶│ deadline     │  │    │ vote         │  │
│ status       │       │ stake        │  │    │ voted_at     │  │
│ region       │       │ status       │  │    │ joined_at    │  │
│ created_at   │       │ referee_code │  │    └──────────────┘  │
└──────────────┘       │ created_at   │  │                      │
                       │ judging_at   │  │    ┌──────────────┐  │
                       │ settled_at   │  │    │  check_ins   │  │
                       └──────────────┘  │    ├──────────────┤  │
                              │          │    │ id (PK)      │  │
                              │          └───▶│ prediction_id│──┘
┌──────────────┐              │               │ type         │
│  recoveries  │              │               │ content      │
├──────────────┤              │               │ image_url    │
│ id (PK)      │              │               │ created_at   │
│ user_id (FK) │◀─────────────┘               └──────────────┘
│ stake        │
│ referee_code │              ┌──────────────┐
│ progress     │              │ transactions │
│ status       │              ├──────────────┤
│ created_at   │              │ id (PK)      │
└──────────────┘              │ user_id (FK) │
                              │ type         │
                              │ amount       │
                              │ prediction_id│
                              │ created_at   │
                              └──────────────┘
```

### 5.2 SQL Schema

```sql
-- ============================================
-- 用户表
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'RECOVERY')),
  region TEXT NOT NULL DEFAULT 'global' CHECK (region IN ('global', 'cn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- ============================================
-- 预测表
-- ============================================
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recovery_id UUID REFERENCES public.recoveries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  stake INTEGER NOT NULL CHECK (stake >= 10 AND stake <= 1000),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'JUDGING', 'SUCCESS', 'FAILED')),
  referee_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  judging_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ
);

-- ============================================
-- 恢复记录表
-- ============================================
CREATE TABLE public.recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  original_prediction_id UUID NOT NULL REFERENCES public.predictions(id),
  stake INTEGER NOT NULL,
  referee_code TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 2),
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'RECOVERED', 'FORFEITED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 裁判表
-- ============================================
CREATE TABLE public.referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote TEXT CHECK (vote IN ('YES', 'NO')),
  voted_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(prediction_id, user_id)
);

-- ============================================
-- 打卡记录表
-- ============================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('TEXT', 'IMAGE')),
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 交易记录表
-- ============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('RECHARGE', 'STAKE', 'REFUND', 'FORFEIT', 'RECOVERY')),
  amount INTEGER NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX idx_predictions_status ON public.predictions(status);
CREATE INDEX idx_predictions_referee_code ON public.predictions(referee_code);
CREATE INDEX idx_referees_prediction_id ON public.referees(prediction_id);
CREATE INDEX idx_referees_user_id ON public.referees(user_id);
CREATE INDEX idx_check_ins_prediction_id ON public.check_ins(prediction_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_recoveries_user_id ON public.recoveries(user_id);

-- ============================================
-- RLS 策略
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users: 只能访问自己
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Predictions: 自己的 + 作为裁判的
CREATE POLICY "Users can view own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view as referee" ON public.predictions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.referees WHERE prediction_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Referees: 相关预测的参与者可见
CREATE POLICY "Referees visible to participants" ON public.referees
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.predictions WHERE id = prediction_id
      UNION
      SELECT user_id FROM public.referees WHERE prediction_id = referees.prediction_id
    )
  );
CREATE POLICY "Users can join as referee" ON public.referees
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Referees can vote" ON public.referees
  FOR UPDATE USING (auth.uid() = user_id);

-- Check-ins: 相关预测的参与者可见
CREATE POLICY "Check-ins visible to participants" ON public.check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.predictions p
      WHERE p.id = prediction_id AND (
        p.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.referees r WHERE r.prediction_id = p.id AND r.user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Users can create check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.predictions WHERE id = prediction_id AND user_id = auth.uid())
  );

-- Transactions: 只能看自己的
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Recoveries: 只能看自己的
CREATE POLICY "Users can view own recoveries" ON public.recoveries
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recoveries_updated_at
  BEFORE UPDATE ON public.recoveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 新用户初始化
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.3 数据库函数

```sql
-- ============================================
-- 创建预测
-- ============================================
CREATE OR REPLACE FUNCTION public.create_prediction(
  p_title TEXT,
  p_description TEXT,
  p_deadline TIMESTAMPTZ,
  p_stake INTEGER,
  p_recovery_id UUID DEFAULT NULL
)
RETURNS public.predictions AS $$
DECLARE
  v_user public.users;
  v_prediction public.predictions;
  v_referee_code TEXT;
  v_recovery public.recoveries;
BEGIN
  -- 获取用户
  SELECT * INTO v_user FROM public.users WHERE id = auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 检查是否已有进行中的预测
  IF EXISTS (
    SELECT 1 FROM public.predictions 
    WHERE user_id = auth.uid() AND status IN ('ACTIVE', 'JUDGING')
  ) THEN
    RAISE EXCEPTION 'Already have an active prediction';
  END IF;

  -- 如果是恢复模式
  IF p_recovery_id IS NOT NULL THEN
    SELECT * INTO v_recovery FROM public.recoveries WHERE id = p_recovery_id AND user_id = auth.uid();
    IF v_recovery IS NULL THEN
      RAISE EXCEPTION 'Recovery not found';
    END IF;
    IF v_recovery.status != 'IN_PROGRESS' THEN
      RAISE EXCEPTION 'Recovery not in progress';
    END IF;
    v_referee_code := v_recovery.referee_code;
  ELSE
    -- 普通模式：检查余额
    IF v_user.credit_balance < p_stake THEN
      RAISE EXCEPTION 'Insufficient credit';
    END IF;
    -- 生成新的裁判码
    v_referee_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;

  -- 创建预测
  INSERT INTO public.predictions (user_id, recovery_id, title, description, deadline, stake, referee_code)
  VALUES (auth.uid(), p_recovery_id, p_title, p_description, p_deadline, p_stake, v_referee_code)
  RETURNING * INTO v_prediction;

  -- 如果不是恢复模式，扣除 Credit
  IF p_recovery_id IS NULL THEN
    UPDATE public.users
    SET credit_balance = credit_balance - p_stake, updated_at = NOW()
    WHERE id = auth.uid();

    INSERT INTO public.transactions (user_id, type, amount, prediction_id, description)
    VALUES (auth.uid(), 'STAKE', -p_stake, v_prediction.id, '预测质押');
  END IF;

  RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 触发判定
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_judging(p_prediction_id UUID)
RETURNS public.predictions AS $$
DECLARE
  v_prediction public.predictions;
BEGIN
  SELECT * INTO v_prediction FROM public.predictions 
  WHERE id = p_prediction_id AND user_id = auth.uid();
  
  IF v_prediction IS NULL THEN
    RAISE EXCEPTION 'Prediction not found';
  END IF;
  
  IF v_prediction.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Prediction not active';
  END IF;

  UPDATE public.predictions
  SET status = 'JUDGING', judging_at = NOW()
  WHERE id = p_prediction_id
  RETURNING * INTO v_prediction;

  RETURN v_prediction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 裁判投票
-- ============================================
CREATE OR REPLACE FUNCTION public.cast_vote(
  p_prediction_id UUID,
  p_vote TEXT
)
RETURNS public.referees AS $$
DECLARE
  v_referee public.referees;
  v_prediction public.predictions;
BEGIN
  -- 检查预测状态
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id;
  IF v_prediction IS NULL OR v_prediction.status != 'JUDGING' THEN
    RAISE EXCEPTION 'Prediction not in judging status';
  END IF;

  -- 检查是否是裁判
  SELECT * INTO v_referee FROM public.referees 
  WHERE prediction_id = p_prediction_id AND user_id = auth.uid();
  IF v_referee IS NULL THEN
    RAISE EXCEPTION 'Not a referee';
  END IF;

  -- 检查是否已投票
  IF v_referee.vote IS NOT NULL THEN
    RAISE EXCEPTION 'Already voted';
  END IF;

  -- 投票
  UPDATE public.referees
  SET vote = p_vote, voted_at = NOW()
  WHERE prediction_id = p_prediction_id AND user_id = auth.uid()
  RETURNING * INTO v_referee;

  -- 检查是否所有人都投票了，如果是则结算
  PERFORM public.check_and_settle(p_prediction_id);

  RETURN v_referee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 检查并结算
-- ============================================
CREATE OR REPLACE FUNCTION public.check_and_settle(p_prediction_id UUID)
RETURNS VOID AS $$
DECLARE
  v_prediction public.predictions;
  v_total_referees INTEGER;
  v_voted_count INTEGER;
  v_yes_count INTEGER;
  v_success BOOLEAN;
  v_user public.users;
  v_recovery public.recoveries;
BEGIN
  SELECT * INTO v_prediction FROM public.predictions WHERE id = p_prediction_id;
  
  -- 统计投票
  SELECT COUNT(*), COUNT(vote), COUNT(CASE WHEN vote = 'YES' THEN 1 END)
  INTO v_total_referees, v_voted_count, v_yes_count
  FROM public.referees WHERE prediction_id = p_prediction_id;

  -- 如果没有裁判，不处理（等定时任务）
  IF v_total_referees = 0 THEN
    RETURN;
  END IF;

  -- 如果还有人没投票，不处理
  IF v_voted_count < v_total_referees THEN
    RETURN;
  END IF;

  -- 判定结果：同意 > 50%
  v_success := (v_yes_count::FLOAT / v_total_referees) > 0.5;

  IF v_success THEN
    -- 成功
    UPDATE public.predictions
    SET status = 'SUCCESS', settled_at = NOW()
    WHERE id = p_prediction_id;

    -- 处理恢复模式
    IF v_prediction.recovery_id IS NOT NULL THEN
      SELECT * INTO v_recovery FROM public.recoveries WHERE id = v_prediction.recovery_id;
      
      IF v_recovery.progress + 1 >= 2 THEN
        -- 恢复成功
        UPDATE public.recoveries
        SET progress = 2, status = 'RECOVERED', updated_at = NOW()
        WHERE id = v_prediction.recovery_id;

        UPDATE public.users
        SET credit_balance = credit_balance + v_recovery.stake, status = 'IDLE', updated_at = NOW()
        WHERE id = v_prediction.user_id;

        INSERT INTO public.transactions (user_id, type, amount, prediction_id, description)
        VALUES (v_prediction.user_id, 'RECOVERY', v_recovery.stake, p_prediction_id, '恢复成功');
      ELSE
        -- 进度 +1
        UPDATE public.recoveries
        SET progress = progress + 1, updated_at = NOW()
        WHERE id = v_prediction.recovery_id;
      END IF;
    ELSE
      -- 普通预测成功，返还 Credit
      UPDATE public.users
      SET credit_balance = credit_balance + v_prediction.stake, updated_at = NOW()
      WHERE id = v_prediction.user_id;

      INSERT INTO public.transactions (user_id, type, amount, prediction_id, description)
      VALUES (v_prediction.user_id, 'REFUND', v_prediction.stake, p_prediction_id, '预测成功');
    END IF;
  ELSE
    -- 失败
    UPDATE public.predictions
    SET status = 'FAILED', settled_at = NOW()
    WHERE id = p_prediction_id;

    -- 处理恢复模式
    IF v_prediction.recovery_id IS NOT NULL THEN
      -- 恢复失败，没收 Credit
      UPDATE public.recoveries
      SET status = 'FORFEITED', updated_at = NOW()
      WHERE id = v_prediction.recovery_id;

      UPDATE public.users
      SET status = 'IDLE', updated_at = NOW()
      WHERE id = v_prediction.user_id;

      SELECT * INTO v_recovery FROM public.recoveries WHERE id = v_prediction.recovery_id;
      INSERT INTO public.transactions (user_id, type, amount, prediction_id, description)
      VALUES (v_prediction.user_id, 'FORFEIT', -v_recovery.stake, p_prediction_id, '恢复失败，没收');
    ELSE
      -- 首次失败，进入恢复模式
      INSERT INTO public.recoveries (user_id, original_prediction_id, stake, referee_code)
      VALUES (v_prediction.user_id, p_prediction_id, v_prediction.stake, v_prediction.referee_code);

      UPDATE public.users
      SET status = 'RECOVERY', updated_at = NOW()
      WHERE id = v_prediction.user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 定时任务：处理超时
-- ============================================
CREATE OR REPLACE FUNCTION public.process_timeouts()
RETURNS VOID AS $$
DECLARE
  v_prediction RECORD;
  v_referee_count INTEGER;
BEGIN
  -- 处理 ACTIVE 状态超时（自动进入 JUDGING）
  FOR v_prediction IN
    SELECT * FROM public.predictions
    WHERE status = 'ACTIVE' AND deadline < NOW()
  LOOP
    UPDATE public.predictions
    SET status = 'JUDGING', judging_at = NOW()
    WHERE id = v_prediction.id;
  END LOOP;

  -- 处理 JUDGING 状态超时（24h）
  FOR v_prediction IN
    SELECT * FROM public.predictions
    WHERE status = 'JUDGING' AND judging_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- 检查是否有裁判
    SELECT COUNT(*) INTO v_referee_count FROM public.referees WHERE prediction_id = v_prediction.id;
    
    IF v_referee_count = 0 THEN
      -- 无裁判，判定失败
      UPDATE public.predictions
      SET status = 'FAILED', settled_at = NOW()
      WHERE id = v_prediction.id;

      -- 处理恢复模式或首次失败
      IF v_prediction.recovery_id IS NOT NULL THEN
        UPDATE public.recoveries
        SET status = 'FORFEITED', updated_at = NOW()
        WHERE id = v_prediction.recovery_id;

        UPDATE public.users
        SET status = 'IDLE', updated_at = NOW()
        WHERE id = v_prediction.user_id;
      ELSE
        INSERT INTO public.recoveries (user_id, original_prediction_id, stake, referee_code)
        VALUES (v_prediction.user_id, v_prediction.id, v_prediction.stake, v_prediction.referee_code);

        UPDATE public.users
        SET status = 'RECOVERY', updated_at = NOW()
        WHERE id = v_prediction.user_id;
      END IF;
    ELSE
      -- 有裁判但超时未投票，未投票算同意
      UPDATE public.referees
      SET vote = 'YES', voted_at = NOW()
      WHERE prediction_id = v_prediction.id AND vote IS NULL;

      -- 重新结算
      PERFORM public.check_and_settle(v_prediction.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 设置定时任务（每分钟执行）
-- ============================================
SELECT cron.schedule('process-timeouts', '* * * * *', 'SELECT public.process_timeouts()');
```

---

## 6. API 设计

### 6.1 Supabase RPC 函数

| 函数 | 参数 | 说明 |
|------|------|------|
| `create_prediction` | title, description, deadline, stake, recovery_id? | 创建预测 |
| `trigger_judging` | prediction_id | 触发判定 |
| `cast_vote` | prediction_id, vote | 裁判投票 |
| `join_as_referee` | referee_code | 加入成为裁判 |
| `recharge_credit` | amount, payment_id, provider | 充值（由 webhook 调用）|

### 6.2 数据查询

```typescript
// 获取当前预测
const { data } = await supabase
  .from('predictions')
  .select('*, referees(*), check_ins(*)')
  .eq('user_id', userId)
  .in('status', ['ACTIVE', 'JUDGING'])
  .single();

// 获取恢复状态
const { data } = await supabase
  .from('recoveries')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'IN_PROGRESS')
  .single();

// 通过 Code 获取预测（裁判用）
const { data } = await supabase
  .from('predictions')
  .select('*, referees(*), check_ins(*), users!inner(name, avatar_url)')
  .eq('referee_code', code)
  .single();
```

---

## 7. 页面结构

### 7.1 页面清单

```
认证：
├── /login              登录页
└── /register           注册页

Tab 页面：
├── /                   首页 (Home)
├── /prediction         预测页
└── /profile            我的页

其他页面：
├── /create             创建预测
├── /prediction/[id]    预测详情
├── /share              分享页
├── /recharge           充值页
├── /history            历史记录
├── /payments           充值记录
└── /settings           设置页

裁判相关：
├── /referee/[code]     裁判入口
└── /referee/vote/[id]  投票页
```

### 7.2 页面设计

#### 首页 - 空闲状态
```
┌─────────────────────────────────────────┐
│ [👤]                          Aura      │
├─────────────────────────────────────────┤
│                                         │
│              💰                         │
│           100 Credit                    │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │    预测你的下一个成就             │   │
│   │                                 │   │
│   │    ┌─────────────────────┐     │   │
│   │    │    创建预测          │     │   │
│   │    └─────────────────────┘     │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│        🏠            🎯            👤    │
│       首页          预测          我的    │
└─────────────────────────────────────────┘
```

#### 首页 - 进行中
```
┌─────────────────────────────────────────┐
│ [👤]                          Aura      │
├─────────────────────────────────────────┤
│                                         │
│              💰                         │
│            80 Credit                    │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  ● ACTIVE                       │   │
│   │                                 │   │
│   │  完成项目报告                    │   │
│   │                                 │   │
│   │  ⏰ 2天 14:32:18                │   │
│   │  👥 2 位裁判                    │   │
│   │  💵 20 Credit                   │   │
│   │                                 │   │
│   │  ┌──────────┐  ┌──────────┐    │   │
│   │  │   打卡    │  │ 邀请裁判  │    │   │
│   │  └──────────┘  └──────────┘    │   │
│   └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│        🏠            🎯            👤    │
└─────────────────────────────────────────┘
```

#### 首页 - 恢复模式
```
┌─────────────────────────────────────────┐
│ [👤]                          Aura      │
├─────────────────────────────────────────┤
│                                         │
│         💰 80        🔒 20              │
│        可用         恢复中              │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  ⚠️ 恢复模式                     │   │
│   │                                 │   │
│   │  上次预测失败                    │   │
│   │  连续成功 2 次可恢复 20 Credit    │   │
│   │                                 │   │
│   │  进度  ● ○                      │   │
│   │        1/2                      │   │
│   │                                 │   │
│   │  ┌─────────────────────┐       │   │
│   │  │     设定新预测       │       │   │
│   │  └─────────────────────┘       │   │
│   └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│        🏠            🎯            👤    │
└─────────────────────────────────────────┘
```

#### 我的页面
```
┌─────────────────────────────────────────┐
│                 我的                     │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  👤  用户名                      │   │
│   │      user@email.com             │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  💰 100 Credit       [充值]     │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ─────────────────────────────────     │
│                                         │
│   💳 充值记录                       →   │
│   📋 预测记录                       →   │
│   ⚙️ 设置                          →   │
│   ❓ 帮助与反馈                     →   │
│                                         │
│   ─────────────────────────────────     │
│                                         │
│   退出登录                              │
│                                         │
├─────────────────────────────────────────┤
│        🏠            🎯            👤    │
└─────────────────────────────────────────┘
```

---

## 8. 支付集成

### 8.1 Stripe (国际版)

```typescript
// Edge Function: stripe-checkout
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: 'Aura Credit' },
      unit_amount: amount * 100,
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: `${APP_URL}/recharge/success`,
  cancel_url: `${APP_URL}/recharge/cancel`,
  metadata: { userId, credit: amount * 10 },
});

// Edge Function: stripe-webhook
if (event.type === 'checkout.session.completed') {
  const { userId, credit } = session.metadata;
  await supabase.rpc('recharge_credit', {
    p_user_id: userId,
    p_amount: parseInt(credit),
    p_payment_id: session.id,
    p_provider: 'stripe',
  });
}
```

### 8.2 微信支付 (国内版)

```typescript
// Edge Function: wechat-pay
// 创建预支付订单，返回支付参数给客户端

// Edge Function: wechat-webhook
// 处理支付回调，更新 Credit
```

---

## 9. 推送与链接

### 9.1 Firebase Dynamic Links

```
链接格式：
https://aura.page.link/r/X7K9

行为：
- 已安装 App → 打开 App，跳转到 /referee/X7K9
- 未安装 App → 跳转应用商店，安装后打开对应页面
```

### 9.2 应用内通知（MVP）

MVP 阶段只做应用内通知，不做推送：
- 轮询检查状态变化
- 弹窗提示重要事件

---

## 10. 国际化

### 10.1 地区检测

```typescript
// lib/region.ts
export async function detectRegion(): Promise<'global' | 'cn'> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code === 'CN' ? 'cn' : 'global';
  } catch {
    return 'global';
  }
}
```

### 10.2 地区差异

| 项目 | 国际版 (global) | 国内版 (cn) |
|------|----------------|-------------|
| 品牌名 | Aura | 诺值 |
| 货币 | USD ($) | CNY (¥) |
| 汇率 | $1 = 10 Credit | ¥1 = 1 Credit |
| 登录方式 | Google + 邮箱 | 微信 + 手机号 |
| 支付方式 | Stripe | 微信支付 |
| 语言 | English | 中文 |

---

## 11. 开发计划

### Phase 1: 基础框架（Week 1）
- [ ] 项目初始化 (pnpm + Expo)
- [ ] Supabase 配置
- [ ] 数据库迁移
- [ ] 基础 UI 组件

### Phase 2: 认证系统（Week 2）
- [ ] 登录/注册页面
- [ ] Google 登录（国际）
- [ ] 手机验证码登录（国内）
- [ ] 地区检测

### Phase 3: 预测流程（Week 3-4）
- [ ] 创建预测
- [ ] 预测详情
- [ ] 状态流转
- [ ] 裁判投票
- [ ] 恢复模式

### Phase 4: 支付系统（Week 5）
- [ ] Stripe 集成
- [ ] 微信支付集成
- [ ] 充值页面
- [ ] 交易记录

### Phase 5: 社交分享（Week 6）
- [ ] 分享页面
- [ ] Dynamic Links
- [ ] 裁判入口页

### Phase 6: 优化上线（Week 7-8）
- [ ] UI 优化
- [ ] 测试
- [ ] Bug 修复
- [ ] 上线

