var path = require('path')
var fs = require('fs')
var utils = require('./utils')
var config = require('../config')
var webpack = require('webpack')
var merge = require('webpack-merge')
var vueLoaderConfig = require('./vue-loader.conf')
var MpvuePlugin = require('webpack-mpvue-asset-plugin')
var glob = require('glob')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var relative = require('relative')
var AliReplacePlugin = require('./ali-replace-plugin')

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

function getEntry (rootSrc) {
  var map = {};
  glob.sync(rootSrc + '/pages/**/main.js')
  .forEach(file => {
    var key = relative(rootSrc, file).replace('.js', '');
    map[key] = file;
  })
   return map;
}

const appEntry = { app: resolve('./src/main.js') }
const pagesEntry = getEntry(resolve('./src'), 'pages/**/main.js')
const entry = Object.assign({}, appEntry, pagesEntry)

let baseWebpackConfig = {
  // 如果要自定义生成的 dist 目录里面的文件路径，
  // 可以将 entry 写成 {'toPath': 'fromPath'} 的形式，
  // toPath 为相对于 dist 的路径, 例：index/demo，则生成的文件地址为 dist/index/demo.js
  entry,
  target: require('mpvue-webpack-target'),
  output: {
    path: config.build.assetsRoot,
    jsonpFunction: 'webpackJsonpMpvue',
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      {{#if_eq build "standalone"}}
      // 'vue$': `vue/dist/${config.build.fileExt.platform}/vue.esm.js`,
      {{/if_eq}}
      'vue': 'mpvue',
      '@': resolve('src')
    },
    symlinks: false,
    aliasFields: ['mpvue', 'weapp', 'browser'],
    mainFields: ['browser', 'module', 'main']
  },
  module: {
    rules: [
      {{#lint}}
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src'), resolve('test')],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {{/lint}}
      {
        test: /\.vue$/,
        loader: 'mpvue-loader-ex',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        include: [resolve('src'), resolve('test')],
        use: [
          'babel-loader',
          {
            loader: 'mpvue-loader-ex',
            options: Object.assign({checkMPEntry: true}, vueLoaderConfig)
          },
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[ext]')
        }
      }
    ]
  },
  plugins: [
    // api 统一桥协议方案
    new webpack.DefinePlugin({
      'mpvue': 'global.mpvue',
      'mpvuePlatform': 'global.mpvuePlatform'
    }),
    new MpvuePlugin(),
    new CopyWebpackPlugin([{
      from: '**/*.json',
      to: ''
    }], {
      context: 'src/'
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: path.resolve(config.build.assetsRoot, './static'),
        ignore: ['.*']
      }
    ])
  ]
}

// 针对百度小程序，由于不支持通过 miniprogramRoot 进行自定义构建完的文件的根路径
// 所以需要将项目根路径下面的 project.swan.json 拷贝到 dist/swan 下
// 然后百度开发者工具将 dist/swan 作为项目根目录打开进行调试
if (process.env.PLATFORM === 'swan') {
  baseWebpackConfig = merge(baseWebpackConfig, {
    plugins: [
      new CopyWebpackPlugin([{
        from: path.resolve(__dirname, '../project.swan.json'),
        to: path.resolve(config.build.assetsRoot)
      }])
    ]
  })
}

if (process.env.PLATFORM == 'ali') {
  baseWebpackConfig = merge(baseWebpackConfig, {
    plugins: [
      // 支付宝小程序里没有 global 对象，需要模拟一个
      new webpack.BannerPlugin({
        banner: `if(!getApp.global) { getApp.global = { getApp: getApp } } var global = getApp.global;\n`,
        test: /\.js$/,
        raw: true,
      }),

      new AliReplacePlugin()
    ]
  })
}

module.exports = baseWebpackConfig

