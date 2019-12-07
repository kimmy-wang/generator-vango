const rValidId = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)$/

function isPluginId(pluginId) {
  if (rValidId.test(pluginId)) {
    return true
  } else {
    return 'Plugin ID must be all lowercase with dashes as separators.'
  }
}
exports.isPluginId = isPluginId

function isRequired(value) {
  if (value === '') {
    return 'Please provide a value'
  } else {
    return true
  }
}
exports.isRequired = isRequired
