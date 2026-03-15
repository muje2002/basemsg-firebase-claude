import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { MessageBubble } from '@/components/message-bubble';
import { EmojiPicker } from '@/components/emoji-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMessages, saveMessage, getChatRooms } from '@/services/database';
import { apiFetchMessages, getCurrentUserId } from '@/services/api';
import { joinRoom, leaveRoom, onNewMessage, sendMessage as socketSend } from '@/services/socket';
import type { Message } from '@basemsg/shared';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [roomName, setRoomName] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  let currentUserId: string;
  try {
    currentUserId = getCurrentUserId();
  } catch {
    currentUserId = 'user-1';
  }

  const loadMessages = useCallback(async () => {
    if (!id) return;

    // Load room name from local
    const rooms = await getChatRooms();
    const room = rooms.find((r) => r.id === id);
    if (room) setRoomName(room.name);

    // Try to fetch from backend first
    try {
      const serverMsgs = await apiFetchMessages(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Message[] = serverMsgs.map((m: any) => ({
        id: m.id,
        chatRoomId: m.chatRoomId ?? id,
        senderId: m.senderId ?? m.sender?.id ?? '',
        text: m.text,
        type: m.type ?? 'text',
        fileUri: m.fileUri,
        fileName: m.fileName,
        createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
      }));
      setMessages(mapped);

      // Cache locally
      for (const msg of mapped) {
        await saveMessage(msg);
      }
    } catch {
      // Fallback to local messages
      const data = await getMessages(id);
      setMessages(data);
    }
  }, [id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Socket.io: join room and listen for messages
  useEffect(() => {
    if (!id) return;
    joinRoom(id);

    const unsubscribe = onNewMessage((message: Message) => {
      if (message.chatRoomId === id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
      leaveRoom(id);
      unsubscribe();
    };
  }, [id]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !id) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatRoomId: id,
      senderId: currentUserId,
      text,
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    setInputText('');
    setShowEmoji(false);
    setMessages((prev) => [...prev, newMessage]);
    await saveMessage(newMessage);

    // Send via socket for real-time broadcast
    socketSend(newMessage);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleAttachment = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '사진 선택', '카메라', '파일 선택'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage();
          else if (buttonIndex === 2) takePhoto();
          else if (buttonIndex === 3) pickFile();
        },
      );
    } else {
      Alert.alert('첨부', '파일을 선택하세요', [
        { text: '취소', style: 'cancel' },
        { text: '사진 선택', onPress: pickImage },
        { text: '카메라', onPress: takePhoto },
        { text: '파일 선택', onPress: pickFile },
      ]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';
      await sendAttachment(type, asset.uri, asset.fileName ?? `${type}_${Date.now()}`);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 사용 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await sendAttachment('image', asset.uri, `photo_${Date.now()}.jpg`);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await sendAttachment('file', asset.uri, asset.name);
    }
  };

  const sendAttachment = async (
    type: 'image' | 'video' | 'file',
    uri: string,
    name: string,
  ) => {
    if (!id) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      chatRoomId: id,
      senderId: currentUserId,
      text: type === 'image' ? '사진' : type === 'video' ? '동영상' : name,
      type,
      fileUri: uri,
      fileName: name,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    await saveMessage(msg);
    socketSend(msg);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {roomName}
        </ThemedText>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="more-vert" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === currentUserId} />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              메시지를 보내 대화를 시작하세요
            </ThemedText>
          </View>
        }
      />

      {/* Emoji Picker */}
      {showEmoji && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom || Spacing.sm }]}>
        <TouchableOpacity onPress={handleAttachment} style={styles.attachButton}>
          <MaterialIcons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEmoji(!showEmoji)} style={styles.emojiButton}>
          <MaterialIcons name="emoji-emotions" size={24} color={showEmoji ? colors.primary : colors.icon} />
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지 입력..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={5000}
            onFocus={() => setShowEmoji(false)}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
          disabled={!inputText.trim()}
        >
          <MaterialIcons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: Spacing.sm,
  },
  messageList: {
    paddingVertical: Spacing.sm,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
  },
  emojiButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    marginHorizontal: Spacing.xs,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
