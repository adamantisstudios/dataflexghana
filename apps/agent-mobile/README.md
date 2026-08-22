# DataFlex Agent Android app

MVP: login (+2FA), home menus (tutorials → compliance), **Data Bundles** (native order), **Compliance** (native submit).

## Run

```bash
cd apps/agent-mobile
flutter pub get
flutter run
# or
flutter build apk --release --target-platform android-arm64
```

Default API: `https://www.dataflexghana.com`

Requires deployed routes:
- `POST /api/agent/login`
- `POST /api/agent/verify-2fa`
- `GET /api/agent/mobile/home`
- `GET /api/agent/mobile/data-bundles`
- `POST /api/agent/mobile/data-orders`
- `GET|POST /api/agent/mobile/compliance`
