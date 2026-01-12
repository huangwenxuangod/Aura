import { z } from 'zod';
import { CREDIT } from './constants';

/**
 * 创建预测验证
 */
export const createPredictionSchema = z.object({
  title: z
    .string()
    .min(1, '请输入预测内容')
    .max(100, '预测内容不能超过100个字符'),
  description: z
    .string()
    .max(500, '描述不能超过500个字符')
    .optional(),
  deadline: z
    .string()
    .datetime({ message: '请选择有效的截止时间' })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: '截止时间必须在未来' }
    ),
  stake: z
    .number()
    .min(CREDIT.MIN_STAKE, `最小质押 ${CREDIT.MIN_STAKE} Credit`)
    .max(CREDIT.MAX_STAKE, `最大质押 ${CREDIT.MAX_STAKE} Credit`),
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;

/**
 * 登录验证（邮箱）
 */
export const emailLoginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少6个字符'),
});

export type EmailLoginInput = z.infer<typeof emailLoginSchema>;

/**
 * 注册验证（邮箱）
 */
export const emailRegisterSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(72, '密码不能超过72个字符'),
  confirmPassword: z
    .string()
    .min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export type EmailRegisterInput = z.infer<typeof emailRegisterSchema>;

/**
 * 手机号登录验证
 */
export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(11, '请输入有效的手机号')
    .max(11, '请输入有效的手机号')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  code: z
    .string()
    .length(6, '验证码为6位数字'),
});

export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;

