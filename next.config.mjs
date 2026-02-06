/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Deshabilitar el overlay de desarrollo
  reactStrictMode: false,
  // Mejorar el manejo de chunks dinámicos
  experimental: {
    optimizePackageImports: ['xlsx'],
  },
  webpack: (config, { isServer }) => {
    // Resolver problemas de módulos comunes
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Mejorar el manejo de módulos dinámicos
    if (!isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 30000,
      }
    }
    
    // Optimizar para archivos grandes
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendors: false,
          // Crear un chunk separado para vendor libraries grandes
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
            reuseExistingChunk: true,
          },
          // Chunk para librerías comunes
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    }
    
    return config
  },
}

export default nextConfig
