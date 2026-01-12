import { captureRef } from 'react-native-view-shot';
import type { Prediction } from '@/types';

/**
 * 生成分享图片
 * 注意：这是一个简化版本，实际实现需要使用 react-native-view-shot
 * 配合一个专门的分享卡片组件
 */
export async function generateShareImage(prediction: Prediction): Promise<string> {
  // 在实际实现中，这里会:
  // 1. 渲染一个隐藏的分享卡片组件
  // 2. 使用 captureRef 捕获该组件为图片
  // 3. 返回图片的本地 URI
  
  // 目前返回空字符串，分享时只使用文本
  return '';
}

/**
 * 生成分享文本
 */
export function generateShareText(prediction: Prediction): string {
  const statusEmoji = {
    ACTIVE: '🎯',
    JUDGING: '⏳',
    SUCCESS: '✅',
    FAILED: '❌',
    CANCELLED: '🚫',
  };

  return `${statusEmoji[prediction.status]} I'm predicting: "${prediction.title}"

📅 Deadline: ${new Date(prediction.deadline).toLocaleDateString()}
💰 Stake: ${prediction.stake} credits

🔑 Referee Code: ${prediction.referee_code}

Join as my referee on Aura!`;
}

/**
 * 生成动态链接（用于裁判加入）
 */
export function generateRefereeLink(refereeCode: string): string {
  // 在实际实现中，这里会使用 Firebase Dynamic Links 生成深链接
  // 目前返回一个占位符 URL
  return `https://aura.app/referee/${refereeCode}`;
}
