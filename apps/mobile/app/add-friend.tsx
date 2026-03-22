import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';

import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiSyncContacts } from '@/services/api';

interface ContactEntry {
  id: string;
  name: string;
  phone: string;
}

export default function AddFriendScreen() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactEntry[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const loadContacts = useCallback(async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '전화번호부 접근 권한이 필요합니다.');
      setLoading(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      sort: Contacts.SortTypes.FirstName,
    });

    const entries: ContactEntry[] = [];
    for (const contact of data) {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const phone = contact.phoneNumbers[0].number ?? '';
        if (phone) {
          entries.push({
            id: contact.id ?? `contact-${entries.length}`,
            name: contact.name ?? '이름 없음',
            phone: normalizePhone(phone),
          });
        }
      }
    }

    setContacts(entries);
    setFilteredContacts(entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      const isChosung = /^[ㄱ-ㅎ]+$/.test(searchQuery);
      setFilteredContacts(
        contacts.filter((c) => {
          if (isChosung) {
            return extractChosung(c.name).includes(searchQuery);
          }
          return c.name.toLowerCase().includes(lower) || c.phone.includes(searchQuery);
        })
      );
    } else {
      setFilteredContacts(contacts);
    }
  }, [contacts, searchQuery]);

  const toggleSelection = (phone: string) => {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) {
        next.delete(phone);
      } else {
        next.add(phone);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPhones.size === filteredContacts.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(filteredContacts.map((c) => c.phone)));
    }
  };

  const handleAdd = async () => {
    if (selectedPhones.size === 0) {
      Alert.alert('알림', '추가할 연락처를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // Build contacts list from selected phones
      const selectedContacts = contacts
        .filter((c) => selectedPhones.has(c.phone))
        .map((c) => ({ phone: c.phone, name: c.name }));

      const result = await apiSyncContacts(selectedContacts);
      const addedCount = result.added.length;

      let message = '';
      if (addedCount > 0) {
        message += `${addedCount}명의 친구가 추가되었습니다.`;
      }
      if (result.alreadyFriends > 0) {
        message += `\n${result.alreadyFriends}명은 이미 친구입니다.`;
      }
      if (result.pending > 0) {
        message += `\n${result.pending}명은 아직 미가입 — 가입하면 자동으로 친구가 됩니다.`;
      }
      if (!message) {
        message = '변경사항이 없습니다.';
      }

      Alert.alert('완료', message.trim());
      router.back();
    } catch (err) {
      Alert.alert('오류', '친구 추가에 실패했습니다.');
      console.error('[AddFriend]', err);
    } finally {
      setSubmitting(false);
    }
  };

  const allSelected = filteredContacts.length > 0 && selectedPhones.size === filteredContacts.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>전화번호부에서 추가</ThemedText>
        <TouchableOpacity onPress={handleAdd} disabled={submitting}>
          <ThemedText
            style={[
              styles.addButton,
              { color: selectedPhones.size > 0 ? colors.primary : colors.textSecondary },
            ]}
          >
            {submitting ? '추가 중...' : '추가'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="이름, 전화번호 검색"
      />

      {/* Select all / count */}
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
          <MaterialIcons
            name={allSelected ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={allSelected ? colors.primary : colors.icon}
          />
          <ThemedText style={[styles.selectAllText, { color: colors.textSecondary }]}>
            전체 선택
          </ThemedText>
        </TouchableOpacity>
        {selectedPhones.size > 0 && (
          <ThemedText style={[styles.selectedCount, { color: colors.primary }]}>
            {selectedPhones.size}명 선택
          </ThemedText>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            전화번호부를 불러오는 중...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selected = selectedPhones.has(item.phone);
            return (
              <TouchableOpacity
                style={[
                  styles.contactItem,
                  { borderBottomColor: colors.border },
                  selected && { backgroundColor: colors.primaryLight + '30' },
                ]}
                onPress={() => toggleSelection(item.phone)}
              >
                <MaterialIcons
                  name={selected ? 'check-circle' : 'radio-button-unchecked'}
                  size={22}
                  color={selected ? colors.primary : colors.icon}
                  style={styles.checkbox}
                />
                <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
                  <ThemedText style={styles.avatarText}>
                    {item.name.charAt(0)}
                  </ThemedText>
                </View>
                <View style={styles.contactInfo}>
                  <ThemedText style={styles.contactName}>{item.name}</ThemedText>
                  <ThemedText style={[styles.contactPhone, { color: colors.textSecondary }]}>
                    {item.phone}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="contacts" size={48} color={colors.icon} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? '검색 결과가 없습니다' : '전화번호부가 비어있습니다'}
              </ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+82')) {
    cleaned = '0' + cleaned.slice(3);
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function extractChosung(str: string): string {
  return [...str].map((ch) => {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return ch;
    return CHOSUNG[Math.floor(code / 588)];
  }).join('');
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
  addButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectAllText: {
    fontSize: 14,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
});
