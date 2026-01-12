# Aura UI 设计规范 2026

## 🎨 设计理念

基于2026年最前沿的UI设计趋势，本规范融合了以下核心理念：

### 1. 液态玻璃美学 (Liquid Glass Aesthetic)
- 半透明毛玻璃效果，营造深度与层次感
- 动态光影变化，响应用户交互
- 微妙的折射和反射效果

### 2. 极光渐变系统 (Aurora Gradient System)
- 多色彩极光渐变背景
- 动态流动的色彩过渡
- 冷暖色调的精妙平衡

### 3. 情感化微交互 (Emotional Micro-interactions)
- 精心设计的触觉反馈
- 流畅的状态转换动画
- 有意义的加载和成功动画

### 4. 新拟物设计 (Neumorphism 2.0)
- 柔和的凸起和凹陷效果
- 真实的光影投射
- 与玻璃拟态的完美融合

---

## 🌈 色彩系统

### 主色调 - 极光紫 (Aurora Violet)
```
Primary:
  50:  #faf5ff  (极淡紫)
  100: #f3e8ff  (淡紫)
  200: #e9d5ff  (浅紫)
  300: #d8b4fe  (柔紫)
  400: #c084fc  (中紫)
  500: #a855f7  (标准紫)
  600: #9333ea  (深紫)
  700: #7e22ce  (暗紫)
  800: #6b21a8  (重紫)
  900: #581c87  (极暗紫)
```

### 辅助色 - 极光青 (Aurora Cyan)
```
Cyan:
  300: #67e8f9
  400: #22d3ee
  500: #06b6d4
  600: #0891b2
```

### 强调色 - 极光粉 (Aurora Pink)
```
Pink:
  300: #f9a8d4
  400: #f472b6
  500: #ec4899
  600: #db2777
```

### 功能色
```
Success:  #10b981 (翡翠绿)
Warning:  #f59e0b (琥珀橙)
Error:    #ef4444 (珊瑚红)
Info:     #3b82f6 (天际蓝)
```

### 暗黑模式色阶
```
Background:
  base:     #030712  (深空黑)
  elevated: #0f172a  (提升层)
  surface:  #1e293b  (表面层)
  
Surface:
  50:  rgba(255, 255, 255, 0.02)
  100: rgba(255, 255, 255, 0.04)
  200: rgba(255, 255, 255, 0.06)
  300: rgba(255, 255, 255, 0.08)
  400: rgba(255, 255, 255, 0.12)
  500: rgba(255, 255, 255, 0.16)

Border:
  subtle:  rgba(255, 255, 255, 0.06)
  default: rgba(255, 255, 255, 0.10)
  strong:  rgba(255, 255, 255, 0.16)

Text:
  primary:   #f8fafc (雪白)
  secondary: #94a3b8 (银灰)
  tertiary:  #64748b (暗银)
  muted:     #475569 (深灰)
```

---

## 🔮 玻璃拟态效果

### 标准玻璃卡片
```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

### 高亮玻璃卡片
```css
.glass-card-highlight {
  background: linear-gradient(
    135deg,
    rgba(168, 85, 247, 0.08) 0%,
    rgba(6, 182, 212, 0.05) 50%,
    rgba(236, 72, 153, 0.08) 100%
  );
  backdrop-filter: blur(24px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 28px;
  box-shadow: 
    0 12px 40px rgba(168, 85, 247, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### 凹陷玻璃效果
```css
.glass-inset {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
}
```

---

## ✨ 渐变系统

### 极光背景渐变
```css
.aurora-bg {
  background: 
    radial-gradient(ellipse at 20% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 0%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #030712 0%, #0f172a 100%);
}
```

### 主按钮渐变
```css
.btn-primary-gradient {
  background: linear-gradient(
    135deg,
    #a855f7 0%,
    #9333ea 50%,
    #7e22ce 100%
  );
  box-shadow: 
    0 4px 20px rgba(168, 85, 247, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3);
}

.btn-primary-gradient:active {
  background: linear-gradient(
    135deg,
    #9333ea 0%,
    #7e22ce 50%,
    #6b21a8 100%
  );
  transform: scale(0.98);
}
```

### 成功状态渐变
```css
.gradient-success {
  background: linear-gradient(
    135deg,
    #10b981 0%,
    #059669 100%
  );
}
```

### 警告状态渐变
```css
.gradient-warning {
  background: linear-gradient(
    135deg,
    #f59e0b 0%,
    #d97706 100%
  );
}
```

---

## 📐 间距系统

### 基础间距 (4px 基准)
```
spacing-0:  0px
spacing-1:  4px
spacing-2:  8px
spacing-3:  12px
spacing-4:  16px
spacing-5:  20px
spacing-6:  24px
spacing-8:  32px
spacing-10: 40px
spacing-12: 48px
spacing-16: 64px
spacing-20: 80px
```

### 组件内间距
- 按钮内边距: 16px 24px (md) / 20px 32px (lg)
- 卡片内边距: 20px - 24px
- 输入框内边距: 16px
- 列表项间距: 12px

### 布局间距
- 屏幕边距: 24px
- 区块间距: 24px - 32px
- 标题与内容间距: 16px

---

## 🔤 字体系统

### 字体家族
```
Primary: 'SF Pro Display', 'Inter', system-ui, sans-serif
Mono: 'SF Mono', 'JetBrains Mono', monospace
```

### 字体层级
```
Display XL:   36px / 44px / -0.02em / 800
Display:      32px / 40px / -0.02em / 700
Heading 1:    28px / 36px / -0.01em / 700
Heading 2:    24px / 32px / -0.01em / 600
Heading 3:    20px / 28px / 0 / 600
Body Large:   18px / 28px / 0 / 400
Body:         16px / 24px / 0 / 400
Body Small:   14px / 20px / 0 / 400
Caption:      12px / 16px / 0.01em / 400
Overline:     11px / 16px / 0.08em / 600 / UPPERCASE
```

---

## 🌊 动画系统

### 过渡曲线
```css
/* 标准过渡 - 用于大多数交互 */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* 减速过渡 - 用于进入动画 */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* 加速过渡 - 用于退出动画 */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

/* 弹性过渡 - 用于强调动画 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 持续时间
```
instant:  100ms  (微交互反馈)
fast:     150ms  (按钮状态)
normal:   200ms  (标准过渡)
slow:     300ms  (复杂动画)
slower:   500ms  (页面过渡)
```

### 常用动画
```css
/* 按钮按下效果 */
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.96); }
  100% { transform: scale(1); }
}

/* 脉冲发光效果 */
@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
  }
  50% { 
    box-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
  }
}

/* 渐入上浮 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 闪烁光效 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 🎯 组件规范

### 按钮 (Button)

#### Primary Button
- 背景: 极光紫渐变
- 圆角: 16px
- 高度: 48px (md) / 56px (lg)
- 文字: 白色, 600 weight
- 阴影: 紫色光晕
- Hover: 亮度提升 + 阴影扩大
- Active: 按下缩放 0.98

#### Secondary Button
- 背景: 玻璃效果 rgba(255,255,255,0.06)
- 边框: 1px rgba(255,255,255,0.1)
- 圆角: 16px
- 文字: 白色, 500 weight

#### Ghost Button
- 背景: 透明
- 文字: 主色调
- Hover: 微弱背景色

### 卡片 (Card)

#### Standard Card
- 背景: 玻璃效果
- 圆角: 24px
- 内边距: 20px - 24px
- 边框: 微弱白色边框
- 阴影: 多层阴影营造深度

#### Highlight Card
- 带有极光渐变边框
- 内发光效果
- 用于重要信息展示

#### Interactive Card
- 添加 hover 效果
- 轻微上浮 + 阴影增强
- 边框高亮

### 输入框 (Input)

#### Standard Input
- 背景: 凹陷玻璃效果
- 圆角: 14px
- 高度: 52px
- 边框: 默认暗色, 聚焦时主色调
- 占位符: 暗灰色
- 聚焦: 外发光效果

### 状态指示器

#### Active Status
- 颜色: #10b981 (翡翠绿)
- 脉冲动画
- 发光效果

#### Warning Status
- 颜色: #f59e0b (琥珀橙)
- 呼吸动画

#### Error Status
- 颜色: #ef4444 (珊瑚红)
- 闪烁效果

---

## 📱 响应式断点

```
Mobile:   < 640px
Tablet:   640px - 1024px
Desktop:  > 1024px
```

---

## ♿ 无障碍设计

### 对比度要求
- 正文文字: 最低 4.5:1
- 大标题: 最低 3:1
- 图标和图形: 最低 3:1

### 触摸目标
- 最小尺寸: 44px × 44px
- 推荐尺寸: 48px × 48px

### 焦点状态
- 清晰的焦点环
- 主色调发光效果
- 不依赖颜色传达信息

---

## 🎨 图标系统

### 图标规格
- 尺寸: 20px / 24px / 28px / 32px
- 线宽: 1.5px - 2px
- 风格: 圆润线性图标
- 颜色: 继承父元素或指定色

### 推荐图标库
- Ionicons (当前使用)
- Lucide React
- Phosphor Icons

---

## 💎 特殊效果

### 光晕效果 (Glow)
```css
.glow-primary {
  box-shadow: 
    0 0 20px rgba(168, 85, 247, 0.3),
    0 0 40px rgba(168, 85, 247, 0.2),
    0 0 60px rgba(168, 85, 247, 0.1);
}
```

### 霓虹边框
```css
.neon-border {
  border: 1px solid transparent;
  background: 
    linear-gradient(#030712, #030712) padding-box,
    linear-gradient(135deg, #a855f7, #06b6d4, #ec4899) border-box;
}
```

### 网格背景
```css
.grid-bg {
  background-image: 
    linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

---

## 🚀 性能优化

### 动画性能
- 优先使用 transform 和 opacity
- 避免布局抖动
- 使用 will-change 提示

### 渲染优化
- 简化阴影层数
- 合理使用 blur 效果
- 懒加载非关键动画

---

## 📋 实施清单

### Phase 1: 基础设施
- [ ] 更新 Tailwind 配置
- [ ] 创建全局 CSS 变量
- [ ] 定义动画关键帧

### Phase 2: 组件升级
- [ ] Button 组件重构
- [ ] Card 组件重构
- [ ] Input 组件重构
- [ ] 创建 GlassCard 组件

### Phase 3: 页面升级
- [ ] 首页界面升级
- [ ] 创建预测页面升级
- [ ] 个人资料页面升级
- [ ] 裁判页面升级

### Phase 4: 微交互
- [ ] 添加按钮动画
- [ ] 添加卡片悬浮效果
- [ ] 添加页面过渡动画
- [ ] 添加加载状态动画

---

*文档版本: 1.0*
*创建日期: 2026-01-11*
*适用项目: Aura*

