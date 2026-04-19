import { supabase } from "./supabaseClient";

export const readOutgoingBorrowRequestsDirect = async (borrowerUserId) => {
  if (!borrowerUserId) {
    return [];
  }

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(
      "id, item_id, borrower_user_id, requested_start_date, requested_end_date, status, created_at",
    )
    .eq("borrower_user_id", String(borrowerUserId))
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load borrow requests.");
  }

  return data || [];
};

export const readIncomingBorrowRequestsDirect = async (ownerUserId) => {
  if (!ownerUserId) {
    return [];
  }

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(
      "id, item_id, borrower_user_id, requested_start_date, requested_end_date, status, created_at, items!inner(id, title, user_id)",
    )
    .eq("items.user_id", String(ownerUserId))
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load incoming requests.");
  }

  return data || [];
};

export const createBorrowRequestDirect = async ({
  itemId,
  borrowerUserId,
  requestedStartDate,
  requestedEndDate,
}) => {
  if (!itemId || !borrowerUserId) {
    throw new Error("Missing request details.");
  }

  const { data: existingPending } = await supabase
    .from("borrow_requests")
    .select("id, status")
    .eq("item_id", String(itemId))
    .eq("borrower_user_id", String(borrowerUserId))
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPending?.id) {
    return existingPending;
  }

  const { data, error } = await supabase
    .from("borrow_requests")
    .insert({
      item_id: String(itemId),
      borrower_user_id: String(borrowerUserId),
      requested_start_date: requestedStartDate,
      requested_end_date: requestedEndDate,
      status: "pending",
    })
    .select(
      "id, item_id, borrower_user_id, requested_start_date, requested_end_date, status",
    )
    .single();

  if (error) {
    throw new Error(error.message || "Unable to send borrow request.");
  }

  return data;
};

export const approveBorrowRequestDirect = async (requestId, ownerUserId) => {
  if (!requestId || !ownerUserId) {
    throw new Error("Missing approval details.");
  }

  const { data: requestRow, error: requestError } = await supabase
    .from("borrow_requests")
    .select(
      "id, item_id, borrower_user_id, requested_start_date, requested_end_date, status",
    )
    .eq("id", String(requestId))
    .maybeSingle();

  if (requestError || !requestRow?.id) {
    throw new Error(requestError?.message || "Borrow request not found.");
  }

  if (String(requestRow.status || "").toLowerCase() !== "pending") {
    return requestRow;
  }

  const { data: itemRow, error: itemError } = await supabase
    .from("items")
    .select("id, user_id")
    .eq("id", String(requestRow.item_id))
    .eq("user_id", String(ownerUserId))
    .maybeSingle();

  if (itemError || !itemRow?.id) {
    throw new Error(itemError?.message || "Only item owner can approve.");
  }

  const { error: updateRequestError } = await supabase
    .from("borrow_requests")
    .update({ status: "approved" })
    .eq("id", String(requestRow.id));

  if (updateRequestError) {
    throw new Error(updateRequestError.message || "Unable to approve request.");
  }

  const { error: insertTransactionError } = await supabase
    .from("borrow_transactions")
    .insert({
      request_id: String(requestRow.id),
      lender_user_id: String(ownerUserId),
      borrower_user_id: String(requestRow.borrower_user_id),
      start_date: requestRow.requested_start_date,
      due_date: requestRow.requested_end_date,
      status: "active",
    });

  if (insertTransactionError) {
    throw new Error(
      insertTransactionError.message || "Unable to create borrow transaction.",
    );
  }

  const { error: updateItemError } = await supabase
    .from("items")
    .update({
      is_on_loan: true,
      status: "on_loan",
      due_date: requestRow.requested_end_date,
    })
    .eq("id", String(requestRow.item_id))
    .eq("user_id", String(ownerUserId));

  if (updateItemError) {
    throw new Error(updateItemError.message || "Unable to update item status.");
  }

  return requestRow;
};

export const declineBorrowRequestDirect = async (requestId) => {
  if (!requestId) {
    throw new Error("Missing request id.");
  }

  const { error } = await supabase
    .from("borrow_requests")
    .update({ status: "declined" })
    .eq("id", String(requestId));

  if (error) {
    throw new Error(error.message || "Unable to decline request.");
  }
};
