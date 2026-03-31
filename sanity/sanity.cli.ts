import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "7650ttlb",
    dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  },
  studioHost: "lumine-concept",
  deployment: {
    appId: "vaia10caob0m0wny8za3obie",
  },
});
