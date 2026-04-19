import { supabase } from "./supabaseClient";

export const loadMessagesDirect = async (userId) => {
  const me = String(userId || "");

  const runQuery = async (senderColumn, receiverColumn, timeColumn) => {
    return supabase
      .from("messages")
      .select("*")
      .or(`${senderColumn}.eq.${me},${receiverColumn}.eq.${me}`)
      .order(timeColumn, { ascending: false })
      .limit(100);
  };

  let senderColumn = "sender_user_id";
  let receiverColumn = "receiver_user_id";
  let timeColumn = "sent_at";

  let { data, error } = await runQuery(
    senderColumn,
    receiverColumn,
    timeColumn,
  );

  // Backward-compatible fallback for schemas using sender_id/receiver_id + created_at.
  if (error) {
    const message = String(error.message || "").toLowerCase();
    const missingColumn =
      message.includes("could not find the") && message.includes("column");

    if (missingColumn) {
      senderColumn = "sender_id";
      receiverColumn = "receiver_id";
      timeColumn = "created_at";
      const retry = await runQuery(senderColumn, receiverColumn, timeColumn);
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    throw new Error(error.message || "Unable to load messages from Supabase.");
  }

  return (data || [])
    .filter((row) => {
      const senderId = String(
        row[senderColumn] || row.sender_user_id || row.sender_id || "",
      );
      const receiverId = String(
        row[receiverColumn] || row.receiver_user_id || row.receiver_id || "",
      );

      if (!senderId && !receiverId) {
        return false;
      }

      // Hide sent rows that have no recipient to avoid orphan duplicate threads.
      if (senderId === me && !receiverId) {
        return false;
      }

      return true;
    })
    .map((row) => ({
      id: row.id,
      thread_id: row.thread_id || row.transaction_id || row.id,
      sender_id: row[senderColumn] || row.sender_user_id || row.sender_id,
      receiver_id:
        row[receiverColumn] || row.receiver_user_id || row.receiver_id,
      item_title: row.item_title || "Message",
      content: row.message_text || row.message || row.content || "",
      created_at: row[timeColumn] || row.sent_at || row.created_at,
    }));
};

export const resolveReceiverUserIdDirect = async (
  threadId,
  contact = {},
  options = {},
) => {
  if (contact?.userId) {
    return String(contact.userId);
  }

  const cachedMessages = Array.isArray(options?.cachedMessages)
    ? options.cachedMessages
    : [];
  const cached = cachedMessages.find(
    (item) => String(item.id) === String(threadId),
  );
  if (cached?.userId) {
    return String(cached.userId);
  }

  const userId = options?.currentUserId;
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("sender_user_id, receiver_user_id")
      .eq("thread_id", String(threadId))
      .order("sent_at", { ascending: false })
      .limit(30);

    if (error) {
      return null;
    }

    for (const row of data || []) {
      const senderId = String(row.sender_user_id || "");
      const receiverId = String(row.receiver_user_id || "");
      if (senderId && senderId !== String(userId)) {
        return senderId;
      }
      if (receiverId && receiverId !== String(userId)) {
        return receiverId;
      }
    }

    // Fallback: try to infer recipient from prior contact name in this thread.
    const knownContactName = String(contact?.name || "").trim();
    if (knownContactName) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name")
        .neq("id", String(userId))
        .ilike("full_name", knownContactName)
        .limit(1);

      if (!usersError && usersData?.[0]?.id) {
        return String(usersData[0].id);
      }
    }
  } catch {
    // Try other strategies below.
  }

  // For first message from listing chat, threadId is often the item id.
  // Resolve the recipient as the owner of that item.
  try {
    const { data, error } = await supabase
      .from("items")
      .select("user_id")
      .eq("id", String(threadId))
      .maybeSingle();

    if (!error && data?.user_id && String(data.user_id) !== String(userId)) {
      return String(data.user_id);
    }
  } catch {
    // Continue to null return.
  }

  // Final fallback: resolve by contact full name in users table.
  const contactName = String(contact?.name || "").trim();
  if (contactName) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        .neq("id", String(userId))
        .ilike("full_name", contactName)
        .limit(1);

      if (!error && data?.[0]?.id) {
        return String(data[0].id);
      }
    } catch {
      // Continue to null return.
    }
  }

  return null;
};

export const sendMessageDirect = async (
  userId,
  threadId,
  text,
  contact = {},
) => {
  const isUuid = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || ""),
    );

  const resolveOrCreateTransactionId = async (senderUserId, receiverUserId) => {
    if (!senderUserId || !receiverUserId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("transaction_id")
        .eq("thread_id", String(threadId || ""))
        .not("transaction_id", "is", null)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.transaction_id) {
        return String(data.transaction_id);
      }
    } catch {
      // continue
    }

    if (isUuid(threadId)) {
      try {
        const { data, error } = await supabase
          .from("borrow_transactions")
          .select("id")
          .eq("id", String(threadId))
          .maybeSingle();
        if (!error && data?.id) {
          return String(data.id);
        }
      } catch {
        // continue
      }
    }

    try {
      const { data, error } = await supabase
        .from("borrow_transactions")
        .select("id")
        .or(
          `and(lender_user_id.eq.${receiverUserId},borrower_user_id.eq.${senderUserId}),and(lender_user_id.eq.${senderUserId},borrower_user_id.eq.${receiverUserId})`,
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) {
        return String(data.id);
      }
    } catch {
      // continue
    }

    if (!isUuid(threadId)) {
      return null;
    }

    try {
      const start = new Date();
      const due = new Date(start);
      due.setDate(due.getDate() + 7);
      const startDate = start.toISOString().slice(0, 10);
      const dueDate = due.toISOString().slice(0, 10);

      const { data: requestData, error: requestError } = await supabase
        .from("borrow_requests")
        .insert({
          item_id: String(threadId),
          borrower_user_id: String(senderUserId),
          requested_start_date: startDate,
          requested_end_date: dueDate,
          status: "approved",
        })
        .select("id")
        .single();

      if (requestError || !requestData?.id) {
        return null;
      }

      const { data: transactionData, error: transactionError } = await supabase
        .from("borrow_transactions")
        .insert({
          request_id: String(requestData.id),
          lender_user_id: String(receiverUserId),
          borrower_user_id: String(senderUserId),
          start_date: startDate,
          due_date: dueDate,
          status: "active",
        })
        .select("id")
        .single();

      if (!transactionError && transactionData?.id) {
        return String(transactionData.id);
      }
    } catch {
      // continue
    }

    return null;
  };

  const transactionId = await resolveOrCreateTransactionId(
    String(userId || ""),
    String(contact?.userId || ""),
  );

  const basePayload = {
    sender_user_id: userId,
    receiver_user_id: contact?.userId || null,
    message_text: text,
  };

  const payloadVariants = [
    {
      ...basePayload,
      ...(transactionId ? { transaction_id: transactionId } : {}),
      thread_id: String(threadId || ""),
    },
    {
      ...basePayload,
      ...(transactionId ? { transaction_id: transactionId } : {}),
    },
  ];

  let lastError = null;
  for (const payload of payloadVariants) {
    const { error } = await supabase.from("messages").insert(payload);
    if (!error) {
      return;
    }
    lastError = error;

    const msg = String(error.message || "").toLowerCase();
    const missingColumn =
      msg.includes("could not find the") && msg.includes("column");
    if (!missingColumn) {
      break;
    }
  }

  throw new Error(lastError?.message || "Unable to send message to Supabase.");
};
