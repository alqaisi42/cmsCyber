/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        const apiTarget = process.env.API_PROXY_TARGET || 'http://148.230.111.245:32080';

        return [
            {
                source: '/api/v1/:path*',
                destination: `${apiTarget}/api/v1/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;