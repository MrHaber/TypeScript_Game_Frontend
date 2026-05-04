import { Achievement, AppSnapshot, AuthResponse, BackgroundKind, Drawing, Player } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

type ApiErrorPayload = {
  detail?: string;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = 'Сервер временно недоступен';
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.detail ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  login(childName: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ child_name: childName }),
    });
  },

  register(childName: string, parentPin: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ child_name: childName, parent_pin: parentPin }),
    });
  },

  me(token: string) {
    return request<AppSnapshot>('/me', {}, token);
  },

  claimReward(token: string, drawingId: string) {
    return request<{ player: Player; achievements: Achievement[] }>('/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({ drawing_id: drawingId }),
    }, token);
  },

  saveBackground(token: string, drawingId: string, backgroundKind: BackgroundKind) {
    return request<Drawing>('/drawings/background', {
      method: 'POST',
      body: JSON.stringify({ drawing_id: drawingId, background_kind: backgroundKind }),
    }, token);
  },

  updateAvatar(token: string, avatarId: string) {
    return request<Player>('/profile/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar_id: avatarId }),
    }, token);
  },

  updateParentControls(token: string, requireExportApproval: boolean) {
    return request<{ require_export_approval: boolean }>('/parent/controls', {
      method: 'PATCH',
      body: JSON.stringify({ require_export_approval: requireExportApproval }),
    }, token);
  },
};
