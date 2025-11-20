import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use static export only for production builds when explicitly desired.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
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