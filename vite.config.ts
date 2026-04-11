import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

/** Vercel 빌드 시 설정됨 → 사이트에서 Git 커밋과 대조 가능 */
const vercelGitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || ''
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/** 디버그 세션(51d57b): dev 서버가 동일 출처로 NDJSON을 debug-51d57b.log에 적습니다. */
function debugSessionLogIngest() {
  const logFile = path.join(__dirname, 'debug-51d57b.log')
  return {
    name: 'debug-session-log-ingest',
    configureServer(server) {
      server.middlewares.use('/__debug/ingest-51d57b', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => {
          chunks.push(c)
        })
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8')
            fs.appendFileSync(logFile, `${body.trimEnd()}\n`, 'utf8')
          } catch {
            /* ignore */
          }
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

export default defineConfig({
  define: {
    __APP_DEPLOY_COMMIT__: JSON.stringify(vercelGitCommitSha),
  },
  plugins: [
    figmaAssetResolver(),
    debugSessionLogIngest(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '댕댕마켓 - 우리 동네 댕친 찾기',
        short_name: '댕댕마켓',
        description: '우리 동네 강아지 모임과 댕집사를 연결하는 커뮤니티 웹앱',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'ko',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        navigateFallback: '/index.html',
        // OAuth PKCE 콜백(?code=)에서 캐시된 SPA 껍데기만 받지 않도록 제외
        navigateFallbackDenylist: [/\?code=/, /\?error=/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
