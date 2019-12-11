let <%= displayName %> = options => {
  options = options || {};
  this.options = options;
}

<%= displayName %>.prototype.apply = compiler => {
  if (compiler.hooks) {
    // webpack4 support
    compiler.hooks.done.tap('<%= displayName %>', stats => {
      console.log('Hello World!')
    })
  } else {
    // webpack3 support
    compiler.plugin('done', stats => {
      console.log('Hello World!')
    })
  }

}

module.exports = <%= displayName %>
