import { Region } from './region';

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // App
    'app.name': 'Aura',
    'app.tagline': 'Predict your behavior, stake your commitment',

    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Sign Up',
    'auth.logout': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.displayName': 'Display Name',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.continueWithWechat': 'Continue with WeChat',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.optional': '(optional)',

    // Home
    'home.welcome': 'Welcome back',
    'home.availableCredits': 'Available Credits',
    'home.credits': 'credits',
    'home.recharge': 'Recharge',
    'home.history': 'History',
    'home.consecutiveSuccesses': 'Consecutive Successes',
    'home.activePrediction': 'Active Prediction',
    'home.awaitingJudgment': 'Awaiting Judgment',
    'home.noPrediction': 'No Active Prediction',
    'home.createPrediction': 'Create Prediction',
    'home.timeRemaining': 'Time Remaining',
    'home.stake': 'Stake',

    // Prediction
    'prediction.create': 'Create Prediction',
    'prediction.title': 'Prediction Title',
    'prediction.titlePlaceholder': 'What will you achieve?',
    'prediction.description': 'Description',
    'prediction.descriptionPlaceholder': 'Add more details...',
    'prediction.deadline': 'Deadline',
    'prediction.stakeCredits': 'Stake Credits',
    'prediction.available': 'Available',
    'prediction.riskWarning': 'Risk Warning',
    'prediction.riskMessage': 'If you fail, your stake enters recovery mode. Need 2 consecutive successes to recover.',
    'prediction.quickOptions.1day': '1 Day',
    'prediction.quickOptions.7days': '7 Days',
    'prediction.quickOptions.1month': '1 Month',

    // Recovery
    'recovery.mode': 'Recovery Mode',
    'recovery.message': 'You need {count} more consecutive successes to recover your stake.',
    'recovery.noStakeRequired': 'No stake required in Recovery Mode',

    // Referee
    'referee.code': 'Referee Code',
    'referee.copyCode': 'Copy Code',
    'referee.shareCode': 'Share this code with friends to invite them as referees',
    'referee.noReferees': 'No referees yet',
    'referee.becomeReferee': 'Become a Referee',
    'referee.vote': 'Vote',
    'referee.voteYes': 'Yes',
    'referee.voteNo': 'No',
    'referee.pending': 'Pending',
    'referee.needAtLeastOne': 'You need at least 1 referee to request judgment',

    // Status
    'status.active': 'Active',
    'status.judging': 'Awaiting Judgment',
    'status.success': 'Success',
    'status.failed': 'Failed',
    'status.cancelled': 'Cancelled',
    'status.expired': 'Expired',

    // Actions
    'action.requestJudgment': 'Request Judgment',
    'action.cancel': 'Cancel',
    'action.share': 'Share',
    'action.checkIn': 'Check In',
    'action.post': 'Post',
    'action.addPhoto': 'Add Photo',

    // Profile
    'profile.title': 'My Profile',
    'profile.rechargeCredits': 'Recharge Credits',
    'profile.predictionHistory': 'Prediction History',
    'profile.transactionHistory': 'Transaction History',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Privacy & Security',
    'profile.help': 'Help & Support',
    'profile.terms': 'Terms of Service',
    'profile.version': 'Version',

    // Recharge
    'recharge.title': 'Recharge Credits',
    'recharge.currentBalance': 'Current Balance',
    'recharge.selectPackage': 'Select Package',
    'recharge.bonus': 'Bonus',
    'recharge.paymentMethod': 'Payment Method',
    'recharge.creditCard': 'Credit/Debit Card',
    'recharge.wechatPay': 'WeChat Pay',
    'recharge.pay': 'Pay',
    'recharge.notice': 'Credits cannot be withdrawn or converted back to cash.',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.done': 'Done',
    'common.required': '*',
  },

  zh: {
    // App
    'app.name': '诺值',
    'app.tagline': '预测你的行为，押注你的承诺',

    // Auth
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.logout': '退出登录',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.displayName': '昵称',
    'auth.continueWithGoogle': '使用 Google 登录',
    'auth.continueWithWechat': '使用微信登录',
    'auth.noAccount': '还没有账号？',
    'auth.hasAccount': '已有账号？',
    'auth.optional': '（选填）',

    // Home
    'home.welcome': '欢迎回来',
    'home.availableCredits': '可用积分',
    'home.credits': '积分',
    'home.recharge': '充值',
    'home.history': '历史',
    'home.consecutiveSuccesses': '连续成功',
    'home.activePrediction': '进行中的预测',
    'home.awaitingJudgment': '等待判定',
    'home.noPrediction': '暂无预测',
    'home.createPrediction': '创建预测',
    'home.timeRemaining': '剩余时间',
    'home.stake': '押注',

    // Prediction
    'prediction.create': '创建预测',
    'prediction.title': '预测标题',
    'prediction.titlePlaceholder': '你要完成什么？',
    'prediction.description': '描述',
    'prediction.descriptionPlaceholder': '添加更多细节...',
    'prediction.deadline': '截止时间',
    'prediction.stakeCredits': '押注积分',
    'prediction.available': '可用',
    'prediction.riskWarning': '风险提示',
    'prediction.riskMessage': '如果失败，押注将进入恢复模式。需要连续成功2次才能取回。',
    'prediction.quickOptions.1day': '1天',
    'prediction.quickOptions.7days': '7天',
    'prediction.quickOptions.1month': '1个月',

    // Recovery
    'recovery.mode': '恢复模式',
    'recovery.message': '还需要连续成功 {count} 次才能取回押注。',
    'recovery.noStakeRequired': '恢复模式无需押注',

    // Referee
    'referee.code': '监督码',
    'referee.copyCode': '复制',
    'referee.shareCode': '分享此码给朋友，邀请他们成为监督者',
    'referee.noReferees': '暂无监督者',
    'referee.becomeReferee': '成为监督者',
    'referee.vote': '投票',
    'referee.voteYes': '成功',
    'referee.voteNo': '失败',
    'referee.pending': '待投票',
    'referee.needAtLeastOne': '至少需要1位监督者才能请求判定',

    // Status
    'status.active': '进行中',
    'status.judging': '等待判定',
    'status.success': '成功',
    'status.failed': '失败',
    'status.cancelled': '已取消',
    'status.expired': '已截止',

    // Actions
    'action.requestJudgment': '请求判定',
    'action.cancel': '取消',
    'action.share': '分享',
    'action.checkIn': '打卡',
    'action.post': '发布',
    'action.addPhoto': '添加图片',

    // Profile
    'profile.title': '我的',
    'profile.rechargeCredits': '充值积分',
    'profile.predictionHistory': '预测历史',
    'profile.transactionHistory': '交易记录',
    'profile.notifications': '通知设置',
    'profile.privacy': '隐私与安全',
    'profile.help': '帮助与支持',
    'profile.terms': '服务条款',
    'profile.version': '版本',

    // Recharge
    'recharge.title': '充值积分',
    'recharge.currentBalance': '当前余额',
    'recharge.selectPackage': '选择套餐',
    'recharge.bonus': '赠送',
    'recharge.paymentMethod': '支付方式',
    'recharge.creditCard': '信用卡/借记卡',
    'recharge.wechatPay': '微信支付',
    'recharge.pay': '支付',
    'recharge.notice': '积分不可提现或转换为现金。',

    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.back': '返回',
    'common.next': '下一步',
    'common.done': '完成',
    'common.required': '*',
  },
};

/**
 * 获取翻译文本
 */
export function t(key: TranslationKey, region: Region, params?: Record<string, string | number>): string {
  const lang = region === 'CN' ? 'zh' : 'en';
  let text = translations[lang][key] || translations.en[key] || key;

  // 替换参数
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }

  return text;
}

/**
 * 创建翻译 Hook
 */
export function createTranslator(region: Region) {
  return (key: TranslationKey, params?: Record<string, string | number>) => t(key, region, params);
}

