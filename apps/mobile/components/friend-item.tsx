import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Friend } from '@basemsg/shared';

interface FriendItemProps {
  friend: Friend;
  selected?: boolean;
  selectionMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function FriendItem({ friend, selected, selectionMode, onPress, onLongPress }: FriendItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: colors.border },
        selected && { backgroundColor: colors.primaryLight + '30' },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.6}
    >
      {selectionMode && (
        <View style={styles.checkbox}>
          <MaterialIcons
            name={selected ? 'check-circle' : 'radio-button-unchecked'}
            size={22}
            color={selected ? colors.primary : colors.icon}
          />
        </View>
      )}
      <View style={[styles.avatar, { backgroundColor: colors.secondaryLight }]}>
        <ThemedText style={styles.avatarText}>
          {friend.name.charAt(0)}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText style={styles.name}>{friend.name}</ThemedText>
        <ThemedText style={[styles.phone, { color: colors.textSecondary }]}>
          {friend.phone}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
  },
});
