import { authFormData, authJson } from '../../../lib/api';
import type { UserDashboardResponse, UserProfileResponse } from '../types';

export function getUserProfile() {
  return authJson<UserProfileResponse>('/user/profile');
}

export function getUserDashboard() {
  return authJson<UserDashboardResponse>('/user/dashboard');
}

export function patchUserProfile(body: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}) {
  return authJson<UserProfileResponse>('/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function postUserProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return authFormData<UserProfileResponse>('/user/profile/photo', formData, {
    method: 'POST',
  });
}

export function deleteUserProfilePhoto() {
  return authJson<UserProfileResponse>('/user/profile/photo', {
    method: 'DELETE',
  });
}

export function patchUserPassword(body: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  return authJson<{ message: string }>('/user/profile/password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
