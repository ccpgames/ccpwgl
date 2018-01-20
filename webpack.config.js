/* eslint-env node */

const path = require('path');
//const webpack = require('webpack');

module.exports = {

    context: path.resolve(__dirname, './src'),

    entry: {
        'ccpwgl_int': './index.js',
        //'ccpwgl_int.min': './index.js',
    },

    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        library: 'ccpwgl_int',
        libraryTarget: 'umd'
    },

    plugins: [
        /*
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true,
        }),
        */
    ],

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'babel-loader',
                }],
            }
        ]
    }
};

