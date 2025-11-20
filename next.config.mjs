import withPWA from '@ducanh2912/next-pwa';

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

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExports: true, // ← Agrega esta línea para PWA con export estático
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);