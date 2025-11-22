// Load PWA plugin dynamically to avoid source-map parsing errors when
// Node/Next loads this config in development. The plugin will be enabled
// in production or when `ENABLE_PWA=1` is set in the environment.
// (This keeps PWA functionality without importing the package during dev.)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use static export only when explicitly requested via NEXT_EXPORT=1.
  // This avoids forcing `output: 'export'` on every production build
  // which breaks pages that are intentionally dynamic (auth, client-side).
  output: process.env.NEXT_EXPORT === '1' ? 'export' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Silenciar warning de Turbopack
  turbopack: {},
  // Opcional: Configurar la carpeta de salida
  distDir: 'out',
  // Opcional: Configurar trailingSlash para mejor compatibilidad
  trailingSlash: true,
}

const enablePWA = process.env.NODE_ENV === 'production' || process.env.ENABLE_PWA === '1';

export default async function (_phase, _opts) {
  let finalConfig = nextConfig;
  if (enablePWA) {
    try {
      const mod = await import('@ducanh2912/next-pwa');
      const withPWA = mod?.default ?? mod;
      finalConfig = withPWA({
        dest: 'public',
        register: true,
        skipWaiting: true,
        disable: process.env.NODE_ENV === 'development',
        buildExports: true,
        buildExcludes: [/middleware-manifest\.json$/],
      })(nextConfig);
    } catch (err) {
      // If import fails, log and continue without PWA to avoid breaking dev/startup
      console.error('Warning: could not load @ducanh2912/next-pwa, continuing without PWA. Error:', err?.message ?? err);
    }
  }
  return finalConfig;
}