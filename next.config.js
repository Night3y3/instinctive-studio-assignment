/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Ignore node-specific modules when bundling for the browser
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            }
        }

        // Ignore .node files
        config.module.rules.push({
            test: /\.node$/,
            use: 'ignore-loader',
        })

        // Alternative: exclude onnxruntime-node entirely for client-side
        config.externals = config.externals || []
        config.externals.push({
            'onnxruntime-node': 'commonjs onnxruntime-node',
        })

        return config
    },
    experimental: {
        serverComponentsExternalPackages: ['@xenova/transformers'],
    },
}

module.exports = nextConfig