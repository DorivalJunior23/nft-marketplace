import type { LoginRequest, RegisterRequest, Session } from '@/contracts';

import { http } from '../http';

export const authApi = {
  login: async (body: LoginRequest): Promise<Session> =>
    (await http.post<Session>('/auth/login', body)).data,
  register: async (body: RegisterRequest): Promise<Session> =>
    (await http.post<Session>('/auth/register', body)).data,
  session: async (): Promise<Session> => (await http.get<Session>('/auth/session')).data,
  logout: async (): Promise<void> => {
    await http.post('/auth/logout');
  },
};
