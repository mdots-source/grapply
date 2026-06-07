import { apiSupabaseError, requireApiAccess, requireApiRole, requireSupabasePersistence } from "@/lib/api-access";
import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { getBackendClubId } from "@/lib/backend";
import { isSupabaseConfigured, selectRows, upsertRow } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const readableSettingKeys = new Set(["brand", "tv", "coaches", "appearance", "integrations"]);
const writableSettingKeys = new Set(["brand", "tv", "coaches", "appearance"]);
const allowedAppearanceThemes = new Set(["dark", "light", "system"]);
const allowedAppearanceAccents = new Set(["purple", "blue", "green", "coral"]);
const hexColorPattern = /^#[0-9a-f]{6}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access = await requireApiAccess(searchParams.get("club"));
  if (access.error) return access.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ source: "supabase", settings: {} });

      const rows = await selectRows("club_settings", `select=*&club_id=eq.${clubId}`);
      return noStoreJson({
        source: "supabase",
        settings: Object.fromEntries(rows.filter((row) => readableSettingKeys.has(row.key)).map((row) => [row.key, row.value])),
      });
    } catch (error) {
      return apiSupabaseError(error, { clubId });
    }
  }

  return noStoreJson({ source: "mock", settings: {} });
}

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const requestedClubSlug = typeof payload.clubSlug === "string" ? payload.clubSlug : null;
  const access = await requireApiRole(["owner", "admin"], requestedClubSlug);
  if (access.error) return access.error;

  const validation = validateSettingPayload(payload.key, payload.value);
  if (validation.error) return validation.error;

  if (isSupabaseConfigured()) {
    let clubId: string | null = null;
    try {
      clubId = await getBackendClubId(access.session.activeClub.slug);
      if (!clubId) return noStoreJson({ ok: false, error: "Club not found." }, { status: 404 });
      const row = await upsertRow(
        "club_settings",
        { club_id: clubId, key: validation.key, value: validation.value },
        "club_id,key",
      );
      return noStoreJson({ ok: true, source: "supabase", setting: row });
    } catch (error) {
      const settingError = getSettingSupabaseValidationError(error);
      if (settingError) return settingError;
      return apiSupabaseError(error, { clubId });
    }
  }

  const persistenceError = requireSupabasePersistence("Club settings");
  if (persistenceError) return persistenceError;

  return noStoreJson({ ok: true, source: "mock", setting: { key: validation.key, value: validation.value } });
}

function validateSettingPayload(key: unknown, value: unknown): { key: string; value: Json; error?: never } | { key?: never; value?: never; error: Response } {
  if (typeof key !== "string" || !writableSettingKeys.has(key)) {
    return { error: validationError("Unsupported settings key.") };
  }

  const valueValidation = validateSettingValue(key, value);
  if ("error" in valueValidation && valueValidation.error) return { error: validationError(valueValidation.error) };

  return { key, value: valueValidation.value as Json };
}

function validateSettingValue(key: string, value: unknown): { value: Json; error?: never } | { value?: never; error: string } {
  if (key === "brand") return validateBrandSettings(value);
  if (key === "tv") return validateTvSettings(value);
  if (key === "coaches") return validateCoachSettings(value);
  if (key === "appearance") return validateAppearanceSettings(value);
  return { error: "Unsupported settings key." };
}

function validateBrandSettings(value: unknown): { value: Json; error?: never } | { value?: never; error: string } {
  if (!isRecord(value)) return { error: "Brand settings must be an object." };
  const academyName = readString(value.academyName, "Academy name", 2, 120);
  const location = readString(value.location, "Location", 2, 120);
  const description = readString(value.description, "Description", 0, 600);
  const logoLabel = readString(value.logoLabel, "Logo initials", 1, 6);
  const mats = readCsv(value.mats, "Mats", 1, 20, 40);
  const classTypes = readCsv(value.classTypes, "Class types", 1, 30, 60);
  const primaryColor = readHexColor(value.primaryColor, "Primary color");
  const accentColor = readHexColor(value.accentColor, "Accent color");
  const firstError = [academyName, location, description, logoLabel, mats, classTypes, primaryColor, accentColor].find((item) => item.error);
  if (firstError?.error) return { error: firstError.error };

  return {
    value: {
      academyName: academyName.value,
      location: location.value,
      description: description.value,
      logoLabel: logoLabel.value,
      mats: mats.value!.join(", "),
      classTypes: classTypes.value!.join(", "),
      primaryColor: primaryColor.value,
      accentColor: accentColor.value,
    },
  };
}

function validateTvSettings(value: unknown): { value: Json; error?: never } | { value?: never; error: string } {
  if (!isRecord(value)) return { error: "TV settings must be an object." };
  const displayName = readString(value.displayName, "TV display name", 1, 120);
  if (displayName.error) return { error: displayName.error };
  const booleanKeys = ["showActiveAthletes", "liveCheckInQr", "rotatingAthleteCards", "liveActivityTicker", "showCoachAndMat"] as const;
  const output: Record<string, Json> = { displayName: displayName.value! };

  for (const item of booleanKeys) {
    const parsed = readBoolean(value[item], item);
    if (parsed.error) return { error: parsed.error };
    output[item] = parsed.value!;
  }

  return { value: output };
}

function validateCoachSettings(value: unknown): { value: Json; error?: never } | { value?: never; error: string } {
  if (!Array.isArray(value)) return { error: "Coaches settings must be a list." };
  if (value.length < 1 || value.length > 40) return { error: "Coaches list must include 1 to 40 coaches." };

  const coaches: Json[] = [];
  for (const item of value) {
    if (!isRecord(item)) return { error: "Each coach must be an object." };
    const name = readString(item.name, "Coach name", 2, 120);
    const role = readString(item.role, "Coach role", 1, 80);
    const focus = readString(item.focus, "Coach focus", 0, 180);
    const mat = readString(item.mat, "Coach mat", 1, 80);
    const firstError = [name, role, focus, mat].find((field) => field.error);
    if (firstError?.error) return { error: firstError.error };
    coaches.push({ name: name.value, role: role.value, focus: focus.value, mat: mat.value });
  }

  return { value: coaches };
}

function validateAppearanceSettings(value: unknown): { value: Json; error?: never } | { value?: never; error: string } {
  if (!isRecord(value)) return { error: "Appearance settings must be an object." };
  if (typeof value.theme !== "string" || !allowedAppearanceThemes.has(value.theme)) {
    return { error: "Appearance theme is not supported." };
  }
  if (typeof value.accent !== "string" || !allowedAppearanceAccents.has(value.accent)) {
    return { error: "Appearance accent is not supported." };
  }
  const theme = value.theme;
  const accent = value.accent;
  return { value: { theme, accent } };
}

type FieldResult<T> = { value: T; error?: never } | { value?: never; error: string };

function validationError(error: string) {
  return validationErrorJson(error);
}

function getSettingSupabaseValidationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("club_settings_key_valid")) {
    return noStoreJson({ ok: false, error: "Unsupported settings key." }, { status: 400 });
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, label: string, minLength: number, maxLength: number): FieldResult<string> {
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const trimmed = value.trim();
  if (trimmed.length < minLength) return { error: `${label} is too short.` };
  if (trimmed.length > maxLength) return { error: `${label} is too long.` };
  return { value: trimmed };
}

function readCsv(value: unknown, label: string, minItems: number, maxItems: number, maxLength: number): FieldResult<string[]> {
  if (typeof value !== "string") return { error: `${label} must be comma-separated text.` };
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (items.length < minItems) return { error: `${label} must include at least ${minItems} item.` };
  if (items.length > maxItems) return { error: `${label} has too many items.` };
  if (items.some((item) => item.length > maxLength)) return { error: `${label} contains an item that is too long.` };
  return { value: Array.from(new Set(items)) };
}

function readHexColor(value: unknown, label: string): FieldResult<string> {
  if (typeof value !== "string" || !hexColorPattern.test(value.trim())) return { error: `${label} must be a hex color.` };
  return { value: value.trim().toLowerCase() };
}

function readBoolean(value: unknown, label: string): FieldResult<boolean> {
  if (typeof value !== "boolean") return { error: `${label} must be true or false.` };
  return { value };
}
