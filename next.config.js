module.exports = {
    async rewrites() {
        return [
          {
            source: '/:path*',
            destination: 'https://upsa.smile.tec.br/:path*',
          },
        ]
      },
  };