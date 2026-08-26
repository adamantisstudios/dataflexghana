/** Prefer site-hosted APK so downloads work even when the GitHub repo is private. */
export const APP_RELEASE = {
  versionName: "1.0.0",
  versionCode: 1,
  fileName: "dataflex-agent.apk",
  downloadPath: "/app/dataflex-agent.apk",
  apiDownloadPath: "/api/app/download",
  installPagePath: "/appinstall",
  platform: "Android",
  updatedLabel: "August 2026",
  sizeLabel: "About 21 MB",
  productName: "DataFlex Agent",
} as const
