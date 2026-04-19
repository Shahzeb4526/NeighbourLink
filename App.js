import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CommunityScreen from "./screens/CommunityScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import MessagesScreen from "./screens/MessagesScreen";
import MyItemsScreen from "./screens/MyItemsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { createItem, deleteItem } from "./services/apiClient";
import {
  approveBorrowRequestDirect,
  createBorrowRequestDirect,
  declineBorrowRequestDirect,
  readIncomingBorrowRequestsDirect,
  readOutgoingBorrowRequestsDirect,
} from "./services/borrowRequestsService";
import {
  createUserItemDirect,
  deleteUserItemDirect,
  readAllItemsDirect,
  readUserItemsDirect,
} from "./services/itemsService";
import {
  loadMessagesDirect,
  resolveReceiverUserIdDirect,
  sendMessageDirect,
} from "./services/messagesService";
import {
  getSession,
  signIn,
  signOut,
  signUp as supabaseSignUp,
  supabase,
} from "./services/supabaseClient";
import {
  readBackendUserEmail,
  upsertUserProfileDirect,
} from "./services/usersService";

const initialMessages = [
  {
    id: "1",
    initials: "AC",
    name: "Ava Carter",
    subject: "Cordless Hedge Trimmer",
    preview: "Hi! The trimmer is available this weekend.",
    time: "2h ago",
  },
  {
    id: "2",
    initials: "LW",
    name: "Leo White",
    subject: "Electric Lawn Mower",
    preview: "The mower is ready if you want to pick it up.",
    time: "3h ago",
  },
  {
    id: "3",
    initials: "NR",
    name: "Nora Reed",
    subject: "Power Drill + Bits",
    preview: "Happy to lend it out this week.",
    time: "1d ago",
  },
  {
    id: "4",
    initials: "OS",
    name: "Omar Singh",
    subject: "Leaf Blower",
    preview: "Let me know a good time for pickup.",
    time: "2d ago",
  },
  {
    id: "5",
    initials: "MB",
    name: "Maya Brooks",
    subject: "Extension Ladder",
    preview: "I can drop it off Friday evening.",
    time: "3d ago",
  },
  {
    id: "6",
    initials: "JP",
    name: "Jordan Park",
    subject: "Pressure Washer",
    preview: "It’s available tomorrow morning.",
    time: "4d ago",
  },
  {
    id: "7",
    initials: "CK",
    name: "Chloe Kim",
    subject: "Cordless Vacuum",
    preview: "You can borrow it this weekend.",
    time: "5d ago",
  },
  {
    id: "8",
    initials: "DT",
    name: "Dylan Tran",
    subject: "Outdoor String Lights",
    preview: "They’re free if you want them.",
    time: "6d ago",
  },
];

const initialThreads = {
  1: [
    {
      id: "1-1",
      from: "them",
      text: "Hi! The trimmer is free this weekend.",
      time: "2h",
    },
  ],
  2: [
    {
      id: "2-1",
      from: "them",
      text: "The mower is ready for pickup.",
      time: "3h",
    },
  ],
  3: [
    {
      id: "3-1",
      from: "them",
      text: "Happy to lend it out this week.",
      time: "1d",
    },
  ],
  4: [
    {
      id: "4-1",
      from: "them",
      text: "Let me know a good time for pickup.",
      time: "2d",
    },
  ],
  5: [
    {
      id: "5-1",
      from: "them",
      text: "I can drop it off Friday evening.",
      time: "3d",
    },
  ],
  6: [
    {
      id: "6-1",
      from: "them",
      text: "It’s available tomorrow morning.",
      time: "4d",
    },
  ],
  7: [
    {
      id: "7-1",
      from: "them",
      text: "You can borrow it this weekend.",
      time: "5d",
    },
  ],
  8: [
    {
      id: "8-1",
      from: "them",
      text: "They’re free if you want them.",
      time: "6d",
    },
  ],
};

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [openThreadId, setOpenThreadId] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [threads, setThreads] = useState(initialThreads);
  const [homeListings, setHomeListings] = useState(null);
  const [myItemsData, setMyItemsData] = useState(null);
  const [savedItemsData, setSavedItemsData] = useState([]);
  const [outgoingBorrowRequests, setOutgoingBorrowRequests] = useState([]);
  const [incomingBorrowRequests, setIncomingBorrowRequests] = useState([]);
  const [messageBanner, setMessageBanner] = useState(null);
  const [unreadIncomingCount, setUnreadIncomingCount] = useState(0);
  const hasHydratedMessagesRef = useRef(false);
  const seenIncomingMessageIdsRef = useRef(new Set());
  const unreadIncomingMessageIdsRef = useRef(new Set());
  const bannerTimerRef = useRef(null);

  const getInitials = (name) => {
    if (!name) {
      return "";
    }
    const parts = name.split(" ").filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts[1]?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const tabs = useMemo(
    () => ({
      home: HomeScreen,
      loan: MyItemsScreen,
      messages: MessagesScreen,
      community: CommunityScreen,
      profile: ProfileScreen,
    }),
    [],
  );

  const ActiveScreen = tabs[activeTab] || HomeScreen;

  const restartBannerTimer = () => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = setTimeout(() => {
      setMessageBanner(null);
    }, 6000);
  };

  const formatDueLabel = (dateValue) => {
    if (!dateValue) {
      return undefined;
    }
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return `Due back: ${parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  const getFallbackImageByName = (title = "", category = "") => {
    const name = String(title).toLowerCase();
    const group = String(category).toLowerCase();

    if (name.includes("drill")) {
      return "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80";
    }
    if (name.includes("pruning") || name.includes("shears")) {
      return "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80";
    }
    if (name.includes("ladder")) {
      return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80";
    }
    if (group.includes("garden")) {
      return "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=900&q=80";
    }
    if (group.includes("tool")) {
      return "https://images.unsplash.com/photo-1581147036324-c1c14bbf4a02?auto=format&fit=crop&w=900&q=80";
    }
    return "https://images.unsplash.com/photo-1581091012184-7c7c6f3d7fcb?auto=format&fit=crop&w=900&q=80";
  };

  const mapUserItem = (item, index = 0) => ({
    id: String(item.id ?? index + 1),
    title: item.title || item.name || "My item",
    category: item.category || "Other",
    status: item.is_on_loan ? "On Loan" : "Available",
    due: formatDueLabel(item.due_date),
    image:
      item.image_url ||
      item.image ||
      getFallbackImageByName(item.title || item.name, item.category),
  });

  const normalizeListings = (items = []) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item, index) => ({
      id: String(item.id ?? item.item_id ?? index + 1),
      title: item.title || item.name || "Shared item",
      owner: item.owner_name || item.user_name || "Neighbour",
      ownerId: item.user_id || item.owner_id || null,
      category: (item.category || "tools").toLowerCase(),
      price: item.price_per_day
        ? `£${item.price_per_day}/day`
        : item.price || "£0/day",
      distance: item.distance || "Nearby",
      rating: String(item.rating || "4.8"),
      threadId: String(item.thread_id || item.id || index + 1),
      availabilityStatus:
        item.is_on_loan || String(item.status || "").toLowerCase() === "on_loan"
          ? "on_loan"
          : "available",
      image:
        item.image_url ||
        item.image ||
        getFallbackImageByName(item.title || item.name, item.category),
    }));
  };

  const toDueDateIso = (dueLabel = "") => {
    const parsed = new Date(String(dueLabel).replace("Due back: ", "").trim());
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  };

  const isHttp401 = (error) =>
    String(error?.message || "")
      .toUpperCase()
      .includes("HTTP 401");

  const refreshNearbyListings = async () => {
    try {
      const rows = await readAllItemsDirect();
      const normalized = normalizeListings(rows);
      setHomeListings(normalized.length ? normalized : null);
    } catch {
      setHomeListings(null);
    }
  };

  const refreshBorrowRequests = async (userId) => {
    if (!userId) {
      setOutgoingBorrowRequests([]);
      setIncomingBorrowRequests([]);
      return;
    }

    try {
      const [outgoingRows, incomingRows] = await Promise.all([
        readOutgoingBorrowRequestsDirect(userId),
        readIncomingBorrowRequestsDirect(userId),
      ]);

      setOutgoingBorrowRequests(outgoingRows || []);
      setIncomingBorrowRequests(
        (incomingRows || []).map((row) => ({
          id: String(row.id),
          itemId: String(row.item_id),
          itemTitle: row.items?.title || "Item",
          borrowerUserId: String(row.borrower_user_id || ""),
          requestedStartDate: row.requested_start_date || null,
          requestedEndDate: row.requested_end_date || null,
          status: String(row.status || "pending"),
          createdAt: row.created_at || null,
        })),
      );
    } catch {
      setOutgoingBorrowRequests([]);
      setIncomingBorrowRequests([]);
    }
  };

  const hydrateMessagesFromApi = (
    apiMessages = [],
    userId = "",
    options = {},
  ) => {
    if (!Array.isArray(apiMessages)) {
      return;
    }

    const { showIncomingNotification = false } = options;
    const isFirstHydration = !hasHydratedMessagesRef.current;

    if (!apiMessages.length) {
      // Mark hydration complete even for empty history so first new incoming
      // message after login can trigger a banner notification.
      hasHydratedMessagesRef.current = true;
      return;
    }

    const nextMessages = [];
    const nextThreads = {};
    const incomingNewMessages = [];

    apiMessages.forEach((entry, index) => {
      const threadId = String(
        entry.thread_id ||
          entry.conversation_id ||
          entry.request_id ||
          entry.id ||
          index + 1,
      );
      const senderId = String(entry.sender_id || entry.from_user_id || "");
      const receiverId = String(entry.receiver_id || entry.to_user_id || "");
      const currentUserId = String(userId || "");
      const isMe =
        Boolean(senderId) && Boolean(currentUserId)
          ? senderId === currentUserId
          : false;
      const otherUserId = isMe ? receiverId : senderId;
      if (!otherUserId) {
        return;
      }
      const senderName = entry.sender_name || entry.from_user_name || null;
      const receiverName = entry.receiver_name || entry.to_user_name || null;
      const contactName =
        (isMe ? receiverName : senderName) ||
        entry.other_user_name ||
        "Neighbour";
      const subject = entry.item_title || entry.subject || "Message";
      const text = String(
        entry.content || entry.message || entry.message_text || "",
      ).trim();
      const messageId = String(entry.id || `${threadId}-${index}`);
      const time = entry.created_at
        ? new Date(entry.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "now";
      const timestamp = entry.created_at
        ? new Date(entry.created_at).getTime()
        : Date.now() + index;

      const isIncoming = Boolean(currentUserId)
        ? (Boolean(receiverId) && receiverId === currentUserId) ||
          (Boolean(senderId) && senderId !== currentUserId)
        : false;
      const hasSeenIncoming = seenIncomingMessageIdsRef.current.has(messageId);
      const isVeryRecent =
        Number.isFinite(timestamp) && timestamp > Date.now() - 20 * 1000;
      if (
        isIncoming &&
        !hasSeenIncoming &&
        (!isFirstHydration || isVeryRecent)
      ) {
        incomingNewMessages.push({
          messageId,
          contactName,
          text: text || "You received a new message.",
          threadId,
          timestamp,
        });
      }
      if (isIncoming) {
        seenIncomingMessageIdsRef.current.add(messageId);
      }

      if (!nextThreads[threadId]) {
        nextThreads[threadId] = [];
      }
      nextThreads[threadId].push({
        id: messageId,
        from: isMe ? "me" : "them",
        text,
        time,
        timestamp,
      });

      if (!nextMessages.find((row) => row.id === threadId)) {
        nextMessages.push({
          id: threadId,
          initials: getInitials(contactName),
          name: contactName,
          userId: otherUserId || null,
          subject,
          preview: text,
          time,
        });
      }
    });

    if (nextMessages.length) {
      setMessages(nextMessages);
      setThreads(nextThreads);
    }

    if (showIncomingNotification && incomingNewMessages.length) {
      const sortedIncoming = [...incomingNewMessages].sort(
        (left, right) => (right.timestamp || 0) - (left.timestamp || 0),
      );
      const latest = sortedIncoming[0];

      sortedIncoming.forEach((entry) => {
        unreadIncomingMessageIdsRef.current.add(String(entry.messageId));
      });

      const nextCount = unreadIncomingMessageIdsRef.current.size;
      setUnreadIncomingCount(nextCount);
      setMessageBanner({
        title: nextCount > 1 ? "New messages" : "New message",
        body:
          nextCount > 1
            ? `${nextCount} unread messages. Tap to open.`
            : `${latest.contactName}: ${latest.text}`,
        threadId: latest.threadId,
      });
      restartBannerTimer();
    }

    hasHydratedMessagesRef.current = true;
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await getSession();
        if (!session?.access_token) {
          return;
        }
        setAuthToken(session.access_token);
        setCurrentUser(session.user || null);
        setIsSignedIn(true);
        await upsertUserProfileDirect(session.user || null);
      } catch {
        setIsSignedIn(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    hasHydratedMessagesRef.current = false;
    seenIncomingMessageIdsRef.current = new Set();
    unreadIncomingMessageIdsRef.current = new Set();
    setMessages([]);
    setThreads({});
    setUnreadIncomingCount(0);
    setMessageBanner(null);
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeTab === "messages") {
      unreadIncomingMessageIdsRef.current = new Set();
      setUnreadIncomingCount(0);
      setMessageBanner(null);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authToken || !currentUser?.id) {
      return;
    }

    let isCancelled = false;

    const loadMessages = async () => {
      try {
        const rows = await loadMessagesDirect(currentUser.id);
        if (isCancelled) {
          return;
        }
        hydrateMessagesFromApi(rows, currentUser.id, {
          showIncomingNotification: true,
        });
      } catch {
        // keep previous local state on transient read failures
      }
    };

    loadMessages();
    const intervalId = setInterval(loadMessages, 5000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [authToken, currentUser?.id, activeTab]);

  useEffect(() => {
    if (!authToken || !currentUser?.id) {
      return;
    }

    const channel = supabase
      .channel(`incoming-messages-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload?.new || {};
          const receiverUserId = String(
            row.receiver_user_id || row.receiver_id || "",
          );
          const senderUserId = String(
            row.sender_user_id || row.sender_id || "",
          );
          const currentUserId = String(currentUser.id || "");

          const isIncomingForCurrentUser =
            Boolean(receiverUserId) &&
            receiverUserId === currentUserId &&
            senderUserId !== currentUserId;

          if (!isIncomingForCurrentUser) {
            return;
          }

          const messageId = String(
            row.id ||
              `${row.thread_id || row.transaction_id || "thread"}-${row.sent_at || row.created_at || Date.now()}`,
          );

          if (seenIncomingMessageIdsRef.current.has(messageId)) {
            return;
          }

          seenIncomingMessageIdsRef.current.add(messageId);
          unreadIncomingMessageIdsRef.current.add(messageId);

          const nextCount = unreadIncomingMessageIdsRef.current.size;
          const text = String(
            row.message_text || row.message || row.content || "New message",
          ).trim();
          const threadId = String(
            row.thread_id || row.transaction_id || row.id || "",
          );

          setUnreadIncomingCount(nextCount);
          setMessageBanner({
            title: nextCount > 1 ? "New messages" : "New message",
            body:
              nextCount > 1
                ? `${nextCount} unread messages. Tap to open.`
                : text || "You received a new message.",
            threadId,
          });
          restartBannerTimer();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authToken, currentUser?.id]);

  useEffect(() => {
    refreshNearbyListings();
  }, []);

  useEffect(() => {
    const loadUserItems = async () => {
      if (!currentUser?.id) {
        setMyItemsData([]);
        return;
      }

      try {
        const userItems = await readUserItemsDirect(currentUser.id);
        setMyItemsData(
          userItems.map((item, index) => mapUserItem(item, index)),
        );
      } catch {
        setMyItemsData([]);
      }
    };

    loadUserItems();
  }, [authToken, currentUser?.id]);

  useEffect(() => {
    if (!authToken || !currentUser?.id) {
      setOutgoingBorrowRequests([]);
      setIncomingBorrowRequests([]);
      return;
    }

    let cancelled = false;

    const loadRequests = async () => {
      if (cancelled) {
        return;
      }
      await refreshBorrowRequests(currentUser.id);
    };

    loadRequests();
    const intervalId = setInterval(loadRequests, 7000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [authToken, currentUser?.id]);

  const handleSignIn = async (email, password) => {
    setMyItemsData([]);
    const data = await signIn(email, password);
    const session = data?.session;

    const typedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const backendEmail = await readBackendUserEmail(session?.user?.id);
    if (
      backendEmail &&
      typedEmail &&
      backendEmail.toLowerCase() !== typedEmail
    ) {
      await signOut();
      throw new Error(`Use your updated email to sign in: ${backendEmail}`);
    }

    setAuthToken(session?.access_token || null);
    setCurrentUser(session?.user || null);
    setIsSignedIn(true);
    await upsertUserProfileDirect(session?.user || null);
    return true;
  };

  const handleCreateAccount = async (email, password, metadata = {}) => {
    const fullName = String(metadata?.full_name || email.split("@")[0]).trim();
    const data = await supabaseSignUp(email, password, {
      full_name: fullName,
    });

    if (data?.alreadyRegistered) {
      try {
        await handleSignIn(email, password);
        return { requiresEmailConfirmation: false };
      } catch {
        throw new Error(
          "Account already exists. Use Sign In, or reset password if needed.",
        );
      }
    }

    const session = data?.session;
    if (session?.access_token) {
      setAuthToken(session.access_token);
      setCurrentUser(session.user || null);
      setIsSignedIn(true);
      await upsertUserProfileDirect(session.user || null);
      return { requiresEmailConfirmation: false };
    }

    return { requiresEmailConfirmation: true };
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthToken(null);
    setCurrentUser(null);
    setMyItemsData([]);
    setOutgoingBorrowRequests([]);
    setIncomingBorrowRequests([]);
    setMessages([]);
    setThreads({});
    hasHydratedMessagesRef.current = false;
    seenIncomingMessageIdsRef.current = new Set();
    unreadIncomingMessageIdsRef.current = new Set();
    setIsSignedIn(false);
    setActiveTab("home");
    setOpenThreadId(null);
    setMessageBanner(null);
    setUnreadIncomingCount(0);
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
  };

  const handleDismissMessageBanner = () => {
    setMessageBanner(null);
  };

  const handleOpenMessageBanner = () => {
    if (messageBanner?.threadId) {
      setActiveTab("messages");
      setOpenThreadId(String(messageBanner.threadId));
    }
    setMessageBanner(null);
    unreadIncomingMessageIdsRef.current = new Set();
    setUnreadIncomingCount(0);
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
  };

  const handleMessageOwner = (threadId, options = {}) => {
    if (options.resetThread) {
      setThreads((current) => ({
        ...current,
        [threadId]: [],
      }));
    }
    if (options?.contact) {
      setMessages((current) => {
        const exists = current.some(
          (item) => String(item.id) === String(threadId),
        );
        if (exists) {
          return current.map((item) =>
            String(item.id) === String(threadId)
              ? {
                  ...item,
                  name: options.contact?.name || item.name,
                  initials: options.contact?.name
                    ? getInitials(options.contact.name)
                    : item.initials,
                  userId: options.contact?.userId || item.userId || null,
                  subject: options.contact?.subject || item.subject,
                }
              : item,
          );
        }

        return [
          {
            id: String(threadId),
            name: options.contact?.name || "Neighbour",
            initials: getInitials(options.contact?.name || "Neighbour"),
            userId: options.contact?.userId || null,
            subject: options.contact?.subject || "Message",
            preview: "",
            time: "now",
          },
          ...current,
        ];
      });
    }
    setActiveTab("messages");
    setOpenThreadId(threadId);
  };

  const handleAddMyItem = async (itemDraft) => {
    const session = await getSession();
    const token = authToken || session?.access_token;
    const userId = currentUser?.id || session?.user?.id;

    if (!token || !userId) {
      throw new Error("Session expired. Please sign in again.");
    }

    if (!authToken && session?.access_token) {
      setAuthToken(session.access_token);
      setCurrentUser(session.user || currentUser);
    }

    const dueDateIso = itemDraft?.due ? toDueDateIso(itemDraft.due) : null;
    const payload = {
      title: itemDraft?.title || "My item",
      category: itemDraft?.category || "Other",
      status: "available",
      is_on_loan: false,
      price_per_day: 0,
      ...(itemDraft?.image ? { image_url: itemDraft.image } : {}),
      ...(dueDateIso ? { due_date: dueDateIso } : {}),
      user_id: userId,
    };

    let created;
    try {
      let response;
      try {
        response = await createItem(token, payload);
      } catch (error) {
        if (!isHttp401(error)) {
          throw error;
        }
        response = await createItem(null, payload);
      }

      created = response?.data || response;
    } catch (error) {
      try {
        created = await createUserItemDirect(payload);
      } catch (directError) {
        throw new Error(
          `Item save failed via API (${error.message}) and direct DB (${directError.message}).`,
        );
      }
    }

    if (!created || (!created.id && !created.item_id)) {
      throw new Error("Backend did not return the created item.");
    }

    const source = await readUserItemsDirect(userId);

    await refreshNearbyListings();

    if (Array.isArray(source)) {
      setMyItemsData(source.map((item, index) => mapUserItem(item, index)));
    }

    return mapUserItem(created, 0);
  };

  const handleSendBorrowRequest = async (item) => {
    const session = await getSession();
    const borrowerUserId = currentUser?.id || session?.user?.id;

    if (!borrowerUserId) {
      throw new Error("Session expired. Please sign in again.");
    }

    const itemId = String(item?.id || "");
    if (!itemId) {
      throw new Error("Missing listing id.");
    }

    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);
    const due = new Date(now);
    due.setDate(due.getDate() + 7);
    const endDate = due.toISOString().slice(0, 10);

    await createBorrowRequestDirect({
      itemId,
      borrowerUserId,
      requestedStartDate: startDate,
      requestedEndDate: endDate,
    });

    await refreshBorrowRequests(borrowerUserId);
    await refreshNearbyListings();
  };

  const handleApproveBorrowRequest = async (requestId) => {
    const session = await getSession();
    const ownerUserId = currentUser?.id || session?.user?.id;

    if (!ownerUserId) {
      throw new Error("Session expired. Please sign in again.");
    }

    await approveBorrowRequestDirect(requestId, ownerUserId);
    await refreshBorrowRequests(ownerUserId);

    const userItems = await readUserItemsDirect(ownerUserId);
    setMyItemsData(userItems.map((item, index) => mapUserItem(item, index)));
    await refreshNearbyListings();
  };

  const handleDeclineBorrowRequest = async (requestId) => {
    const session = await getSession();
    const ownerUserId = currentUser?.id || session?.user?.id;

    if (!ownerUserId) {
      throw new Error("Session expired. Please sign in again.");
    }

    await declineBorrowRequestDirect(requestId);
    await refreshBorrowRequests(ownerUserId);
  };

  const handleSendMessage = (threadId, text, contact) => {
    const send = async () => {
      const session = await getSession();
      const senderUserId = currentUser?.id || session?.user?.id;
      if (!senderUserId) {
        Alert.alert("Message failed", "Session expired. Please sign in again.");
        return;
      }

      if (!authToken && session?.access_token) {
        setAuthToken(session.access_token);
        setCurrentUser(session.user || currentUser);
      }

      const receiverUserId = await resolveReceiverUserIdDirect(
        threadId,
        contact,
        {
          cachedMessages: messages,
          currentUserId: currentUser?.id,
        },
      );
      if (!receiverUserId) {
        Alert.alert(
          "Message not sent",
          "Could not find the recipient account for this chat.",
        );
        return;
      }

      const resolvedContact = {
        ...contact,
        userId: receiverUserId,
      };

      let sendSucceeded = false;
      let sendErrorMessage = "";
      try {
        await sendMessageDirect(senderUserId, threadId, text, resolvedContact);
        sendSucceeded = true;
      } catch (error) {
        sendErrorMessage = error?.message || "Direct send failed.";
        sendSucceeded = false;
      }

      if (!sendSucceeded) {
        Alert.alert(
          "Message failed",
          sendErrorMessage ||
            "Could not deliver your message right now. Please try again.",
        );
        return;
      }

      const newMessage = {
        id: `${threadId}-${Date.now()}`,
        from: "me",
        text,
        time: "now",
        timestamp: Date.now(),
      };
      setThreads((current) => ({
        ...current,
        [threadId]: [...(current[threadId] || []), newMessage],
      }));
      setMessages((current) => {
        const existing = current.find((item) => item.id === threadId);
        if (existing) {
          return current.map((item) =>
            item.id === threadId
              ? {
                  ...item,
                  name: resolvedContact?.name || item.name,
                  initials: resolvedContact?.name
                    ? getInitials(resolvedContact.name)
                    : item.initials,
                  userId: receiverUserId,
                  subject: resolvedContact?.subject || item.subject,
                  preview: text,
                  time: "now",
                }
              : item,
          );
        }
        return [
          {
            id: threadId,
            name: resolvedContact?.name || "Unknown",
            initials: getInitials(resolvedContact?.name || ""),
            userId: receiverUserId,
            subject: resolvedContact?.subject || "New message",
            preview: text,
            time: "now",
          },
          ...current,
        ];
      });
    };

    send();
  };

  const handleDeleteMyItem = async (itemId) => {
    const session = await getSession();
    const token = authToken || session?.access_token;
    const userId = currentUser?.id || session?.user?.id;

    if (!token || !userId) {
      throw new Error("Session expired. Please sign in again.");
    }

    if (!itemId) {
      throw new Error("Missing item id.");
    }

    try {
      try {
        await deleteItem(token, itemId);
      } catch (error) {
        if (!isHttp401(error)) {
          throw error;
        }
        await deleteItem(null, itemId);
      }
    } catch (error) {
      await deleteUserItemDirect(userId, itemId);
    }

    const source = (await readUserItemsDirect(userId)) || [];

    await refreshNearbyListings();

    if (Array.isArray(source)) {
      setMyItemsData(source.map((item, index) => mapUserItem(item, index)));
    }
  };

  const handleToggleSaveItem = (item) => {
    if (!item?.id) {
      return;
    }
    setSavedItemsData((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      if (exists) {
        return current.filter((entry) => entry.id !== item.id);
      }
      return [item, ...current];
    });
  };

  const handleUpdateProfile = async (profileData) => {
    if (!currentUser?.id) {
      throw new Error("No active user session.");
    }

    const { fullName, email, location, phone } = profileData;
    const nextEmail = String(email || "").trim();
    const currentEmail = String(currentUser?.email || "").trim();
    const emailChanged =
      Boolean(nextEmail) &&
      nextEmail.toLowerCase() !== currentEmail.toLowerCase();

    const normalizeEmailUpdateError = (message = "") => {
      const raw = String(message || "").trim();
      const lower = raw.toLowerCase();

      if (lower.includes("already") && lower.includes("registered")) {
        return "That email is already in use by another account.";
      }
      if (lower.includes("invalid") && lower.includes("email")) {
        return "Please enter a valid email address.";
      }
      if (lower.includes("rate") && lower.includes("limit")) {
        return "Too many email update attempts. Please wait and try again.";
      }
      if (lower.includes("reauth") || lower.includes("reauthentication")) {
        return "Please sign in again before changing your email address.";
      }

      return raw || "Unable to update the email address right now.";
    };

    try {
      const { data: profileDataResult, error: profileError } =
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            location: location || "",
            phone: phone || "",
          },
        });

      if (profileError) {
        throw new Error(profileError.message || "Failed to update profile.");
      }

      let emailUpdatePending = false;
      let emailUpdateError = null;

      if (emailChanged) {
        const { data: emailDataResult, error: emailError } =
          await supabase.auth.updateUser({
            email: nextEmail,
          });

        if (emailError) {
          emailUpdateError = normalizeEmailUpdateError(emailError.message);
        } else {
          emailUpdatePending =
            String(emailDataResult?.user?.email || "").toLowerCase() !==
            nextEmail.toLowerCase();
        }
      }

      const syncedEmail =
        emailChanged && !emailUpdateError
          ? nextEmail
          : profileDataResult?.user?.email || currentUser?.email || null;
      await upsertUserProfileDirect(profileDataResult?.user || currentUser, {
        email: syncedEmail,
        full_name: fullName,
        phone: phone || null,
      });

      const nextUser = {
        ...(profileDataResult?.user || currentUser || {}),
        email: syncedEmail,
        user_metadata: {
          ...((profileDataResult?.user || currentUser)?.user_metadata || {}),
          full_name: fullName,
          location: location || "",
          phone: phone || "",
        },
      };
      setCurrentUser(nextUser);

      if (emailUpdateError) {
        return {
          success: true,
          profileUpdated: true,
          emailChanged,
          emailUpdated: false,
          emailUpdatePending: false,
          emailError: emailUpdateError,
          requestedEmail: nextEmail,
        };
      }

      return {
        success: true,
        profileUpdated: true,
        emailChanged,
        emailUpdated: emailChanged ? !emailUpdatePending : true,
        emailUpdatePending,
        requestedEmail: nextEmail,
      };
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {isSignedIn ? (
        <View style={styles.appRoot}>
          <Modal
            visible={Boolean(messageBanner)}
            transparent
            animationType="fade"
            onRequestClose={handleDismissMessageBanner}
          >
            <View style={styles.bannerModalOverlay} pointerEvents="box-none">
              {messageBanner ? (
                <View style={styles.banner}>
                  <TouchableOpacity
                    style={styles.bannerMain}
                    activeOpacity={0.9}
                    onPress={handleOpenMessageBanner}
                  >
                    <Text style={styles.bannerTitle}>
                      {messageBanner.title}
                    </Text>
                    <Text style={styles.bannerText} numberOfLines={2}>
                      {messageBanner.body}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bannerClose}
                    activeOpacity={0.8}
                    onPress={handleDismissMessageBanner}
                  >
                    <Text style={styles.bannerCloseText}>x</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </Modal>

          <ActiveScreen
            activeTab={activeTab}
            onNavigate={setActiveTab}
            onMessageOwner={handleMessageOwner}
            openThreadId={openThreadId}
            onConsumeOpenThread={() => setOpenThreadId(null)}
            messages={messages}
            threads={threads}
            onSendMessage={handleSendMessage}
            onSendBorrowRequest={handleSendBorrowRequest}
            onApproveBorrowRequest={handleApproveBorrowRequest}
            onDeclineBorrowRequest={handleDeclineBorrowRequest}
            listingsData={homeListings}
            borrowRequestsData={outgoingBorrowRequests}
            incomingBorrowRequests={incomingBorrowRequests}
            savedItemsData={savedItemsData}
            onToggleSaveItem={handleToggleSaveItem}
            myItemsData={myItemsData}
            onAddItem={handleAddMyItem}
            onDeleteItem={handleDeleteMyItem}
            userId={currentUser?.id || ""}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onUpdateProfile={handleUpdateProfile}
          />
        </View>
      ) : (
        <LoginScreen
          onSignIn={handleSignIn}
          onCreateAccount={handleCreateAccount}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  bannerModalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
  },
  banner: {
    position: "absolute",
    top: 54,
    left: 12,
    right: 12,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 30,
    elevation: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bannerMain: {
    flex: 1,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  bannerText: {
    color: "#E5E7EB",
    fontSize: 13,
  },
  bannerClose: {
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bannerCloseText: {
    color: "#E5E7EB",
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "600",
  },
});
