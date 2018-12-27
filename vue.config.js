const webpack = require('webpack');
const pmsApiList = [
  'Right', 'login.html', 'Message', 'TransFlow', 'Account', 'API', 'WebCenter', 'Form', 'scripts', 'PowerPlat', 'Scripts', 'App_Themes', 'Projects', 'Resource', 'Images', 'WorkFlow', 'NPMS', 'NPMSControl', 'ImportWin', 'MainControls'
]

const defaultSite = `http://47.101.200.39:9085`//9096-9097
let proxyTable = {}
pmsApiList.forEach(v => {
  const pathRewrite = {}
  pathRewrite[`^/${v}`] = `/${v}`
  proxyTable[`/${v}`] = {
    target: defaultSite,
    changeOrigin: true
    // secure: false,
    // Referer: defaultSite,
    // headers: {
    //   Referer: defaultSite
    // },
    // pathRewrite: pathRewrite
  }
})

module.exports = {
  lintOnSave: true,
  baseUrl: '/',
  devServer: {
    port: 6677,
    proxy: proxyTable
  },
  assetsDir: 'npstatic' // 将静态文件打包到static文件夹下
}