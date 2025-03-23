// https://webpack.js.org/configuration/
const minimize = true;
const TerserPlugin = require('terser-webpack-plugin');
let webpack = require('webpack'),
    path = require('path'),
    pkg = require("./package.json"),
    fileName = pkg.name + ".js",
    plugins = [
        new webpack.DefinePlugin({
            "VERSION": JSON.stringify(pkg.version)
        })
    ];

// Determine filename based on minimize flag
if (minimize) {
    fileName = pkg.name + ".min.js";
}

module.exports = {
    mode: 'production', // Adding mode explicitly
    entry: "./src/es6/index.js", // string | object | array
    output: {
        library: "persianDatepicker",
        libraryTarget: "umd2",
        path: path.resolve(__dirname, "dist/js"), // string
        filename: fileName // string
    },
    devServer: {
        contentBase: path.join(__dirname, "/"),
        port: 3000,
        host: 'localhost'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, "./src/es6")
                ],
                exclude: [
                    path.resolve(__dirname, "./node_module")
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: minimize,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    compress: {
                        drop_console: true
                    }
                },
                extractComments: false
            })
        ]
    },
    plugins: plugins
}
