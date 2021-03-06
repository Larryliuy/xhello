const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
    // devtool:'eval-source-map',
    entry:{
        app:__dirname + '/src/index.js',
        vendor:['react','react-dom','react-redux','react-router-dom','redux']
    },
    output: {
        path: __dirname + '/build',
        filename: '[name].js',
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            // 'process.env.NODE.ENV': 'production'
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new ExtractTextPlugin({filename:'style.css',disable: false,allChunks: true}),
        new webpack.optimize.CommonsChunkPlugin({
            name:'vendor',
            // minChunks: ({ resource }) => (
            //     resource &&
            //     resource.indexOf('node_modules') >= 0 &&
            //     resource.match(/\.js$/)
            // ),
            fileName:'vendors.js'
        }),
        new webpack.optimize.UglifyJsPlugin({
            output: {
                comments: false,  // remove all comments
            },
            compress: {
                warnings: false,
                drop_debugger: true
                //drop_console: true //去掉console
            }
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test:/\.js$/,
                enforce:'pre',
                loader:'eslint-loader',
                include:path.resolve(__dirname,'src')
            },
            {
                test: /\.css$/,
                // exclude: /node_modules/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use:[
                        {
                            loader: 'css-loader',
                            options:{
                                minimize: true //css压缩,dev环境不用压缩
                            }
                        }
                    ]
                })
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use:['css-loader','sass-loader']
                })
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use:['css-loader','less-loader']
                })
            }
        ]
    },
    devServer:{
        // contentBase:path.join(__dirname, 'build'),
        contentBase:__dirname + '/build',
        historyApiFallback:true,
        hot:true,
        inline:true,
        port:3006,
    //     // host:'10.1.1.127'
    //     // proxy: {
    //     //     '/': {
    //     //         target: 'https://192.168.6.3/softwares/xtell_projects_dev/24_YUN_VIDEO/src/web/',
    //     //         secure: false
    //     //     }
    //     // }
    }
};