import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Message } from '@basemsg/shared';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

const TYPE_ICONS: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  image: { icon: 'image', label: '사진' },
  video: { icon: 'videocam', label: '동영상' },
  file: { icon: 'attach-file', label: '파일' },
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const isAttachment = message.type === 'image' || message.type === 'video' || message.type === 'file';
  const isEmoji = message.type === 'emoji';
  const typeInfo = TYPE_ICONS[message.type];

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.ownBubble, { backgroundColor: colors.messageOwn }]
            : [styles.otherBubble, { backgroundColor: colors.messageOther }],
          isEmoji && styles.emojiBubble,
        ]}
      >
        {isAttachment && typeInfo && (
          <View style={styles.attachmentRow}>
            <MaterialIcons name={typeInfo.icon} size={18} color={colors.primary} />
            <ThemedText style={[styles.attachmentLabel, { color: colors.primary }]}>
              {message.fileName ?? typeInfo.label}
            </ThemedText>
          </View>
        )}
        <ThemedText
          style={[
            isEmoji ? styles.emojiText : styles.text,
            isOwn && { color: colorScheme === 'dark' ? '#ECEDEE' : '#2D3436' },
          ]}
        >
          {message.text}
        </ThemedText>
      </View>
      <ThemedText style={[styles.time, { color: colors.textSecondary }, isOwn && styles.ownTime]}>
        {formatMessageTime(message.createdAt)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: Spacing.lg,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ownBubble: {
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.sm,
  },
  otherBubble: {
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  emojiBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  emojiText: {
    fontSize: 40,
    lineHeight: 48,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  attachmentLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  time: {
    fontSize: 11,
    marginTop: 2,
    marginHorizontal: 4,
  },
  ownTime: {
    textAlign: 'right',
  },
});
