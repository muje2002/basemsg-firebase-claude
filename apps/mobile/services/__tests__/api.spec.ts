import { faker } from '@faker-js/faker';
import {
  setCurrentUserId,
  getCurrentUserId,
  createUser,
  getUser,
  getAllUsers,
  apiFetchFriends,
  apiAddFriend,
  apiRemoveFriend,
  apiFetchChatRooms,
  apiCreateChatRoom,
  apiLeaveChatRoom,
  apiFetchMessages,
  apiSendMessage,
} from '../api';

faker.seed(42);

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJsonResponse(data: any, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mock204() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 204,
    json: () => Promise.resolve(undefined),
    text: () => Promise.resolve(''),
  });
}

function mockError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(message),
  });
}

beforeEach(() => {
  mockFetch.mockClear();
  setCurrentUserId('test-user-id');
});

// ── 1. Happy Path ──
describe('API Client - happy path', () => {
  it('setCurrentUserId / getCurrentUserId', () => {
    setCurrentUserId('abc');
    expect(getCurrentUserId()).toBe('abc');
  });

  it('createUser', async () => {
    const user = { id: 'u1', name: '테스트', phone: '010-0000-0000', createdAt: '2024-01-01' };
    mockJsonResponse(user);

    const result = await createUser({ name: '테스트', phone: '010-0000-0000' });
    expect(result.name).toBe('테스트');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/users');
    expect(opts.method).toBe('POST');
  });

  it('getUser', async () => {
    const user = { id: 'u1', name: '테스트', phone: '010-0000-0000' };
    mockJsonResponse(user);

    const result = await getUser('u1');
    expect(result.id).toBe('u1');
  });

  it('getAllUsers', async () => {
    mockJsonResponse([{ id: 'u1' }, { id: 'u2' }]);
    const result = await getAllUsers();
    expect(result).toHaveLength(2);
  });

  it('apiFetchFriends', async () => {
    mockJsonResponse([{ id: 'f1', name: '친구A' }]);
    const result = await apiFetchFriends();
    expect(result).toHaveLength(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('userId=test-user-id');
  });

  it('apiAddFriend', async () => {
    mockJsonResponse({ id: 'f1' });
    const result = await apiAddFriend('friend-id');
    expect(result.id).toBe('f1');
  });

  it('apiRemoveFriend', async () => {
    mock204();
    await expect(apiRemoveFriend('friend-id')).resolves.toBeUndefined();
  });

  it('apiFetchChatRooms', async () => {
    mockJsonResponse([{ id: 'r1', name: '방1', participants: [] }]);
    const result = await apiFetchChatRooms();
    expect(result).toHaveLength(1);
  });

  it('apiCreateChatRoom', async () => {
    mockJsonResponse({ id: 'r1', name: '새방', participants: [] });
    const result = await apiCreateChatRoom('새방', ['u2']);
    expect(result.name).toBe('새방');
  });

  it('apiLeaveChatRoom', async () => {
    mock204();
    await expect(apiLeaveChatRoom('r1')).resolves.toBeUndefined();
  });

  it('apiFetchMessages', async () => {
    mockJsonResponse([{ id: 'm1', text: '안녕' }]);
    const result = await apiFetchMessages('r1');
    expect(result).toHaveLength(1);
  });

  it('apiSendMessage', async () => {
    const msg = { id: 'm1', text: '테스트', type: 'text' };
    mockJsonResponse(msg);
    const result = await apiSendMessage('r1', { text: '테스트' });
    expect(result.text).toBe('테스트');
  });
});

// ── 2. Boundary values ──
describe('API Client - boundary values', () => {
  it('should handle empty arrays', async () => {
    mockJsonResponse([]);
    const result = await apiFetchFriends();
    expect(result).toEqual([]);
  });

  it('should handle single char name', async () => {
    mockJsonResponse({ id: 'u1', name: 'A', phone: '0' });
    const result = await createUser({ name: 'A', phone: '0' });
    expect(result.name).toBe('A');
  });

  it('apiFetchMessages with limit and before', async () => {
    mockJsonResponse([]);
    await apiFetchMessages('r1', 50, '2024-01-01T00:00:00Z');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('limit=50');
    expect(url).toContain('before=2024-01-01');
  });
});

// ── 3. Corner cases ──
describe('API Client - corner cases', () => {
  it('should handle emoji in message text', async () => {
    const msg = { id: 'm1', text: '😀🎉', type: 'emoji' };
    mockJsonResponse(msg);
    const result = await apiSendMessage('r1', { text: '😀🎉', type: 'emoji' });
    expect(result.text).toBe('😀🎉');
  });

  it('should handle unicode names', async () => {
    mockJsonResponse({ id: 'u1', name: 'مرحبا', phone: '010' });
    const result = await createUser({ name: 'مرحبا', phone: '010' });
    expect(result.name).toBe('مرحبا');
  });

  it('should handle special chars in room name', async () => {
    mockJsonResponse({ id: 'r1', name: "O'Brien's Room <test>", participants: [] });
    const result = await apiCreateChatRoom("O'Brien's Room <test>", []);
    expect(result.name).toContain("O'Brien");
  });
});

// ── 4. Invalid input ──
describe('API Client - invalid input', () => {
  it('should throw when API returns error', async () => {
    mockError(404, 'Not found');
    await expect(getUser('non-existent')).rejects.toThrow('API error 404');
  });

  it('should throw when server returns 500', async () => {
    mockError(500, 'Internal server error');
    await expect(getAllUsers()).rejects.toThrow('API error 500');
  });

  it('should throw when no userId set', () => {
    // Reset internal state by importing fresh — test directly
    setCurrentUserId(undefined as any);
    expect(() => getCurrentUserId()).toThrow('User ID not set');
  });
});

// ── 5. Random input ──
describe('API Client - random input', () => {
  it.each([1, 2, 3])('should handle random user data (iteration %i)', async (i) => {
    const name = faker.person.fullName();
    const phone = faker.phone.number();
    mockJsonResponse({ id: `u-${i}`, name, phone });

    const result = await createUser({ name, phone });
    expect(result.name).toBe(name);
  });
});

// ── 6. Concurrency ──
describe('API Client - concurrency', () => {
  it('should handle concurrent API calls', async () => {
    setCurrentUserId('test-user');
    for (let i = 0; i < 5; i++) {
      mockJsonResponse({ id: `u-${i}`, name: `User${i}`, phone: `010-${i}` });
    }

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => getUser(`u-${i}`)),
    );
    expect(results).toHaveLength(5);
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
});
