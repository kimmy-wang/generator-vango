/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

let Generator = require('yeoman-generator')
let yosay = require('yosay')

let path = require('path')
let validator = require('./validator')
let env = require('./env')
let childProcess = require('child_process')
let chalk = require('chalk')

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts)
    this.option('extensionType', { type: String })
    this.option('extensionName', { type: String })
    this.option('extensionDescription', { type: String })
    this.option('extensionDisplayName', { type: String })

    this.option('extensionParam', { type: String })
    this.option('extensionParam2', { type: String })

    this.extensionConfig = Object.create(null)
    this.extensionConfig.installDependencies = false
  }

  initializing() {
    // Welcome
    this.log(yosay('Welcome to the Visual Studio Code Extension generator!'))

    // evaluateEngineVersion
    let extensionConfig = this.extensionConfig
    return env.getLatestVSCodeVersion().then(version => {
      extensionConfig.vsCodeEngine = version
    })
  }

  prompting() {
    let generator = this
    let prompts = {
      // Ask for extension type
      askForType: () => {
        let extensionType = generator.options['extensionType']
        if (extensionType) {
          let extensionTypes = ['command-js', 'extensionpack']
          if (extensionTypes.indexOf(extensionType) !== -1) {
            generator.extensionConfig.type = 'ext-' + extensionType
          } else {
            generator.log(
              'Invalid extension type: ' +
                extensionType +
                '. Possible types are :' +
                extensionTypes.join(', '),
            )
          }
          return Promise.resolve()
        }

        return generator
          .prompt({
            type: 'list',
            name: 'type',
            message: 'What type of extension do you want to create?',
            choices: [
              {
                name: 'New Extension (JavaScript)',
                value: 'ext-command-js',
              },
              {
                name: 'New Extension Pack',
                value: 'ext-extensionpack',
              },
            ],
          })
          .then(typeAnswer => {
            generator.extensionConfig.type = typeAnswer.type
          })
      },

      askForExtensionPackInfo: () => {
        if (generator.extensionConfig.type !== 'ext-extensionpack') {
          return Promise.resolve()
        }

        generator.extensionConfig.isCustomization = true
        const defaultExtensionList = ['publisher.extensionName']

        const getExtensionList = () =>
          new Promise((resolve, reject) => {
            childProcess.exec('code --list-extensions', (error, stdout, stderr) => {
              if (error) {
                generator.env.error(error)
              } else {
                let out = stdout.trim()
                if (out.length > 0) {
                  generator.extensionConfig.extensionList = out.split(/\s/)
                }
              }
              resolve()
            })
          })

        const extensionParam = generator.options['extensionParam']
        if (extensionParam) {
          switch (
            extensionParam
              .toString()
              .trim()
              .toLowerCase()
          ) {
            case 'n':
              generator.extensionConfig.extensionList = defaultExtensionList
              return Promise.resolve()
            case 'y':
              return getExtensionList()
          }
        }

        return generator
          .prompt({
            type: 'confirm',
            name: 'addExtensions',
            message: 'Add the currently installed extensions to the extension pack?',
            default: true,
          })
          .then(addExtensionsAnswer => {
            generator.extensionConfig.extensionList = defaultExtensionList
            if (addExtensionsAnswer.addExtensions) {
              return getExtensionList()
            }
          })
      },

      // Ask for extension display name ("displayName" in package.json)
      askForExtensionDisplayName: () => {
        let extensionDisplayName = generator.options['extensionDisplayName']
        if (extensionDisplayName) {
          generator.extensionConfig.displayName = extensionDisplayName
          return Promise.resolve()
        }

        return generator
          .prompt({
            type: 'input',
            name: 'displayName',
            message: "What's the name of your extension?",
            default: generator.extensionConfig.displayName,
          })
          .then(displayNameAnswer => {
            generator.extensionConfig.displayName = displayNameAnswer.displayName
          })
      },

      // Ask for extension id ("name" in package.json)
      askForExtensionId: () => {
        let extensionName = generator.options['extensionName']
        if (extensionName) {
          generator.extensionConfig.name = extensionName
          return Promise.resolve()
        }
        let def = generator.extensionConfig.name
        if (!def && generator.extensionConfig.displayName) {
          def = generator.extensionConfig.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        }
        if (!def) {
          def == ''
        }

        return generator
          .prompt({
            type: 'input',
            name: 'name',
            message: "What's the identifier of your extension?",
            default: def,
            validate: validator.validateExtensionId,
          })
          .then(nameAnswer => {
            generator.extensionConfig.name = nameAnswer.name
          })
      },

      // Ask for extension description
      askForExtensionDescription: () => {
        let extensionDescription = generator.options['extensionDescription']
        if (extensionDescription) {
          generator.extensionConfig.description = extensionDescription
          return Promise.resolve()
        }

        return generator
          .prompt({
            type: 'input',
            name: 'description',
            message: "What's the description of your extension?",
          })
          .then(descriptionAnswer => {
            generator.extensionConfig.description = descriptionAnswer.description
          })
      },

      askForJavaScriptInfo: () => {
        if (generator.extensionConfig.type !== 'ext-command-js') {
          return Promise.resolve()
        }
        generator.extensionConfig.checkJavaScript = false
        return generator
          .prompt({
            type: 'confirm',
            name: 'checkJavaScript',
            message: "Enable JavaScript type checking in 'jsconfig.json'?",
            default: false,
          })
          .then(strictJavaScriptAnswer => {
            generator.extensionConfig.checkJavaScript = strictJavaScriptAnswer.checkJavaScript
          })
      },

      askForGit: () => {
        if (generator.extensionConfig.type !== 'ext-command-js') {
          return Promise.resolve()
        }

        return generator
          .prompt({
            type: 'confirm',
            name: 'gitInit',
            message: 'Initialize a git repository?',
            default: true,
          })
          .then(gitAnswer => {
            generator.extensionConfig.gitInit = gitAnswer.gitInit
          })
      },

      askForPackageManager: () => {
        if (generator.extensionConfig.type !== 'ext-command-js') {
          return Promise.resolve()
        }
        generator.extensionConfig.pkgManager = 'npm'
        return generator
          .prompt({
            type: 'list',
            name: 'pkgManager',
            message: 'Which package manager to use?',
            choices: [
              {
                name: 'npm',
                value: 'npm',
              },
              {
                name: 'yarn',
                value: 'yarn',
              },
            ],
          })
          .then(pckgManagerAnswer => {
            generator.extensionConfig.pkgManager = pckgManagerAnswer.pkgManager
          })
      },
    }

    // run all prompts in sequence. Results can be ignored.
    let result = Promise.resolve()
    for (let taskName in prompts) {
      let prompt = prompts[taskName]
      result = result.then(_ => {
        return new Promise((s, r) => {
          setTimeout(_ => prompt().then(s, r), 0) // set timeout is required, otherwise node hangs
        })
      })
    }
    return result
  }
  // Write files
  writing() {
    this.sourceRoot(path.join(__dirname, './templates/' + this.extensionConfig.type))

    switch (this.extensionConfig.type) {
      case 'ext-command-js':
        this._writingCommandJs()
        break
      case 'ext-extensionpack':
        this._writingExtensionPack()
        break
      default:
        //unknown project type
        break
    }
  }

  // Write Color Theme Extension
  _writingExtensionPack() {
    let context = this.extensionConfig

    this.fs.copy(this.sourceRoot() + '/vscode', context.name + '/.vscode')
    this.fs.copyTpl(this.sourceRoot() + '/package.json', context.name + '/package.json', context)
    this.fs.copyTpl(
      this.sourceRoot() + '/vsc-extension-quickstart.md',
      context.name + '/vsc-extension-quickstart.md',
      context,
    )
    this.fs.copyTpl(this.sourceRoot() + '/README.md', context.name + '/README.md', context)
    this.fs.copyTpl(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context)
    this.fs.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore')
    if (this.extensionConfig.gitInit) {
      this.fs.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore')
      this.fs.copy(this.sourceRoot() + '/gitattributes', context.name + '/.gitattributes')
    }
  }

  // Write Command Extension (JavaScript)
  _writingCommandJs() {
    let context = this.extensionConfig

    this.fs.copy(this.sourceRoot() + '/vscode', context.name + '/.vscode')
    this.fs.copy(this.sourceRoot() + '/test', context.name + '/test')

    this.fs.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore')

    if (this.extensionConfig.gitInit) {
      this.fs.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore')
    }

    this.fs.copyTpl(this.sourceRoot() + '/README.md', context.name + '/README.md', context)
    this.fs.copyTpl(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context)
    this.fs.copyTpl(
      this.sourceRoot() + '/vsc-extension-quickstart.md',
      context.name + '/vsc-extension-quickstart.md',
      context,
    )
    this.fs.copyTpl(this.sourceRoot() + '/jsconfig.json', context.name + '/jsconfig.json', context)

    this.fs.copyTpl(this.sourceRoot() + '/extension.js', context.name + '/extension.js', context)
    this.fs.copyTpl(this.sourceRoot() + '/package.json', context.name + '/package.json', context)
    this.fs.copyTpl(
      this.sourceRoot() + '/.eslintrc.json',
      context.name + '/.eslintrc.json',
      context,
    )

    this.extensionConfig.installDependencies = true
  }

  // Installation
  install() {
    process.chdir(this.extensionConfig.name)

    if (this.extensionConfig.installDependencies) {
      this.installDependencies({
        yarn: this.extensionConfig.pkgManager === 'yarn',
        npm: this.extensionConfig.pkgManager === 'npm',
        bower: false,
      })
    }
  }

  // End
  end() {
    // Git init
    if (this.extensionConfig.gitInit) {
      this.spawnCommand('git', ['init', '--quiet'])
    }

    this.log('')
    this.log('Your extension ' + this.extensionConfig.name + ' has been created!')
    this.log('')
    this.log('To start editing with Visual Studio Code, use the following commands:')
    this.log('')
    this.log('     cd ' + this.extensionConfig.name)
    this.log('     code .')
    this.log('')
    this.log('Open vsc-extension-quickstart.md inside the new extension for further instructions')
    this.log('on how to modify, test and publish your extension.')
    this.log('')

    if (this.extensionConfig.type === 'ext-extensionpack') {
      this.log(
        chalk.yellow(
          'Please review the "extensionPack" in the "package.json" before publishing the extension pack.',
        ),
      )
      this.log('')
    }

    this.log('For more information, also visit http://code.visualstudio.com and follow us @code.')
    this.log('\r\n')
  }
}
