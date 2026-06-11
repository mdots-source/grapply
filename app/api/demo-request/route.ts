import { noStoreJson, readJsonObject, validationErrorJson } from "@/lib/api-json";
import { queueEmail } from "@/lib/email/outbox";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const academySizes = new Set(["under-50", "50-150", "150-300", "300-plus", "multi-location"]);
const roles = new Set(["owner", "head-coach", "admin", "coach", "other"]);

export async function POST(request: Request) {
  const payload = await readJsonObject(request);
  const validation = validateDemoRequest(payload);
  if (validation.error) return validation.error;

  const data = validation.data;
  await queueEmail({
    toEmail: "demo@grapply.app",
    template: "demo_request",
    subject: `Grapply demo request: ${data.academyName}`,
    body: [
      "New Grapply demo request",
      "",
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Academy: ${data.academyName}`,
      `Role: ${data.role}`,
      `Academy size: ${data.academySize}`,
      `Current tools: ${data.currentTools || "Not provided"}`,
      "",
      "Message:",
      data.message || "Not provided",
    ].join("\n"),
    metadata: {
      source: "landing_page",
      name: data.name,
      email: data.email,
      academyName: data.academyName,
      role: data.role,
      academySize: data.academySize,
      currentTools: data.currentTools,
    },
  });

  return noStoreJson({ ok: true });
}

type DemoRequestData = {
  name: string;
  email: string;
  academyName: string;
  role: string;
  academySize: string;
  currentTools: string;
  message: string;
};

function validateDemoRequest(payload: Record<string, unknown>): { data: DemoRequestData; error?: never } | { data?: never; error: Response } {
  const name = getString(payload.name);
  const email = getString(payload.email).toLowerCase();
  const academyName = getString(payload.academyName);
  const role = getString(payload.role);
  const academySize = getString(payload.academySize);
  const currentTools = getString(payload.currentTools, 160);
  const message = getString(payload.message, 800);

  if (name.length < 2) return { error: validationErrorJson("Enter your name.") };
  if (!emailPattern.test(email)) return { error: validationErrorJson("Enter a valid email address.") };
  if (academyName.length < 2) return { error: validationErrorJson("Enter your academy name.") };
  if (!roles.has(role)) return { error: validationErrorJson("Choose your role.") };
  if (!academySizes.has(academySize)) return { error: validationErrorJson("Choose your academy size.") };

  return {
    data: {
      name,
      email,
      academyName,
      role,
      academySize,
      currentTools,
      message,
    },
  };
}

function getString(value: unknown, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
