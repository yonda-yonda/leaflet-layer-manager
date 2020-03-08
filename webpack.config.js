const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const package = require('./package.json');

module.exports = {
    entry: './src/main.js',
    mode: "production",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "leaflet-layer-manager.js"
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `${package.name} v${package.version} | ${package.author} | license: ${package.license}`
        })
    ],
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env', {
                                useBuiltIns: 'entry',
                                corejs: 3
                            }
                        ]
                    ]
                }
            }]
        }]
    },
    optimization: {
        minimizer: [new TerserPlugin({
            extractComments: false,
            terserOptions: {
                output: {
                    comments: /\**!|@preserve|@license|@cc_on/
                }
            },
        })],
    }
}