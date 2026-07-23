const { withPodfile } = require('expo/config-plugins')

function addModularHeaders(podfile) {
  if (podfile.includes('use_modular_headers!')) return podfile
  return podfile.replace(
    "platform :ios, podfile_properties['ios.deploymentTarget'] || '16.4'",
    "platform :ios, podfile_properties['ios.deploymentTarget'] || '16.4'\nuse_modular_headers!"
  )
}

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = addModularHeaders(config.modResults.contents)
    return config
  })
}
