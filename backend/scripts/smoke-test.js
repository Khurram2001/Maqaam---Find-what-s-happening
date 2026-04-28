const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const prisma = require("../src/lib/prisma");

const base = "http://localhost:5000/api";
const now = Date.now();
const user = {
  name: "User Smoke",
  email: `user${now}@test.com`,
  password: "Pass12345!",
};
const admin = {
  name: "Admin Smoke",
  email: `admin${now}@test.com`,
  password: "Pass12345!",
};

const cookieJar = {
  user: "",
  admin: "",
};

async function req(method, path, body, who) {
  const options = {
    method,
    headers: {
      "content-type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (who && cookieJar[who]) {
    options.headers.cookie = cookieJar[who];
  }

  const response = await fetch(`${base}${path}`, options);
  const setCookies = response.headers.getSetCookie?.() || [];
  if (who && setCookies.length > 0) {
    cookieJar[who] = setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  let json = null;
  try {
    json = await response.json();
  } catch (_error) {
    // ignore non-json responses for smoke output
  }

  return { status: response.status, json };
}

async function main() {
  const out = {};
  out.health = await req("GET", "/health");
  out.userRegister = await req("POST", "/auth/register", user, "user");
  out.adminRegister = await req("POST", "/auth/register", admin, "admin");

  await prisma.user.update({
    where: { email: admin.email },
    data: { role: "ADMIN" },
  });

  out.createCategory = await req(
    "POST",
    "/categories",
    { name: `Community ${now}`, slug: `community-${now}` },
    "admin"
  );

  out.createEvent = await req(
    "POST",
    "/events",
    {
      title: `Smoke Event ${now}`,
      description: "Smoke event description for validation",
      categoryId: out.createCategory.json?.data?.category?.id,
      addressLine: "Street 1",
      formattedAddress: "Street 1, City",
      providerPlaceId: "test-place",
      latitude: 24.8607,
      longitude: 67.0011,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    },
    "user"
  );

  const eventId = out.createEvent.json?.data?.event?.id;
  out.pending = await req("GET", "/admin/events/pending", null, "admin");
  out.approve = await req("PATCH", `/admin/events/${eventId}/approve`, {}, "admin");
  out.publicEvents = await req("GET", "/events");

  const summary = {
    checks: {
      health: out.health.status,
      registerUser: out.userRegister.status,
      registerAdmin: out.adminRegister.status,
      createCategory: out.createCategory.status,
      createEvent: out.createEvent.status,
      pending: out.pending.status,
      approve: out.approve.status,
      publicEvents: out.publicEvents.status,
    },
    eventId,
    publicCount: out.publicEvents.json?.data?.pagination?.total,
    approvedStatus: out.approve.json?.data?.event?.status,
    errors: {
      userRegister: out.userRegister.json?.error,
      adminRegister: out.adminRegister.json?.error,
      createCategory: out.createCategory.json?.error,
      createEvent: out.createEvent.json?.error,
      pending: out.pending.json?.error,
      approve: out.approve.json?.error,
      publicEvents: out.publicEvents.json?.error,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
