import type { Achievement, AppSnapshot, AuthResponse, BackgroundKind, Drawing, Player } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

type ApiErrorPayload = {
  detail?: string;
};

export type RoomPlayerDto = {
  id: number;
  child_name: string;
  age: number;
  progress: number;
  status: 'waiting' | 'approved' | 'hidden';
};

export type RoomDrawingDto = {
  id: number;
  player_id?: number | null;
  child_name: string;
  stage_id: string;
  image_data: string;
  progress: number;
  status: 'waiting' | 'approved' | 'hidden';
  created_at: string;
};

export type RoomDto = {
  code: string;
  host_name: string;
  mode: string;
  timer: number;
  stage_id: string;
  started: boolean;
  locked: boolean;
  players: RoomPlayerDto[];
  drawings: RoomDrawingDto[];
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

  createRoom(payload: { hostName: string; mode: string; timer: number; stageId: string }) {
    return request<RoomDto>('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        host_name: payload.hostName,
        mode: payload.mode,
        timer: payload.timer,
        stage_id: payload.stageId,
      }),
    });
  },

  getRoom(code: string) {
    return request<RoomDto>(`/rooms/${encodeURIComponent(code)}`);
  },

  joinRoom(code: string, payload: { childName: string; age: number }) {
    return request<RoomDto>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: 'POST',
      body: JSON.stringify({ child_name: payload.childName, age: payload.age }),
    });
  },

  updateRoom(code: string, payload: Partial<{ mode: string; timer: number; stageId: string; started: boolean; locked: boolean }>) {
    return request<RoomDto>(`/rooms/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        mode: payload.mode,
        timer: payload.timer,
        stage_id: payload.stageId,
        started: payload.started,
        locked: payload.locked,
      }),
    });
  },

  saveRoomDrawing(
    code: string,
    payload: {
      playerId?: number | null;
      childName: string;
      stageId: string;
      imageData: string;
      progress: number;
      status: 'waiting' | 'approved' | 'hidden';
    },
  ) {
    return request<RoomDto>(`/rooms/${encodeURIComponent(code)}/drawings`, {
      method: 'POST',
      body: JSON.stringify({
        player_id: payload.playerId,
        child_name: payload.childName,
        stage_id: payload.stageId,
        image_data: payload.imageData,
        progress: payload.progress,
        status: payload.status,
      }),
    });
  },

  updateRoomDrawing(code: string, drawingId: number, status: 'waiting' | 'approved' | 'hidden') {
    return request<RoomDto>(`/rooms/${encodeURIComponent(code)}/drawings/${drawingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  claimReward(token: string, drawingId: string) {
    return request<{ player: Player; achievements: Achievement[] }>(
      '/rewards/claim',
      {
        method: 'POST',
        body: JSON.stringify({ drawing_id: drawingId }),
      },
      token,
    );
  },

  saveBackground(token: string, drawingId: string, backgroundKind: BackgroundKind) {
    return request<Drawing>(
      '/drawings/background',
      {
        method: 'POST',
        body: JSON.stringify({ drawing_id: drawingId, background_kind: backgroundKind }),
      },
      token,
    );
  },

  updateAvatar(token: string, avatarId: string) {
    return request<Player>(
      '/profile/avatar',
      {
        method: 'PATCH',
        body: JSON.stringify({ avatar_id: avatarId }),
      },
      token,
    );
  },

  updateParentControls(token: string, requireExportApproval: boolean) {
    return request<{ require_export_approval: boolean }>(
      '/parent/controls',
      {
        method: 'PATCH',
        body: JSON.stringify({ require_export_approval: requireExportApproval }),
      },
      token,
    );
  },
};
