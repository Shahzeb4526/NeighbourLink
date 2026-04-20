import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  TextInput,
} from "react-native";

const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "loan", label: "My Loan", icon: "📦" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "community", label: "Community", icon: "👥" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function MessagesScreen({
  activeTab = "messages",
  onNavigate,
  openThreadId,
  onConsumeOpenThread,
  messages = [],
  threads = {},
  onSendMessage,
}) {
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const activeThread = useMemo(
    () =>
      [...(threads[activeThreadId] || [])].sort(
        (left, right) => (left.timestamp || 0) - (right.timestamp || 0),
      ),
    [activeThreadId, threads],
  );

  const activeContact = useMemo(
    () => messages.find((item) => String(item.id) === String(activeThreadId)),
    [activeThreadId, messages],
  );

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return messages;
    }
    return messages.filter((item) =>
      `${item.name} ${item.subject}`.toLowerCase().includes(query),
    );
  }, [messages, searchQuery]);

  const openThread = (item) => {
    setActiveThreadId(String(item.id));
  };

  const closeThread = () => {
    setActiveThreadId(null);
    setDraftMessage("");
  };

  const sendMessage = () => {
    if (!draftMessage.trim() || !activeThreadId) {
      return;
    }
    onSendMessage?.(String(activeThreadId), draftMessage.trim(), {
      name: activeContact?.name,
      subject: activeContact?.subject,
      userId: activeContact?.userId || null,
    });
    setDraftMessage("");
  };

  useEffect(() => {
    if (openThreadId) {
      setActiveThreadId(String(openThreadId));
      onConsumeOpenThread?.();
    }
  }, [openThreadId, onConsumeOpenThread]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Messages</Text>

          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.messageRow}
                activeOpacity={0.7}
                onPress={() => openThread(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>
                <View style={styles.messageBody}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageName}>{item.name}</Text>
                    <Text style={styles.messageTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.messageSubject}>{item.subject}</Text>
                  <Text style={styles.messagePreview}>{item.preview}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <Modal
          visible={!!activeThreadId}
          animationType="slide"
          onRequestClose={closeThread}
        >
          <SafeAreaView style={styles.chatSafeArea}>
            <KeyboardAvoidingView
              style={styles.chatContainer}
              behavior={Platform.select({ ios: "padding", android: "height" })}
              keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
            >
              <View style={styles.chatHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  activeOpacity={0.7}
                  onPress={closeThread}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.chatTitle}>{activeContact?.name}</Text>
                <View style={styles.chatHeaderSpacer} />
              </View>

              <FlatList
                data={activeThread}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatList}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.chatBubble,
                      item.from === "me"
                        ? styles.chatBubbleMe
                        : styles.chatBubbleThem,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chatText,
                        item.from === "me"
                          ? styles.chatTextMe
                          : styles.chatTextThem,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text style={styles.chatTime}>{item.time}</Text>
                  </View>
                )}
              />

              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  value={draftMessage}
                  onChangeText={setDraftMessage}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  activeOpacity={0.8}
                  onPress={sendMessage}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>

      <View style={styles.bottomBar}>
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomItem}
              activeOpacity={0.7}
              onPress={() => onNavigate?.(item.id)}
            >
              <Text
                style={[styles.bottomIcon, isActive && styles.bottomIconActive]}
              >
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.bottomLabel,
                  isActive && styles.bottomLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingTop: Platform.select({ android: 12, ios: 0, default: 0 }),
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 10 }),
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  listContent: {
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  messageBody: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  messageTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  messageSubject: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  messagePreview: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  chatSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 10, android: 12, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  chatHeaderSpacer: {
    width: 60,
  },
  chatList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 10,
  },
  chatBubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: "#2563EB",
  },
  chatBubbleThem: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
  },
  chatText: {
    fontSize: 13,
  },
  chatTextMe: {
    color: "#FFFFFF",
  },
  chatTextThem: {
    color: "#111827",
  },
  chatTime: {
    marginTop: 4,
    fontSize: 10,
    color: "#D1D5DB",
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 10, android: 10, default: 10 }),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: Platform.select({ ios: 16, android: 10, default: 10 }),
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 10 }),
    marginRight: 8,
    fontSize: 13,
    color: "#111827",
  },
  sendButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 12, android: 22, default: 12 }),
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
  },
  bottomIcon: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  bottomIconActive: {
    color: "#2563EB",
  },
  bottomLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  bottomLabelActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
