import type { TrainingPost } from "@/data/training-feed";
import { getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { getMockTrainingPostsForClub, getVisibleMockTrainingPostsForClub } from "@/lib/mock-club-content";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows, updateRows } from "@/lib/supabase/server";
import { toTrainingPost, toTrainingPostInsert } from "@/lib/supabase/mappers";

const validPostTypes = new Set(["session", "promotion", "competition", "announcement", "milestone", "open-mat"]);
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$|^[0-1]?\d:[0-5]\d\s?(AM|PM)$/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;
  const clubSlug = access.session.activeClub.slug;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(clubSlug);
      if (!clubId) return noStoreJson({ source: "supabase", posts: [] });
      const rows = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&order=pinned.desc,id.asc`);
      const posts = rows.map(toTrainingPost);
      const visiblePosts = await filterTrainingPostsForViewer(posts, clubId, {
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if (visiblePosts instanceof Response) return visiblePosts;
      return noStoreJson({ source: "supabase", posts: visiblePosts });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({
    source: "mock",
    posts: getVisibleMockTrainingPostsForClub(clubSlug, {
      role: access.session.activeRole,
      userName: access.session.user.name,
    }),
  });
}

async function filterTrainingPostsForViewer(
  posts: TrainingPost[],
  clubId: string,
  viewer: { userId: string; userEmail?: string | null; role: string },
) {
  const readable = await getReadableMemberIds({ clubId, ...viewer });
  if ("error" in readable && readable.error) return readable.error;
  if ("scope" in readable && readable.scope === "all") return posts;

  const memberIds = "scope" in readable && readable.scope === "own" ? readable.memberIds : [];
  if (!memberIds.length) {
    return posts
      .filter((post) => !post.taggedStudents?.length)
      .map((post) => ({ ...post, taggedStudents: [], topParticipant: undefined }));
  }

  const rows = await selectRows(
    "academy_members",
    `select=name&club_id=eq.${clubId}&id=in.(${memberIds.map(encodeURIComponent).join(",")})`,
  );
  const allowedNames = new Set(rows.map((row) => row.name));

  return posts
    .filter((post) => !post.taggedStudents?.length || post.taggedStudents.some((name) => allowedNames.has(name)))
    .map((post) => {
      const taggedStudents = (post.taggedStudents ?? []).filter((name) => allowedNames.has(name));
      return {
        ...post,
        taggedStudents,
        topParticipant: post.topParticipant && allowedNames.has(post.topParticipant.name) ? post.topParticipant : undefined,
      };
    });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateTrainingPostPayload(payload);
  if (validation.error) return validation.error;
  const post = getWritableTrainingPost(validation.data, access.session.activeRole, access.session.user.name);

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const tagError = await validateSupabaseTaggedStudents(clubId, post);
      if (tagError) return tagError;
      const postId = await getAvailableTrainingPostId(clubId, post.id);
      if (!postId) return noStoreJson({ ok: false, error: "A post with this id already exists in this club." }, { status: 409 });
      const coachUserId = await getTrainingPostCoachUserId(clubId, access.session.activeRole, access.session.user.id, post.coach);

      const row = await insertTrainingPostWithAuthorFallback({ ...post, id: postId }, clubId, coachUserId);
      return noStoreJson({ ok: true, source: "supabase", post: toTrainingPost(row) });
    } catch (error) {
      const postError = getTrainingPostSupabaseValidationError(error);
      if (postError) return postError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training feed");
  if (persistenceError) return persistenceError;

  const mockPosts = getMockTrainingPostsForClub(access.session.activeClub.slug);
  if (mockPosts.some((item) => item.id === post.id)) {
    return noStoreJson({ ok: false, error: "A post with this id already exists in this club." }, { status: 409 });
  }
  const mockTagError = validateMockTaggedStudents(access.session.activeClub.slug, post);
  if (mockTagError) return mockTagError;

  return noStoreJson({ ok: true, source: "mock", post });
}

export async function PATCH(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateTrainingPostPayload(payload);
  if (validation.error) return validation.error;
  const post = getWritableTrainingPost(validation.data, access.session.activeRole, access.session.user.name);

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const tagError = await validateSupabaseTaggedStudents(clubId, post);
      if (tagError) return tagError;
      const [existingPost] = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&id=eq.${encodeURIComponent(post.id)}&limit=1`);
      if (!existingPost) return noStoreJson({ ok: false, error: "Post not found in this club." }, { status: 404 });
      const authorError = getTrainingPostAuthorError(access.session.activeRole, access.session.user.id, access.session.user.name, existingPost);
      if (authorError) return authorError;
      const coachUserId = await getTrainingPostCoachUserId(clubId, access.session.activeRole, access.session.user.id, post.coach);

      const [row] = await updateTrainingPostWithAuthorFallback(post, clubId, coachUserId);
      return noStoreJson({ ok: true, source: "supabase", post: toTrainingPost(row) });
    } catch (error) {
      const postError = getTrainingPostSupabaseValidationError(error);
      if (postError) return postError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Training feed");
  if (persistenceError) return persistenceError;

  const mockPosts = getMockTrainingPostsForClub(access.session.activeClub.slug);
  const mockPost = mockPosts.find((item) => item.id === post.id);
  if (!mockPost) {
    return noStoreJson({ ok: false, error: "Post not found in this club." }, { status: 404 });
  }
  const mockAuthorError = getTrainingPostAuthorError(access.session.activeRole, access.session.user.id, access.session.user.name, mockPost);
  if (mockAuthorError) return mockAuthorError;
  const mockTagError = validateMockTaggedStudents(access.session.activeClub.slug, post);
  if (mockTagError) return mockTagError;

  return noStoreJson({ ok: true, source: "mock", post });
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin", "coach"], requestedClubSlug);
  if (access.error) return access.error;

  const id = requiredString(payload.id, "Post id", 120);
  if (id.error) return validationError(id.error);
  const postId = id.value ?? "";

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [existingPost] = await selectRows("training_posts", `select=*&club_id=eq.${clubId}&id=eq.${encodeURIComponent(postId)}&limit=1`);
      if (!existingPost) return noStoreJson({ ok: false, error: "Post not found in this club." }, { status: 404 });
      const authorError = getTrainingPostAuthorError(access.session.activeRole, access.session.user.id, access.session.user.name, existingPost);
      if (authorError) return authorError;
      const removed = await deleteRows("training_posts", `id=eq.${encodeURIComponent(postId)}&club_id=eq.${clubId}`);
      return noStoreJson({ ok: true, source: "supabase", removed });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  const mockPost = getMockTrainingPostsForClub(access.session.activeClub.slug).find((item) => item.id === postId);
  if (!mockPost) {
    return noStoreJson({ ok: false, error: "Post not found in this club." }, { status: 404 });
  }
  const mockAuthorError = getTrainingPostAuthorError(access.session.activeRole, access.session.user.id, access.session.user.name, mockPost);
  if (mockAuthorError) return mockAuthorError;

  const persistenceError = requireSupabasePersistence("Training feed");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", id: postId });
}

function getWritableTrainingPost(post: TrainingPost, role: string, userName: string): TrainingPost {
  if (role !== "coach") return post;
  return { ...post, coach: userName };
}

function getTrainingPostAuthorError(role: string, userId: string, userName: string, post: { coach: string; coach_user_id?: string | null }) {
  if (role !== "coach") return null;
  if (post.coach_user_id) {
    if (isUuid(userId) && post.coach_user_id === userId) return null;
    return noStoreJson({ ok: false, error: "Coaches can only manage their own training posts." }, { status: 403 });
  }
  if (post.coach.trim().toLowerCase() === userName.trim().toLowerCase()) return null;
  return noStoreJson({ ok: false, error: "Coaches can only manage their own training posts." }, { status: 403 });
}

async function getTrainingPostCoachUserId(clubId: string, role: string, userId: string, coachName: string) {
  if (role === "coach") return isUuid(userId) ? userId : null;

  const users = await selectRows("app_users", `select=id&name=eq.${encodeURIComponent(coachName)}&limit=10`);
  if (!users.length) return null;

  const userIds = users.map((user) => user.id);
  const [membership] = await selectRows(
    "club_memberships",
    `select=user_id&club_id=eq.${clubId}&user_id=in.(${userIds.map(encodeURIComponent).join(",")})&limit=1`,
  );
  return membership?.user_id ?? null;
}

async function insertTrainingPostWithAuthorFallback(post: TrainingPost, clubId: string, coachUserId: string | null) {
  try {
    return await insertRow("training_posts", toTrainingPostInsert(post, clubId, coachUserId));
  } catch (error) {
    if (!isMissingTrainingPostAuthorColumn(error)) throw error;
    return insertRow("training_posts", toTrainingPostInsert(post, clubId, null, { includeCoachUserId: false }));
  }
}

async function updateTrainingPostWithAuthorFallback(post: TrainingPost, clubId: string, coachUserId: string | null) {
  const query = `id=eq.${encodeURIComponent(post.id)}&club_id=eq.${clubId}`;
  try {
    return await updateRows("training_posts", toTrainingPostInsert(post, clubId, coachUserId), query);
  } catch (error) {
    if (!isMissingTrainingPostAuthorColumn(error)) throw error;
    return updateRows("training_posts", toTrainingPostInsert(post, clubId, null, { includeCoachUserId: false }), query);
  }
}

function isMissingTrainingPostAuthorColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("coach_user_id") && (
    message.includes("PGRST204") ||
    message.includes("Could not find") ||
    message.includes("does not exist")
  );
}

async function getAvailableTrainingPostId(clubId: string, requestedId: string) {
  const [existing] = await selectRows("training_posts", `select=id,club_id&id=eq.${encodeURIComponent(requestedId)}&limit=1`);
  if (!existing) return requestedId;
  if (existing.club_id === clubId) return null;
  return `tf-${clubId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
}

async function validateSupabaseTaggedStudents(clubId: string, post: TrainingPost) {
  const participantName = post.topParticipant?.name?.trim();
  const names = [...(post.taggedStudents ?? []), ...(participantName ? [participantName] : [])];
  if (names.length === 0) return null;
  const taggedNames = (post.taggedStudents ?? []).map((name) => name.trim()).filter(Boolean);
  if (new Set(taggedNames).size !== taggedNames.length) {
    return noStoreJson({ ok: false, error: "Tagged students cannot contain duplicates." }, { status: 400 });
  }
  const uniqueNames = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
  const rows = await selectRows("academy_members", `select=name&club_id=eq.${clubId}&name=in.(${uniqueNames.map(encodeURIComponent).join(",")})`);
  if (rows.length !== uniqueNames.length) {
    return noStoreJson({ ok: false, error: "Tagged students and top participant must belong to this club." }, { status: 400 });
  }
  return null;
}

function validateMockTaggedStudents(clubSlug: string, post: TrainingPost) {
  const participantName = post.topParticipant?.name?.trim();
  const names = [...(post.taggedStudents ?? []), ...(participantName ? [participantName] : [])];
  if (names.length === 0) return null;
  const rosterNames = new Set(getClubRoster(getMockClubId(clubSlug)).map((member) => member.name));
  const taggedNames = (post.taggedStudents ?? []).map((name) => name.trim()).filter(Boolean);
  if (new Set(taggedNames).size !== taggedNames.length) {
    return noStoreJson({ ok: false, error: "Tagged students cannot contain duplicates." }, { status: 400 });
  }
  if (names.some((name) => !rosterNames.has(name))) {
    return noStoreJson({ ok: false, error: "Tagged students and top participant must belong to this club." }, { status: 400 });
  }
  return null;
}

function validateTrainingPostPayload(payload: Record<string, unknown>): { data: TrainingPost; error?: never } | { data?: never; error: Response } {
  const id = requiredString(payload.id, "Post id", 120);
  const type = requiredPostType(payload.type);
  const coach = requiredString(payload.coach, "Coach", 120);
  const date = requiredString(payload.date, "Date", 80);
  const time = requiredTime(payload.time);
  const title = requiredString(payload.title, "Title", 160);
  const summary = requiredString(payload.summary, "Summary", 2000);
  const className = optionalString(payload.className, "Class name", 120);
  const attendance = optionalInteger(payload.attendance, "Attendance", 0, 10000);
  const pinned = optionalBoolean(payload.pinned, "Pinned");
  const topParticipant = optionalTopParticipant(payload.topParticipant);
  const sparringHighlight = optionalString(payload.sparringHighlight, "Sparring highlight", 500);
  const achievements = optionalStringArray(payload.achievements, "Achievements", 12, 160);
  const taggedStudents = optionalStringArray(payload.taggedStudents, "Tagged students", 30, 120);

  const firstError = [id, type, coach, date, time, title, summary, className, attendance, pinned, topParticipant, sparringHighlight, achievements, taggedStudents]
    .find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  return {
    data: {
      id: id.value ?? "",
      type: type.value ?? "announcement",
      coach: coach.value ?? "",
      date: date.value ?? "",
      time: time.value ?? "",
      title: title.value ?? "",
      summary: summary.value ?? "",
      ...(typeof pinned.value === "boolean" ? { pinned: pinned.value } : {}),
      ...(className.value ? { className: className.value } : {}),
      ...(typeof attendance.value === "number" ? { attendance: attendance.value } : {}),
      ...(topParticipant.value ? { topParticipant: topParticipant.value } : {}),
      ...(sparringHighlight.value ? { sparringHighlight: sparringHighlight.value } : {}),
      ...(achievements.value ? { achievements: achievements.value } : {}),
      ...(taggedStudents.value ? { taggedStudents: taggedStudents.value } : {}),
    },
  };
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getTrainingPostSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("training_posts_metrics_nonnegative")) {
    return noStoreJson({ ok: false, error: "Training post metrics cannot be negative." }, { status: 400 });
  }
  if (message.includes("training_posts_type_valid")) {
    return noStoreJson({ ok: false, error: "Post type is not supported." }, { status: 400 });
  }
  if (message.includes("tagged_students must be unique")) {
    return noStoreJson({ ok: false, error: "Tagged students cannot contain duplicates." }, { status: 400 });
  }
  if (message.includes("tagged_students must belong") || message.includes("top_participant must belong")) {
    return noStoreJson({ ok: false, error: "Tagged students and top participant must belong to this club." }, { status: 400 });
  }

  return null;
}

function requiredString(value: unknown, label: string, maxLength: number): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function optionalString(value: unknown, label: string, maxLength: number): FieldResult<string | undefined> {
  if (value === undefined || value === null) return { value: undefined as string | undefined };
  return requiredString(value, label, maxLength);
}

function requiredPostType(value: unknown): FieldResult<TrainingPost["type"]> {
  if (typeof value !== "string" || !validPostTypes.has(value)) return { error: "Post type is not supported." };
  return { value: value as TrainingPost["type"] };
}

function requiredTime(value: unknown): FieldResult<string> {
  if (typeof value !== "string" || !timePattern.test(value.trim())) return { error: "Time must use HH:MM or h:mm AM/PM format." };
  return { value: value.trim() };
}

function optionalInteger(value: unknown, label: string, min: number, max: number): FieldResult<number | undefined> {
  if (value === undefined || value === null) return { value: undefined as number | undefined };
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
}

function optionalBoolean(value: unknown, label: string): FieldResult<boolean | undefined> {
  if (value === undefined || value === null) return { value: undefined as boolean | undefined };
  if (typeof value !== "boolean") return { error: `${label} must be true or false.` };
  return { value };
}

function optionalStringArray(value: unknown, label: string, maxItems: number, maxLength: number): FieldResult<string[] | undefined> {
  if (value === undefined || value === null) return { value: undefined as string[] | undefined };
  if (!Array.isArray(value)) return { error: `${label} must be a list.` };
  if (value.length > maxItems) return { error: `${label} has too many items.` };
  const next = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  if (next.length !== value.length) return { error: `${label} must contain text values.` };
  if (next.some((item) => item.length > maxLength)) return { error: `${label} contains an item that is too long.` };
  if (new Set(next).size !== next.length) return { error: `${label} cannot contain duplicates.` };
  return { value: next.length ? next : undefined };
}

function optionalTopParticipant(value: unknown): FieldResult<TrainingPost["topParticipant"] | undefined> {
  if (value === undefined || value === null) return { value: undefined as TrainingPost["topParticipant"] | undefined };
  if (typeof value !== "object" || Array.isArray(value)) return { error: "Top participant must be an object." };
  const record = value as Record<string, unknown>;
  const name = requiredString(record.name, "Top participant name", 120);
  const note = requiredString(record.note, "Top participant note", 240);
  if (name.error) return { error: name.error };
  if (note.error) return { error: note.error };
  return { value: { name: name.value ?? "", note: note.value ?? "" } };
}
