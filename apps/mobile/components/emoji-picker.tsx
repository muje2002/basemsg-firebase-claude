import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const EMOJI_LIST = [
  // Smileys
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘',
  '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪',
  '😝', '🤗', '🤭', '🤫', '🤔', '😐', '😑', '😶',
  // Gestures
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👋', '🤚', '🖐️', '✋', '👏', '🙌', '🤝', '🙏',
  // Hearts
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
  // Objects
  '🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '🌟', '💫',
  '🔥', '💯', '✨', '💥', '💢', '💤', '💬', '🗨️',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>이모티콘</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {EMOJI_LIST.map((emoji, i) => (
          <TouchableOpacity
            key={`${emoji}-${i}`}
            style={styles.emojiButton}
            onPress={() => onSelect(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
});
