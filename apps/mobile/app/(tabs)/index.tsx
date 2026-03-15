import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { SearchBar } from '@/components/search-bar';
import { ChatRoomItem } from '@/components/chat-room-item';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getChatRooms, saveChatRooms, searchChatRooms } from '@/services/database';
import { apiFetchChatRooms, apiSearchMessages, getCurrentUserId } from '@/services/api';
import type { ChatRoom } from '@basemsg/shared';

export default function ChatsScreen() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const syncFromBackend = useCallback(async () => {
    try {
      const apiRooms = await apiFetchChatRooms();
      const mapped: ChatRoom[] = apiRooms.map((r) => ({
        id: r.id,
        name: r.name,
        participants: r.participants.map((p) => p.user.id),
        unreadCount: 0,
        createdAt: r.createdAt,
      }));
      await saveChatRooms(mapped);
      return mapped;
    } catch {
      // Fallback to local data
      return getChatRooms();
    }
  }, []);

  const loadRooms = useCallback(async () => {
    if (searchQuery) {
      // Combined local + server search
      const localResults = await searchChatRooms(searchQuery);

      try {
        const serverResults = await apiSearchMessages(searchQuery);
        // Merge server results: add rooms not already in local results
        const localIds = new Set(localResults.map((r) => r.id));
        for (const result of serverResults) {
          if (!localIds.has(result.chatRoomId)) {
            localResults.push({
              id: result.chatRoomId,
              name: result.chatRoomName,
              participants: [],
              unreadCount: 0,
              lastMessage: result.messages[0]?.text,
              lastMessageAt: result.messages[0]?.createdAt,
              createdAt: '',
            });
          }
        }
      } catch {
        // Server search failed, use local only
      }

      setRooms(localResults);
    } else {
      const data = await syncFromBackend();
      setRooms(data);
    }
  }, [searchQuery, syncFromBackend]);

  // Reload when tab gets focus
  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, [loadRooms]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>채팅</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/new-chat')}
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="채팅방, 메시지 검색"
      />

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatRoomItem
            room={item}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={rooms.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? '검색 결과가 없습니다' : '채팅방이 없습니다'}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
});
