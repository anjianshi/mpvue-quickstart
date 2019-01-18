// 对微信小程序的打包结果进行转译，使其匹配支付宝小程序的运行环境

class AliReplacePlugin {
    apply(compiler) {
        compiler.plugin('emit', (compilation, callback) => {
            Object.keys(compilation.assets)
                .filter(detect)
                .forEach(name => replace(compilation.assets[name]))
            callback()
        })
    }
}

// 判断是否是需要替换的文件
function detect(path) {
    return path.endsWith('.axml')
}

// 替换 asset 内容
function replace(asset) {
    let content = asset._value

    // 事件替换 bindxxx => onXxx
    content = content.replace(
        /bind(.+?)=/g,
        (match, evt) => 'on' + evt[0].toUpperCase() + evt.slice(1) + '='
    )

    // 替换列表渲染和条件渲染等语法  wx:for => a:for
    content = content.replace(
        /wx:(.+?)=/g,
        (match, name) => 'a:' + name + '='
    )

    asset._value = content
}


module.exports = AliReplacePlugin
