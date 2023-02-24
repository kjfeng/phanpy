import preact from '@preact/preset-vite';
import { execSync } from 'child_process';
import fs from 'fs';
import { resolve } from 'path';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import htmlPlugin from 'vite-plugin-html-config';
import VitePluginHtmlEnv from 'vite-plugin-html-env';
import { VitePWA } from 'vite-plugin-pwa';
import removeConsole from 'vite-plugin-remove-console';

const { NODE_ENV } = process.env;
const { VITE_CLIENT_NAME: CLIENT_NAME, VITE_APP_ERROR_LOGGING: ERROR_LOGGING } =
  loadEnv('production', process.cwd());

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

const rollbarCode = fs.readFileSync(
  resolve(__dirname, './rollbar.js'),
  'utf-8',
);

// https://vitejs.dev/config/
export default defineConfig({
  mode: NODE_ENV,
  define: {
    __BUILD_TIME__: JSON.stringify(Date.now()),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  plugins: [
    preact(),
    splitVendorChunkPlugin(),
    VitePluginHtmlEnv(),
    removeConsole({
      includes: ['log', 'debug', 'info', 'warn', 'error'],
    }),
    htmlPlugin({
      headScripts: ERROR_LOGGING ? [rollbarCode] : [],
    }),
    VitePWA({
      manifest: {
        name: CLIENT_NAME,
        short_name: CLIENT_NAME,
        description: 'Minimalistic opinionated Mastodon web client',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      strategies: 'injectManifest',
      injectRegister: 'inline',
      injectManifest: {
        // Prevent "Unable to find a place to inject the manifest" error
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: NODE_ENV === 'development',
        type: 'module',
      },
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        compose: resolve(__dirname, 'compose/index.html'),
      },
    },
  },
});
