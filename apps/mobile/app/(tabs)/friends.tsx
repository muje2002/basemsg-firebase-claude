import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { FriendItem } from '@/components/friend-item';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getFriends, saveFriends, removeFriends } from '@/services/database';
import { apiFetchFriends, apiRemoveFriend } from '@/services/api';
import type { Friend } from '@basemsg/shared';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const loadFriends = useCallback(async () => {
    try {
      // Sync from backend
      const serverFriends = await apiFetchFriends();
      // Backend returns User[] from getFriends, map to Friend type
      const mapped: Friend[] = (serverFriends as unknown as Array<{
        id: string;
        name: string;
        phone: string;
        avatarUrl?: string;
        createdAt: string;
      }>).map((u) => ({
        id: u.id,
        userId: u.id,
        name: u.name,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        addedAt: u.createdAt,
      }));
      await saveFriends(mapped);
      setFriends(mapped);
    } catch {
      // Fallback to local
      const data = await getFriends();
      setFriends(data);
    }
  }, []);

  // Reload when tab gets focus (e.g., after adding friends)
  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );

  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter(
          (f) =>
            f.name.toLowerCase().includes(lower) ||
            f.phone.includes(searchQuery)
        )
      );
    } else {
      setFilteredFriends(friends);
    }
  }, [friends, searchQuery]);

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

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      '친구 삭제',
      `선택한 ${selectedIds.size}명의 친구를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            // Delete from backend
            const deletePromises = Array.from(selectedIds).map((id) =>
              apiRemoveFriend(id).catch(() => {})
            );
            await Promise.all(deletePromises);

            // Delete locally
            await removeFriends(Array.from(selectedIds));
            setSelectedIds(new Set());
            setSelectionMode(false);
            await loadFriends();
          },
        },
      ]
    );
  };

  const handleAddFromContacts = () => {
    router.push('/add-friend');
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {selectionMode ? (
          <>
            <TouchableOpacity onPress={cancelSelection}>
              <ThemedText style={[styles.headerAction, { color: colors.primary }]}>취소</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>{selectedIds.size}명 선택</ThemedText>
            <TouchableOpacity onPress={handleDelete}>
              <ThemedText style={[styles.headerAction, { color: colors.error }]}>삭제</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ThemedText style={styles.title}>친구</ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleAddFromContacts} style={styles.headerButton}>
                <MaterialIcons name="person-add" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectionMode(true)}
                style={styles.headerButton}
              >
                <MaterialIcons name="checklist" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="이름, 전화번호 검색"
      />

      <ThemedText style={[styles.count, { color: colors.textSecondary }]}>
        친구 {filteredFriends.length}명
      </ThemedText>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendItem
            friend={item}
            selected={selectedIds.has(item.id)}
            selectionMode={selectionMode}
            onPress={() => {
              if (selectionMode) {
                toggleSelection(item.id);
              }
            }}
            onLongPress={() => {
              if (!selectionMode) {
                setSelectionMode(true);
                toggleSelection(item.id);
              }
            }}
          />
        )}
        contentContainerStyle={filteredFriends.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={48} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? '검색 결과가 없습니다' : '친구를 추가해보세요'}
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    fontSize: 13,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
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
