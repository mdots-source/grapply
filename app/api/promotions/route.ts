import { getClubRoster } from "@/data/platform";
import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId, getMockClubId } from "@/lib/backend";
import { getReadableMemberIds } from "@/lib/member-visibility";
import { toStudent } from "@/lib/supabase/mappers";
import { deleteRows, insertRow, isSupabaseConfigured, selectRows } from "@/lib/supabase/server";

const validBelts = new Set(["white", "blue", "purple", "brown", "black"]);
const beltOrder = { white: 0, blue: 1, purple: 2, brown: 3, black: 4 } satisfies Record<PromotionBelt, number>;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type PromotionType = "stripe" | "belt" | "ranking" | "achievement";
type PromotionBelt = "white" | "blue" | "purple" | "brown" | "black";
type PromotionPayload = {
  memberId: string;
  type: PromotionType;
  awardedByName?: string;
  detail: string;
  belt?: PromotionBelt | null;
  stripes?: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", promotions: [] });

      const memberId = searchParams.get("memberId");
      const filters = [`club_id=eq.${clubId}`];
      if (memberId !== null && !memberId.trim()) {
        return noStoreJson({ ok: false, error: "Member id cannot be empty." }, { status: 400 });
      }

      const readable = await getReadableMemberIds({
        clubId,
        requestedMemberId: memberId,
        userId: access.session.user.id,
        userEmail: access.session.user.email,
        role: access.session.activeRole,
      });
      if ("error" in readable && readable.error) return readable.error;
      if ("empty" in readable && readable.empty) return noStoreJson({ source: "supabase", promotions: [] });
      if (readable.scope === "own") filters.push(`member_id=in.(${readable.memberIds.map(encodeURIComponent).join(",")})`);
      if (readable.scope === "all" && memberId) filters.push(`member_id=eq.${encodeURIComponent(memberId)}`);

      const rows = await selectRows("member_promotions", `select=*&${filters.join("&")}&order=awarded_at.desc`);
      return noStoreJson({ source: "supabase", promotions: rows });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", promotions: [] });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validatePromotionPayload(payload);
  if (validation.error) return validation.error;
  const promotion = validation.data;
  const promotionType = promotion.type;

  if (promotionType === "stripe" && (typeof promotion.stripes !== "number" || promotion.stripes < 1 || promotion.stripes > 4)) {
    return noStoreJson({ ok: false, error: "Stripe awards must be between 1 and 4." }, { status: 400 });
  }

  if (promotionType === "stripe" && promotion.belt) {
    return noStoreJson({ ok: false, error: "Stripe awards cannot change belt rank." }, { status: 400 });
  }

  if (promotionType === "belt" && !promotion.belt) {
    return noStoreJson({ ok: false, error: "A valid belt is required for belt promotions." }, { status: 400 });
  }

  if (promotionType === "belt" && typeof promotion.stripes === "number" && promotion.stripes !== 0) {
    return noStoreJson({ ok: false, error: "Belt promotions start at 0 stripes. Award stripes separately after the belt promotion." }, { status: 400 });
  }

  if ((promotionType === "ranking" || promotionType === "achievement") && (promotion.belt || typeof promotion.stripes === "number")) {
    return noStoreJson({ ok: false, error: "Ranking and achievement entries cannot change belt or stripes." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [member] = await selectRows("academy_members", `select=id,belt,stripes&club_id=eq.${clubId}&id=eq.${encodeURIComponent(promotion.memberId)}&limit=1`);
      if (!member) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

      if (promotionType === "stripe" && typeof member.stripes === "number" && typeof promotion.stripes === "number" && promotion.stripes <= member.stripes) {
        return noStoreJson({ ok: false, error: "Stripe awards must move the member forward." }, { status: 409 });
      }

      if (promotionType === "belt" && promotion.belt && beltOrder[promotion.belt] <= beltOrder[member.belt]) {
        return noStoreJson({ ok: false, error: "Belt promotion must move the member forward." }, { status: 409 });
      }

      const row = await insertRow("member_promotions", {
        club_id: clubId,
        member_id: promotion.memberId,
        awarded_by: isUuid(access.session.user.id) ? access.session.user.id : null,
        awarded_by_name: access.session.user.name,
        type: promotionType,
        ...getPromotionRankFields(promotion),
        previous_belt: member.belt,
        previous_stripes: member.stripes,
        detail: promotion.detail,
      });
      const updatedMember = await getPromotionMember(clubId, promotion.memberId);

      return noStoreJson({ ok: true, source: "supabase", promotion: row, member: updatedMember });
    } catch (error) {
      const promotionError = getPromotionSupabaseValidationError(error);
      if (promotionError) return promotionError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Promotions");
  if (persistenceError) return persistenceError;

  const mockClubId = getMockClubId(access.session.activeClub.slug);
  const mockMember = getClubRoster(mockClubId).find((member) => member.id === promotion.memberId);
  if (!mockMember) return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });

  if (promotionType === "stripe" && typeof promotion.stripes === "number" && promotion.stripes <= mockMember.stripes) {
    return noStoreJson({ ok: false, error: "Stripe awards must move the member forward." }, { status: 409 });
  }

  if (promotionType === "belt" && promotion.belt && beltOrder[promotion.belt] <= beltOrder[mockMember.belt]) {
    return noStoreJson({ ok: false, error: "Belt promotion must move the member forward." }, { status: 409 });
  }

  const nextMockMember = {
    ...mockMember,
    ...(promotionType === "stripe" && typeof promotion.stripes === "number" ? { stripes: promotion.stripes } : {}),
    ...(promotionType === "belt" && promotion.belt ? { belt: promotion.belt, stripes: promotion.stripes ?? 0 } : {}),
  };

  return noStoreJson({
    ok: true,
    source: "mock",
    promotion: {
      id: `mock-promotion-${Date.now()}`,
      club_id: mockClubId,
      member_id: promotion.memberId,
      awarded_by: isUuid(access.session.user.id) ? access.session.user.id : null,
      awarded_by_name: access.session.user.name,
      type: promotionType,
      ...getPromotionRankFields(promotion),
      previous_belt: mockMember.belt,
      previous_stripes: mockMember.stripes,
      detail: promotion.detail,
      awarded_at: new Date().toISOString(),
    },
    member: nextMockMember,
  });
}

function getPromotionRankFields(promotion: PromotionPayload) {
  if (promotion.type === "stripe") return { belt: null, stripes: promotion.stripes ?? null };
  if (promotion.type === "belt") return { belt: promotion.belt ?? null, stripes: promotion.stripes ?? 0 };
  return { belt: null, stripes: null };
}

function readPromotionType(value: unknown): FieldResult<PromotionType> {
  if (value === "stripe" || value === "belt" || value === "ranking" || value === "achievement") return { value };
  return { error: "Promotion type is not supported." };
}

function validatePromotionPayload(payload: Record<string, unknown>): { data: PromotionPayload; error?: never } | { data?: never; error: Response } {
  if (payload.awardedBy !== undefined || payload.awarded_by !== undefined || payload.awardedByName !== undefined || payload.awarded_by_name !== undefined) {
    return { error: validationError("Promotion author is assigned by the server.") };
  }

  const memberId = readText(payload.memberId, "Member id", 120);
  const type = readPromotionType(payload.type);
  const detail = readText(payload.detail, "Promotion detail", 500);
  const stripes = readOptionalInteger(payload.stripes, "Stripes", 0, 4);
  const belt = readOptionalBelt(payload.belt);
  const firstError = [memberId, type, detail, stripes, belt].find((item) => item.error);
  if (firstError?.error) return { error: validationError(firstError.error) };

  return {
    data: {
      memberId: memberId.value ?? "",
      type: type.value ?? "achievement",
      detail: detail.value ?? "",
      ...(stripes.value !== undefined ? { stripes: stripes.value } : {}),
      ...(belt.value !== undefined ? { belt: belt.value } : {}),
    },
  };
}

export async function DELETE(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const id = readText(payload.id, "Promotion id", 120);
  if (id.error) return validationError(id.error);
  const promotionId = id.value ?? "";

  if (isSupabaseConfigured()) {
    if (!isUuid(promotionId)) return noStoreJson({ ok: false, error: "Promotion id must be a valid id." }, { status: 400 });

    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const [promotion] = await selectRows("member_promotions", `select=*&id=eq.${encodeURIComponent(promotionId)}&club_id=eq.${clubId}&limit=1`);
      if (!promotion) return noStoreJson({ ok: false, error: "Promotion not found in this club." }, { status: 404 });

      const removed = await deleteRows("member_promotions", `id=eq.${encodeURIComponent(promotionId)}&club_id=eq.${clubId}`);
      if (removed.length === 0) return noStoreJson({ ok: false, error: "Promotion not found in this club." }, { status: 404 });
      const updatedMember = await getPromotionMember(clubId, promotion.member_id);
      return noStoreJson({ ok: true, source: "supabase", removed, member: updatedMember });
    } catch (error) {
      const promotionError = getPromotionSupabaseValidationError(error);
      if (promotionError) return promotionError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Promotions");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: false, source: "mock", error: "Promotions are not persisted in mock mode." }, { status: 404 });
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getPromotionSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Member not found in this club")) {
    return noStoreJson({ ok: false, error: "Member not found in this club." }, { status: 404 });
  }
  if (message.includes("Stripe awards must be between 1 and 4")) {
    return noStoreJson({ ok: false, error: "Stripe awards must be between 1 and 4." }, { status: 400 });
  }
  if (message.includes("Stripe awards must move the member forward")) {
    return noStoreJson({ ok: false, error: "Stripe awards must move the member forward." }, { status: 409 });
  }
  if (message.includes("A valid belt is required for belt promotions")) {
    return noStoreJson({ ok: false, error: "A valid belt is required for belt promotions." }, { status: 400 });
  }
  if (message.includes("Belt promotion must move the member forward")) {
    return noStoreJson({ ok: false, error: "Belt promotion must move the member forward." }, { status: 409 });
  }
  if (message.includes("member_promotions_rank_fields_match_type")) {
    return noStoreJson({ ok: false, error: "Promotion rank fields do not match the selected promotion type." }, { status: 400 });
  }

  return null;
}

function readText(value: unknown, label: string, maxLength: number): FieldResult<string> {
  if (typeof value !== "string" || !value.trim()) return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function readOptionalInteger(value: unknown, label: string, min: number, max: number): FieldResult<number | null | undefined> {
  if (value === undefined) return { value: undefined as number | null | undefined };
  if (value === null) return { value: null };
  if (typeof value !== "number" || !Number.isInteger(value)) return { error: `${label} must be a whole number.` };
  if (value < min || value > max) return { error: `${label} must be between ${min} and ${max}.` };
  return { value };
}

function readOptionalBelt(value: unknown): FieldResult<PromotionBelt | null | undefined> {
  if (value === undefined) return { value: undefined as PromotionBelt | null | undefined };
  if (value === null) return { value: null };
  if (typeof value !== "string" || !validBelts.has(value)) return { error: "Belt is not supported." };
  return { value: value as PromotionBelt };
}

function isUuid(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value);
}

async function getPromotionMember(clubId: string, memberId: string) {
  const [member] = await selectRows("academy_members", `select=*&id=eq.${encodeURIComponent(memberId)}&club_id=eq.${clubId}&limit=1`);
  return member ? toStudent(member) : null;
}
