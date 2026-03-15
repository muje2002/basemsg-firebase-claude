import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendItem } from '@/components/friend-item';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getFriends, saveChatRoom } from '@/services/database';
import type { Friend, ChatRoom } from '@basemsg/shared';

export default function NewChatScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roomName, setRoomName] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const loadFriends = useCallback(async () => {
    const data = await getFriends();
    setFriends(data);
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('알림', '대화 상대를 선택해주세요.');
      return;
    }

    const selectedFriends = friends.filter((f) => selectedIds.has(f.id));
    const name =
      roomName.trim() ||
      selectedFriends.map((f) => f.name).join(', ');

    const newRoom: ChatRoom = {
      id: `room-${Date.now()}`,
      name,
      participants: ['user-1', ...selectedFriends.map((f) => f.userId)],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    await saveChatRoom(newRoom);
    router.replace(`/chat/${newRoom.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>새 채팅</ThemedText>
        <TouchableOpacity onPress={handleCreate}>
          <ThemedText
            style={[
              styles.createButton,
              { color: selectedIds.size > 0 ? colors.primary : colors.textSecondary },
            ]}
          >
            만들기
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Room name input */}
      <View style={[styles.nameInput, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.nameTextInput, { color: colors.text }]}
          value={roomName}
          onChangeText={setRoomName}
          placeholder="채팅방 이름 (선택사항)"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Selected count */}
      {selectedIds.size > 0 && (
        <View style={[styles.selectedBar, { backgroundColor: colors.primaryLight + '40' }]}>
          <ThemedText style={[styles.selectedText, { color: colors.primary }]}>
            {selectedIds.size}명 선택됨
          </ThemedText>
        </View>
      )}

      {/* Friend list */}
      <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        대화 상대 선택
      </ThemedText>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendItem
            friend={item}
            selected={selectedIds.has(item.id)}
            selectionMode
            onPress={() => toggleSelection(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              친구를 먼저 추가해주세요
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  nameInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameTextInput: {
    fontSize: 15,
  },
  selectedBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
