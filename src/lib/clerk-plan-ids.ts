const LEGACY_PLUS_PLAN_IDS = ["cplan_33b_oku0vc4d1"];
const LEGACY_AUTOMATE_PLAN_IDS = ["cplan_349_aaGMut0q1"];

const FALLBACK_PLUS_PLAN_ID = "cplan_33DAB0ChNOO9L2vRGzokuOvc4dl";
const FALLBACK_AUTOMATE_PLAN_ID = "cplan_349QpNnD3FxIFL9snoaaGMutOq1";

function resolvePlanId(
  envValue: string | undefined,
  legacyValues: string[],
  fallback: string
) {
  if (!envValue) return fallback;
  if (legacyValues.includes(envValue)) return fallback;
  return envValue;
}

export const plusPlanId = resolvePlanId(
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID,
  LEGACY_PLUS_PLAN_IDS,
  FALLBACK_PLUS_PLAN_ID
);

export const automatePlanId = resolvePlanId(
  process.env.NEXT_PUBLIC_CLERK_AUTOMATE_PLAN_ID,
  LEGACY_AUTOMATE_PLAN_IDS,
  FALLBACK_AUTOMATE_PLAN_ID
);


