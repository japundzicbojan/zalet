#!/usr/bin/env node
/**
 * End-to-end smoke: create async run → poll → zip + preview.
 * Usage: BASE_URL=http://127.0.0.1:43123 node scripts/smoke-demo.mjs [productUrl]
 */
const base = (process.env.BASE_URL || "http://127.0.0.1:43123").replace(
  /\/$/,
  "",
);
const productUrl = process.argv[2] || "https://resend.com";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`health → ${base}/api/health`);
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  console.log("providers", health.providers || health);

  const t0 = Date.now();
  const createRes = await fetch(`${base}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: productUrl,
      icp: "Founders shipping B2B SaaS",
      goal: "launch",
    }),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) {
    console.error("create failed", createRes.status, createBody);
    process.exit(1);
  }
  const id = createBody.id || createBody.run?.id;
  console.log(
    `created ${id} in ${Date.now() - t0}ms status=${createBody.run?.status}`,
  );

  let run;
  for (let i = 0; i < 90; i++) {
    await sleep(2000);
    const res = await fetch(`${base}/api/runs/${id}`, { cache: "no-store" });
    const data = await res.json();
    run = data.run;
    const zipFlag = Boolean(run.daytona?.zipReady);
    process.stdout.write(
      `\r[${i}] ${run.status} events=${run.events?.length || 0} zip=${zipFlag}   `,
    );
    if (run.status === "completed" || run.status === "failed") break;
  }
  console.log("");

  if (run.status !== "completed") {
    console.error("run did not complete", run.status, run.error);
    process.exit(1);
  }

  const scripts = run.campaign?.scripts || [];
  const langs = scripts.map((s) => s.language);
  console.log("scripts", langs.join(","));
  console.log("creatives", (run.creatives || []).length);
  console.log("providers", run.providers);

  const zip = await fetch(`${base}/api/runs/${id}/zip`);
  console.log("zip", zip.status, zip.headers.get("content-type"));
  const preview = await fetch(`${base}/api/runs/${id}/preview`);
  console.log("preview", preview.status, preview.headers.get("content-type"));
  console.log(`board ${base}/c/${id}`);

  if (!zip.ok || !preview.ok) process.exit(1);
  if (!langs.includes("sr")) {
    console.warn("warn: no Serbian script in this run");
  }
  console.log("SMOKE OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
