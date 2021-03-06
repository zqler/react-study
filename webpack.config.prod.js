const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin"); //独立打包css模块;
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin"); //压缩CSS模块;
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin; //打包组成部分分析
module.exports = {
    entry: {
        main: "./src/index.jsx",
        vendor: ["react", "react-dom", "react-router-dom", "moment", "whatwg-fetch"]
            //分离外部引入插件
    },
    output: {
        path: path.resolve(process.cwd(), "dist"),
        filename: "[name].min.js",
        publicPath: "./",
        chunkFilename: "[name].[chunkhash:5].js"
    },
    resolve: {
        extensions: [".js", ".jsx",".scss"]
    },
    module: {
        rules: [{
                test: /\.jsx|js$/,
                exclude: /(node_modules)/,
                use: [{
                    loader: "babel-loader"
                }]
            },
            {
                test: /\.css|scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{
                            loader: "css-loader",
                            options: {
                                importLoaders: 1
                            }
                        },
                        {
                            loader: "postcss-loader", //自动补全css浏览器前缀
                            options: {
                                sourceMap: true,
                                plugins: function() {
                                    return [
                                        require("autoprefixer")({ browsers: ["last 20 versions"] })
                                    ];
                                }
                            }
                        },
                        "resolve-url-loader",
                        "sass-loader?sourceMap"
                    ],
                    publicPath: "./" //修改css中如背景图片的路径引用
                })
            },
            {
                test: /\.png|jpg|gif|svg|jpeg|ico$/,
                use: [{
                        loader: "url-loader", //加载url-loader 同时安装 file-loader;
                        options: {
                            limit: 5000, //小于5000b的图片文件转base64到css里,当然css文件体积更大;
                            name: "/img/[name].[hash:8].[ext]", //设置最终images路径;
                            query: "random=" + new Date().getTime()
                        }
                    },
                    {
                        //压缩图片(另一个压缩图片：image-webpack-loader) 先压缩再判断是否小于上面的limit再决定是否转base64;
                        loader: "img-loader?minimize&optimizationLevel=5&progressive=true"
                    }
                ]
            }
        ]
    },
    plugins: [
        new BundleAnalyzerPlugin({
            generateStatsFile: true
        }), //包体分析
        new webpack.ContextReplacementPlugin(
            /moment[\\\/]locale$/,
            /^\.\/(zh-cn)$/
        ),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production"), //production & development,
                PUBLIC_PATH: JSON.stringify("http://127.0.0.1")
            }
        }),
        //从js中抽离css,属性disable为true表示禁用此插件并不抽离css，为false表示不禁用此插件，抽离css并打包成单独的css文件
        new ExtractTextPlugin({
            filename: "[name].min.css",
            disable: false,
            allChunks: true
        }),
        //压缩css;
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g, //正则匹配后缀.css文件;
            cssProcessor: require("cssnano"), //加载‘cssnano’css优化插件;
            cssProcessorOptions: { discardComments: { removeAll: true } }, //插件设置,删除所有注释;
            canPrint: true //设置是否可以向控制台打日志,默认为true;
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor", //公共模块的名称，与entry里的名字对应
            filename: "vendor.min.js", //公开模块的文件名（生成的文件名）
            chunks: ["main"],
            minChunks: Infinity //为Infinity 仅仅创建公共组件块，不会把任何modules打包进去
        }),
        //webpack内置js压缩插件
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            output: {
                ascii_only: true
            },
            compress: {
                //去处警告，打印登调试信息
                warnings: false,
                drop_debugger: true,
                drop_console: true
            }
        }),
        new HtmlWebpackPlugin({
            title: "Components-Collect",
            template: "src/index.html",
            // favicon:"asset/images/favicon.ico",
            inject: "body",
            chunks: ["main", "vendor"],
            hash: true,
            filename: path.join(__dirname, "./dist/index.html"),
            minify: {
                removeComments: true,
                collapseWhitespace: true
            }
        })
    ]
};