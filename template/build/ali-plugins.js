// 对微信小程序的打包结果进行转译，使其匹配支付宝小程序的运行环境

function updateAsset(asset, updater) {
    const origContent = asset._value || asset.source()
    const content = updater(origContent)

    delete asset._value
    delete asset.source
    delete asset.size
    delete asset.children

    asset.source = () => content
    asset.size = () => content.length
}


// 支付宝小程序里没有 global 对象，通过此脚本定义一个模拟的 global，顺便提供一些与浏览器之间的兼容层
class AliProvideGlobalPlugin {
    apply(compiler) {
        compiler.plugin('emit', (compilation, callback) => {
            const globalScript = this.globalScript()
            compilation.assets['global.js'] = {
                source: () => globalScript,
                size: () => globalScript.length,
            }

            Object.keys(compilation.assets)
                .filter(path => path.endsWith('.js') && path !== 'global.js')
                .forEach(path => updateAsset(
                    compilation.assets[path],
                    content => `${this.injectGlobal(path)}\n${content}`
                ))

            callback()
        })
    }

    globalScript() {
        return `
            var global = getApp._global = {}
            global.getApp = getApp

            // ===== 模拟 sessionStorage、localStorage =====
            function FakeStorage() {}
            FakeStorage.prototype.getItem = function getItem(key) {
                return this.key
            }
            FakeStorage.prototype.setItem = function setItem(key, value) {
                this[key] = String(value)
            }

            global.sessionStorage = new FakeStorage()
            global.localStorage = new FakeStorage()

            // ===== 模拟 document =====
            global.document = {
                documentElement: {
                    clientHeight: 0,
                    clientWidth: 0,
                }
            }

            module.exports = global
        `
    }

    injectGlobal(assetPath) {
        const globalJsPath = assetPath.indexOf('/') === -1
            ? './global.js'
            : assetPath.replace(new RegExp('[^/]+/', 'g'), '../').replace(new RegExp('[^/]+$'), 'global.js')
        return `
            var global = require('${globalJsPath}');
            var window = global;
            var document = global.document;
            var localStorage = global.localStorage;
            var sessionStorage = global.sessionStorage;
        `
    }
}


// 把微信小程序的模板文件转换为支付宝小程序的格式
class AliFixTemplatePlugin {
    apply(compiler) {
        compiler.plugin('emit', (compilation, callback) => {
            Object.keys(compilation.assets)
                .filter(path => path.endsWith('.axml'))
                .forEach(name => updateAsset(compilation.assets[name], this.update))
            callback()
        })
    }

    update(content) {
        content = content.replace(
            /bind(.+?)=/g,
            (match, evt) => 'on' + evt[0].toUpperCase() + evt.slice(1) + '='
        )

        // 替换列表渲染和条件渲染等语法  wx:for => a:for
        content = content.replace(
            /wx:(.+?)=/g,
            (match, name) => 'a:' + name + '='
        )

        return content
    }
}


module.exports = [
    new AliProvideGlobalPlugin(),
    new AliFixTemplatePlugin()
]
