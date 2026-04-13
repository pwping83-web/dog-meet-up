# 댕댕마켓 — PWA → TWA(Trusted Web Activity) & Google Play

웹앱(Vite + PWA)을 **크롬 TWA로 감싼 Android 앱(AAB)** 으로 올리면 Play에서 설치·배포할 수 있습니다.  
공식 도구는 Google **`@bubblewrap/cli`**(Bubblewrap)입니다.

## 0. 전제 조건

- **프로덕션 URL**이 **HTTPS**로 배포되어 있음 (예: Vercel).
- PWA **`manifest`**에 `display: "standalone"`, `start_url`, `scope` 등이 올바름 (이 프로젝트는 `vite-plugin-pwa`로 생성).
- **개발자 계정** Google Play Console 등록(일회 비용).
- **앱 서명용 키스토어**(.jks / .keystore) 보관 계획.

## 1. PWA 쪽 마무리 (TWA 전에)

1. 실제 기기에서 **홈 화면에 추가** 후 전체 화면·오프라인·로그인 플로우 점검.
2. Play·스토어 스크린샷용으로 **512×512 이상 PNG 런처 아이콘** 준비(현재 `favicon.svg`만 있으면 Bubblewrap 단계에서 PNG를 따로 지정).
3. 배포 도메인이 정해지면 **Site URL**·**Redirect URLs**(Supabase Auth)에 동일 Origin 반영.

## 2. Bubblewrap 설치

```bash
npm install -g @bubblewrap/cli
bubblewrap --version
```

(JDK 17+ 권장. Android Studio는 AAB 빌드·에뮬레이터에 사용.)

## 3. `bubblewrap init` (한 번)

배포된 사이트의 **웹 매니페스트 URL**을 넘깁니다 (빌드 후 `https://YOUR_DOMAIN/manifest.webmanifest`).

```bash
cd twa
bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.webmanifest
```

질문에 대략 이렇게 맞추면 됩니다.

| 항목 | 예시 |
|------|------|
| Application name | 댕댕마켓 |
| Host | 배포 도메인 (예 `www.example.com`, **https 없이**) |
| Start URL | `/` |
| Display mode | `standalone` |
| Theme / background | `#f97316` / `#ffffff` |
| Package ID | 고유값 (예 `app.daengdaengmarket.twa`) — 한 번 정하면 바꾸기 어려움 |
| Signing key | 새로 만들거나 기존 keystore 경로 |

완료 후 `twa/` 아래에 **Android 프로젝트**(예: `android/` 또는 init 시 지정한 폴더)가 생깁니다.

## 4. 빌드 & Play 업로드

```bash
bubblewrap build
```

출력 **AAB**를 Play Console → 새 앱 → 프로덕션 트랙에 업로드.  
(첫 출시 전 **내부 테스트** 트랙으로 서명·설치 검증 권장.)

## 5. Digital Asset Links (`assetlinks.json`) — **필수**

Play에 올린 앱이 **당신의 도메인**을 “신뢰”하려면, 웹 서버에 아래 파일이 **정확한 JSON**으로 노출되어야 합니다.

- URL: `https://YOUR_DOMAIN/.well-known/assetlinks.json`
- `Content-Type: application/json`
- **패키지명** + **SHA-256 인증서 지문**(Play App Signing / 업로드 키)은 Play Console 또는 `keytool`로 확인.

이 레포에는 **`twa/assetlinks.template.json`** 을 복사해 값만 채운 뒤, **`public/.well-known/assetlinks.json`** 으로 넣고 다시 배포하면 Vite가 그대로 `dist`에 복사합니다.

검증: [Google Digital Asset Links API](https://developers.google.com/digital-asset-links/tools/generator) 또는 Chrome “개발자 도구 → Application”에서 확인.

## 6. 웹앱에서 Play 링크 연결

앱이 스토어에 나온 뒤 **스토어 URL**을 환경 변수로 넣습니다.

```env
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=YOUR_PACKAGE_ID
```

`VITE_SHOW_APP_INSTALL=true` 이면 `PlayStoreInstallBar`가 해당 링크를 사용합니다.

## 7. 심사·정책 체크리스트 (요약)

- **개인정보처리방침** URL (웹 또는 앱 내).
- **데이터 안전(Data safety)** 설문: Supabase·로그인·위치 등 수집 항목과 일치.
- TWA는 **웹 콘텐츠가 앱 본체**이므로, Play **최소 기능·스팸·지적재산** 정책에 맞는지 웹 전체를 기준으로 검토.
- **로그인 / 결제** 화면이 모바일에서 깨지지 않는지(이미 `viewport`·Safe area 작업 권장).

## 참고 링크

- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
