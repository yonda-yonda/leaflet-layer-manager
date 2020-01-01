const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/main.js',
    mode: "production",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "leaflet-layer-manager.js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: "babel-loader",
                options: {
                    presets: [
                        [
                            "@babel/preset-env", {
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