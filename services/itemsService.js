import { supabase } from "./supabaseClient";

const DEMO_TITLES = new Set([
  "cordless hedge trimmer",
  "power drill + bits",
  "leaf blower",
  "cordless drill set",
  "extension ladder",
  "garden pruning shears",
]);

const DEMO_IMAGE_HINTS = [
  "photo-1519710164239-da123dc03ef4",
  "photo-1581091012184-7c7c6f3d7fcb",
  "photo-1582719478293-9f2f2f1d0b3f",
];

const isLikelySeededDemoItem = (item) => {
  const title = String(item?.title || item?.name || "")
    .trim()
    .toLowerCase();
  const image = String(item?.image_url || item?.image || "").toLowerCase();
  const isZeroPriced = Number(item?.price_per_day || 0) === 0;

  if (!title || !isZeroPriced) {
    return false;
  }

  const titleLooksSeeded = DEMO_TITLES.has(title);
  const imageLooksSeeded = DEMO_IMAGE_HINTS.some((hint) =>
    image.includes(hint),
  );

  return titleLooksSeeded || imageLooksSeeded;
};

export const readUserItemsDirect = async (userId) => {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      error.message || "Unable to load your items from Supabase.",
    );
  }

  return (data || []).filter((item) => !isLikelySeededDemoItem(item));
};

export const readAllItemsDirect = async () => {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load listings from Supabase.");
  }

  return (data || []).filter((item) => !isLikelySeededDemoItem(item));
};

export const createUserItemDirect = async (payload) => {
  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to save item to Supabase.");
  }

  return data;
};

export const getDemoItemsForUser = (userId) => {
  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  return [
    {
      user_id: userId,
      title: "Cordless Hedge Trimmer",
      category: "Garden",
      status: "available",
      is_on_loan: false,
      price_per_day: 0,
      image_url:
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
    },
    {
      user_id: userId,
      title: "Power Drill + Bits",
      category: "Tools",
      status: "available",
      is_on_loan: false,
      price_per_day: 0,
      image_url:
        "https://images.unsplash.com/photo-1581091012184-7c7c6f3d7fcb?auto=format&fit=crop&w=900&q=80",
    },
    {
      user_id: userId,
      title: "Leaf Blower",
      category: "Garden",
      status: "on_loan",
      is_on_loan: true,
      due_date: inSevenDays.toISOString(),
      price_per_day: 0,
      image_url:
        "https://images.unsplash.com/photo-1582719478293-9f2f2f1d0b3f?auto=format&fit=crop&w=900&q=80",
    },
  ];
};

export const migrateLegacyDemoItems = async (userId, items = []) => {
  if (!Array.isArray(items) || items.length !== 3) {
    return items;
  }

  const titles = items
    .map((item) => item?.title)
    .filter(Boolean)
    .sort();
  const legacyTitles = [
    "Cordless Drill Set",
    "Extension Ladder",
    "Garden Pruning Shears",
  ].sort();

  if (titles.join("|") !== legacyTitles.join("|")) {
    return items;
  }

  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const replacementByTitle = {
    "Cordless Drill Set": {
      title: "Cordless Hedge Trimmer",
      category: "Garden",
      status: "available",
      is_on_loan: false,
      due_date: null,
      image_url:
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
    },
    "Garden Pruning Shears": {
      title: "Power Drill + Bits",
      category: "Tools",
      status: "available",
      is_on_loan: false,
      due_date: null,
      image_url:
        "https://images.unsplash.com/photo-1581091012184-7c7c6f3d7fcb?auto=format&fit=crop&w=900&q=80",
    },
    "Extension Ladder": {
      title: "Leaf Blower",
      category: "Garden",
      status: "on_loan",
      is_on_loan: true,
      due_date: inSevenDays.toISOString(),
      image_url:
        "https://images.unsplash.com/photo-1582719478293-9f2f2f1d0b3f?auto=format&fit=crop&w=900&q=80",
    },
  };

  for (const item of items) {
    const patch = replacementByTitle[item?.title];
    if (!patch || !item?.id) {
      continue;
    }

    const { error } = await supabase
      .from("items")
      .update(patch)
      .eq("id", item.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message || "Unable to migrate demo items.");
    }
  }

  return await readUserItemsDirect(userId);
};

export const seedDemoItemsForUser = async (userId) => {
  const demoItems = getDemoItemsForUser(userId);
  const { data, error } = await supabase
    .from("items")
    .insert(demoItems)
    .select("*");

  if (error) {
    throw new Error(error.message || "Unable to seed demo items.");
  }

  return data || [];
};

export const deleteUserItemDirect = async (userId, itemId) => {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Unable to delete item from Supabase.");
  }
};
