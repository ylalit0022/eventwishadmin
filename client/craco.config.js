const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    "process": require.resolve("process/browser"),
                    "path": false,
                    "stream": false,
                    "zlib": false,
                    "util": false,
                    "buffer": false,
                    "asset": false,
                    "fs": false,
                    "os": false,
                }
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        resolve: {
                            fullySpecified: false
                        }
                    }
                ]
            }
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer']
            }),
            new webpack.DefinePlugin({
                'define': 'false'
            })
        ]
    }
};
