/* eslint-env node */

const
    path = require('path'),
    UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
    ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = {

    context: path.resolve(__dirname, './src'),

    entry: {
        'ccpwgl_int': './index.js',
        'ccpwgl_int.min': './index.js',
    },

    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        library: 'ccpwgl_int',
        libraryTarget: 'umd'
    },

    plugins: [
        new UglifyJsPlugin({
            include: /\.min\.js$/,
            sourceMap: true,
        }),
        new ProgressBarPlugin()
    ],

    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
                options: {
                    'fix' : true
                }
            },
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                loader: 'babel-loader',
                options: {
                    'presets': [
                        'env'
                    ]
                }
            }
        ]
    }
};

