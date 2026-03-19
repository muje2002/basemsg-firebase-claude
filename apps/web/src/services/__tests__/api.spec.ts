import { faker } from '@faker-js/faker';

// Mock env module to avoid import.meta.env (Vite-only syntax) in Jest
jest.mock('../env', () => ({ BASE_URL: '/api' }));

import {
  setCurrentUserId,
  getCurrentUserId,
  createUser,
  getUser,
  getAllUsers,
  fetchFriends,
  addFriend,
  removeFriend,
  fetchChatRooms,
  createChatRoom,
  leaveChatRoom,
  fetchMessages,
  sendMessage,
} from '../api';

faker.seed(42);

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: any, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mock204() {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 204, text: () => Promise.resolve('') });
}

function mockError(status: number, msg: string) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, text: () => Promise.resolve(msg) });
}

beforeEach(() => {
  mockFetch.mockClear();
  setCurrentUserId('test-user');
});

// ── 1. Happy Path ──
describe('Web API - happy path', () => {
  it('setCurrentUserId / getCurrentUserId', () => {
    setCurrentUserId('abc');
    expect(getCurrentUserId()).toBe('abc');
  });

  it('createUser', async () => {
    mockJson({ id: 'u1', name: '테스트', phone: '010-0000' });
    const r = await createUser({ name: '테스트', phone: '010-0000' });
    expect(r.name).toBe('테스트');
  });

  it('getUser', async () => {
    mockJson({ id: 'u1', name: 'A' });
    expect((await getUser('u1')).id).toBe('u1');
  });

  it('getAllUsers', async () => {
    mockJson([{ id: 'u1' }, { id: 'u2' }]);
    expect(await getAllUsers()).toHaveLength(2);
  });

  it('fetchFriends', async () => {
    mockJson([{ id: 'f1' }]);
    expect(await fetchFriends()).toHaveLength(1);
  });

  it('addFriend', async () => {
    mockJson({ id: 'f1' });
    expect((await addFriend('fid')).id).toBe('f1');
  });

  it('removeFriend', async () => {
    mock204();
    await expect(removeFriend('fid')).resolves.toBeUndefined();
  });

  it('fetchChatRooms', async () => {
    mockJson([{ id: 'r1', name: '방', participants: [] }]);
    expect(await fetchChatRooms()).toHaveLength(1);
  });

  it('createChatRoom', async () => {
    mockJson({ id: 'r1', name: '새방', participants: [] });
    expect((await createChatRoom('새방', ['u2'])).name).toBe('새방');
  });

  it('leaveChatRoom', async () => {
    mock204();
    await expect(leaveChatRoom('r1')).resolves.toBeUndefined();
  });

  it('fetchMessages', async () => {
    mockJson([{ id: 'm1', text: '안녕' }]);
    expect(await fetchMessages('r1')).toHaveLength(1);
  });

  it('sendMessage', async () => {
    mockJson({ id: 'm1', text: '테스트' });
    expect((await sendMessage('r1', { text: '테스트' })).text).toBe('테스트');
  });
});

// ── 2. Boundary ──
describe('Web API - boundary', () => {
  it('empty response array', async () => {
    mockJson([]);
    expect(await fetchFriends()).toEqual([]);
  });

  it('fetchMessages with before param', async () => {
    mockJson([]);
    await fetchMessages('r1', 50, '2024-01-01');
    expect(mockFetch.mock.calls[0][0]).toContain('before=2024-01-01');
  });
});

// ── 3. Corner cases ──
describe('Web API - corner cases', () => {
  it('emoji in message', async () => {
    mockJson({ id: 'm1', text: '😀🎉', type: 'emoji' });
    const r = await sendMessage('r1', { text: '😀🎉', type: 'emoji' });
    expect(r.text).toBe('😀🎉');
  });

  it('unicode names', async () => {
    mockJson({ id: 'u1', name: 'مرحبا', phone: '010' });
    expect((await createUser({ name: 'مرحبا', phone: '010' })).name).toBe('مرحبا');
  });
});

// ── 4. Invalid input ──
describe('Web API - invalid input', () => {
  it('throws on 404', async () => {
    mockError(404, 'Not found');
    await expect(getUser('x')).rejects.toThrow('API error 404');
  });

  it('throws when no userId', () => {
    setCurrentUserId(undefined as any);
    expect(() => getCurrentUserId()).toThrow();
  });
});

// ── 5. Random input ──
describe('Web API - random input', () => {
  it.each([1, 2, 3])('random user (iteration %i)', async (i) => {
    const name = faker.person.fullName();
    mockJson({ id: `u-${i}`, name, phone: '010' });
    expect((await createUser({ name, phone: '010' })).name).toBe(name);
  });
});

// ── 6. Concurrency ──
describe('Web API - concurrency', () => {
  it('concurrent calls', async () => {
    setCurrentUserId('u1');
    for (let i = 0; i < 5; i++) mockJson({ id: `u-${i}`, name: `N${i}` });
    const results = await Promise.all(Array.from({ length: 5 }, (_, i) => getUser(`u-${i}`)));
    expect(results).toHaveLength(5);
  });
});
