import { Achievement, AppSnapshot, AuthResponse, BackgroundKind, Drawing, Player } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

type ApiErrorPayload = {
  detail?: string;
};

function fallbackErrorMessage(status: number, path: string, statusText: string) {
  if (status === 404 && path.startsWith('/parents/')) {
    return 'Сервер еще не обновлен: перезапустите backend, чтобы включить регистрацию родителей.';
  }
  if (status === 404) {
    return 'Запрошенный раздел не найден. Проверьте, что backend запущен с последней версией.';
  }
  if (status === 409) {
    return 'Такой аккаунт уже существует. Попробуйте войти или выберите другой логин.';
  }
  if (status === 401) {
    return 'Неверный логин или пароль.';
  }
  if (status === 422) {
    return 'Проверьте поля формы: логин от 3 символов, пароль от 4 символов.';
  }
  if (status >= 500) {
    return 'Ошибка сервера. Попробуйте еще раз или перезапустите backend.';
  }
  return statusText && statusText !== 'Not Found' ? statusText : 'Не удалось выполнить запрос.';
}

export type RoomPlayer = {
  id: number;
  name: string;
  age: number;
  progress: number;
  status: 'drawing' | 'waiting' | 'approved' | 'hidden';
  rating: number;
  stageId: string;
  drawingData?: string | null;
};

export type RoomSnapshot = {
  code: string;
  hostName: string;
  activeMode: 'drawing' | 'quiz' | 'mixed' | 'free';
  activeStageId: string;
  gameStarted: boolean;
  timerStarted: boolean;
  timerStartedAt?: string | null;
  timerEndsAt?: string | null;
  winnersRevealed: boolean;
  settings: {
    requireApproval: boolean;
    galleryEnabled: boolean;
    drawingLocked: boolean;
    soundEnabled: boolean;
    timer: number;
  };
  players: RoomPlayer[];
};

export type ParentAccount = {
  id: number;
  login: string;
  displayName: string;
};

export type ParentAuthResponse = {
  token: string;
  parent: ParentAccount;
  room: RoomSnapshot;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Backend недоступен. Запустите или перезапустите сервер и попробуйте еще раз.');
  }

  if (!response.ok) {
    let message = fallbackErrorMessage(response.status, path, response.statusText);
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.detail && payload.detail !== 'Not Found' ? payload.detail : message;
    } catch {
      // Keep the localized fallback above when the server returns an empty or non-JSON error.
    }
    throw new Error(message);
  }

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

  parentLogin(login: string, password: string) {
    return request<ParentAuthResponse>('/parents/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
  },

  parentRegister(login: string, password: string, displayName: string) {
    return request<ParentAuthResponse>('/parents/register', {
      method: 'POST',
      body: JSON.stringify({ login, password, display_name: displayName }),
    });
  },

  parentMe(token: string) {
    return request<ParentAuthResponse>('/parents/me', {}, token);
  },

  hostRoom(hostName: string, roomCode: string | undefined, token: string) {
    return request<RoomSnapshot>('/rooms/host', {
      method: 'POST',
      body: JSON.stringify({ host_name: hostName, ...(roomCode ? { room_code: roomCode } : {}) }),
    }, token);
  },

  childRoom(childName: string, roomCode: string) {
    return request<RoomSnapshot>('/rooms/child', {
      method: 'POST',
      body: JSON.stringify({ child_name: childName, room_code: roomCode }),
    });
  },

  room(roomCode: string) {
    return request<RoomSnapshot>(`/rooms/${encodeURIComponent(roomCode)}`);
  },

  updateRoom(roomCode: string, payload: Partial<{
    active_mode: RoomSnapshot['activeMode'];
    active_stage_id: string;
    game_started: boolean;
    drawing_locked: boolean;
    timer_started: boolean;
    winners_revealed: boolean;
    require_approval: boolean;
    gallery_enabled: boolean;
    sound_enabled: boolean;
    timer: number;
    reset_players: boolean;
    clear_drawings: boolean;
  }>, token?: string) {
    return request<RoomSnapshot>(`/rooms/${encodeURIComponent(roomCode)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  updateRoomPlayer(roomCode: string, payload: {
    child_name: string;
    progress?: number;
    status?: RoomPlayer['status'];
    rating?: number;
    stage_id?: string;
    drawing_data?: string;
  }, token?: string) {
    return request<RoomSnapshot>(`/rooms/${encodeURIComponent(roomCode)}/players`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },
};
