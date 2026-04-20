import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(1, 'common.required'),
});

export const signupUserSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(8, 'auth.passwordMinLength').max(128),
  firstName: z.string().min(1, 'common.required').max(100),
  lastName: z.string().min(1, 'common.required').max(100),
  phoneNumber: z.string().max(32).optional().or(z.literal('')),
});

export const signupVendorSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(8, 'auth.passwordMinLength').max(128),
  businessName: z.string().min(1, 'common.required').max(200),
  contactPersonName: z.string().min(1, 'common.required').max(200),
  phoneNumber: z.string().max(32).optional().or(z.literal('')),
  businessAddress: z.string().max(500).optional().or(z.literal('')),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'auth.passwordMinLength').max(128),
    confirmPassword: z.string().min(1, 'common.required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'auth.passwordsNoMatch',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;
export type SignupVendorInput = z.infer<typeof signupVendorSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
