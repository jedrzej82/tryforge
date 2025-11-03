/**
 * Shell Completion Script Generators
 * Generate completion scripts for different shells
 */

const { getCommands, getFlags } = require('./data');

/**
 * Generate Bash completion script
 */
function generateBashCompletion() {
  const commands = getCommands();
  const commandNames = commands.map(c => c.name).join(' ');

  return `#!/usr/bin/env bash
# TryForge Bash Completion Script
# Source this in your ~/.bashrc or ~/.bash_profile

_tryforge_completion() {
    local cur prev opts base
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    local commands="${commandNames}"

    # Handle first argument (command)
    if [ $COMP_CWORD -eq 1 ]; then
        COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
        return 0
    fi

    # Get the main command
    local cmd="\${COMP_WORDS[1]}"

    # Command-specific completions
    case "\${cmd}" in
        create)
            case "\${prev}" in
                --framework|-f)
                    COMPREPLY=( $(compgen -W "react vue angular svelte" -- \${cur}) )
                    return 0
                    ;;
                --styling|-s)
                    COMPREPLY=( $(compgen -W "css scss tailwind styled-components" -- \${cur}) )
                    return 0
                    ;;
                --database|-d)
                    COMPREPLY=( $(compgen -W "postgresql mysql mongodb sqlite" -- \${cur}) )
                    return 0
                    ;;
                --auth|-a)
                    COMPREPLY=( $(compgen -W "jwt oauth session none" -- \${cur}) )
                    return 0
                    ;;
                --graphics|-g)
                    COMPREPLY=( $(compgen -W "modern minimalist professional playful" -- \${cur}) )
                    return 0
                    ;;
                --template|-t)
                    COMPREPLY=( $(compgen -W "minimal standard full" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--framework --styling --database --auth --graphics --colors --template --features"
            ;;
        refactor)
            case "\${prev}" in
                --scope|-s)
                    COMPREPLY=( $(compgen -W "ui performance security quality all" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--scope --files"
            ;;
        analyze)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "codebase performance security ui database bundle" -- \${cur}) )
                return 0
            fi
            case "\${prev}" in
                --output|-o)
                    COMPREPLY=( $(compgen -W "console json markdown" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--output"
            ;;
        test)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "all backend frontend integration e2e" -- \${cur}) )
                return 0
            fi
            opts="--watch"
            ;;
        build)
            case "\${prev}" in
                --env|-e)
                    COMPREPLY=( $(compgen -W "development staging production" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--env"
            ;;
        deploy|deploy:status)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "vercel netlify railway render" -- \${cur}) )
                return 0
            fi
            opts="--path"
            ;;
        generate)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "component route feature test" -- \${cur}) )
                return 0
            fi
            opts="--path --file"
            ;;
        models:generate)
            case "\${prev}" in
                --orm)
                    COMPREPLY=( $(compgen -W "prisma sequelize typeorm mongoose" -- \${cur}) )
                    return 0
                    ;;
                --language)
                    COMPREPLY=( $(compgen -W "typescript javascript" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--description --requirements --path --orm --language --no-enrich --no-migrations --interactive --verbose"
            ;;
        models:detect)
            case "\${prev}" in
                --orm)
                    COMPREPLY=( $(compgen -W "prisma sequelize typeorm mongoose" -- \${cur}) )
                    return 0
                    ;;
                --language)
                    COMPREPLY=( $(compgen -W "typescript javascript" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--path --orm --language --no-migrations --verbose"
            ;;
        graphics:generate)
            case "\${prev}" in
                --type|-t)
                    COMPREPLY=( $(compgen -W "e-commerce blog dashboard saas" -- \${cur}) )
                    return 0
                    ;;
                --style)
                    COMPREPLY=( $(compgen -W "modern minimalist professional" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--description --requirements --type --name --path --output --style --colors --quality --no-enrich --no-variations --no-optimize --verbose"
            ;;
        graphics:type)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "logo favicon hero og-image" -- \${cur}) )
                return 0
            fi
            case "\${prev}" in
                --style)
                    COMPREPLY=( $(compgen -W "modern minimalist professional" -- \${cur}) )
                    return 0
                    ;;
            esac
            opts="--name --path --output --style"
            ;;
        completion)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "install uninstall generate" -- \${cur}) )
                return 0
            fi
            if [ "\${COMP_WORDS[2]}" == "generate" ] && [ $COMP_CWORD -eq 3 ]; then
                COMPREPLY=( $(compgen -W "bash zsh fish powershell" -- \${cur}) )
                return 0
            fi
            ;;
        admin)
            opts="--port"
            ;;
        models:watch|models:list|models:analyze)
            opts="--path"
            ;;
        graphics:detect|graphics:watch|graphics:list|graphics:analyze)
            opts="--path"
            ;;
        *)
            opts=""
            ;;
    esac

    # Complete flags
    if [[ \${cur} == -* ]] ; then
        COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
        return 0
    fi

    # File path completion for --path, --file, --output
    case "\${prev}" in
        --path|--file|--output|-p|-f|-o)
            COMPREPLY=( $(compgen -f -- \${cur}) )
            return 0
            ;;
    esac
}

# Register completion
complete -F _tryforge_completion tryforge

# Show installation success message
echo "✅ TryForge Bash completion installed!"
`;
}

/**
 * Generate Zsh completion script
 */
function generateZshCompletion() {
  const commands = getCommands();

  const commandDescriptions = commands
    .map(c => `    "${c.name}:${c.description}"`)
    .join('\n');

  return `#compdef tryforge
# TryForge Zsh Completion Script
# Place this in ~/.zsh/completion/_tryforge or /usr/local/share/zsh/site-functions/_tryforge

_tryforge() {
    local line state

    _arguments -C \\
        "1: :->cmds" \\
        "*::arg:->args"

    case "$state" in
        cmds)
            _values "tryforge commands" \\
${commandDescriptions}
            ;;
        args)
            case $line[1] in
                create)
                    _arguments \\
                        '(-f --framework)'{-f,--framework}'[Framework]:framework:(react vue angular svelte)' \\
                        '(-s --styling)'{-s,--styling}'[Styling]:styling:(css scss tailwind styled-components)' \\
                        '(-d --database)'{-d,--database}'[Database]:database:(postgresql mysql mongodb sqlite)' \\
                        '(-a --auth)'{-a,--auth}'[Authentication]:auth:(jwt oauth session none)' \\
                        '(-g --graphics)'{-g,--graphics}'[Graphics style]:graphics:(modern minimalist professional playful)' \\
                        '(-c --colors)'{-c,--colors}'[Color scheme]:colors:' \\
                        '(-t --template)'{-t,--template}'[Template]:template:(minimal standard full)' \\
                        '--features[Feature list]:features:'
                    ;;
                refactor)
                    _arguments \\
                        '(-s --scope)'{-s,--scope}'[Scope]:scope:(ui performance security quality all)' \\
                        '(-f --files)'{-f,--files}'[File pattern]:files:_files'
                    ;;
                analyze)
                    _arguments \\
                        '1:type:(codebase performance security ui database bundle)' \\
                        '(-o --output)'{-o,--output}'[Output format]:format:(console json markdown)'
                    ;;
                test)
                    _arguments \\
                        '1:type:(all backend frontend integration e2e)' \\
                        '(-w --watch)'{-w,--watch}'[Watch mode]'
                    ;;
                build)
                    _arguments \\
                        '(-e --env)'{-e,--env}'[Environment]:env:(development staging production)'
                    ;;
                deploy|deploy:status)
                    _arguments \\
                        '1:platform:(vercel netlify railway render)' \\
                        '(-p --path)'{-p,--path}'[Project path]:path:_files -/'
                    ;;
                generate)
                    _arguments \\
                        '1:type:(component route feature test)' \\
                        '(-p --path)'{-p,--path}'[Project path]:path:_files -/' \\
                        '(-f --file)'{-f,--file}'[File path]:file:_files'
                    ;;
                models:generate)
                    _arguments \\
                        '(-d --description)'{-d,--description}'[Application description]:description:' \\
                        '(-r --requirements)'{-r,--requirements}'[Requirements file]:file:_files' \\
                        '(-p --path)'{-p,--path}'[Project path]:path:_files -/' \\
                        '--orm[ORM type]:orm:(prisma sequelize typeorm mongoose)' \\
                        '--language[Language]:language:(typescript javascript)' \\
                        '--no-enrich[Skip AI enrichment]' \\
                        '--no-migrations[Skip migration generation]' \\
                        '(-i --interactive)'{-i,--interactive}'[Interactive mode]' \\
                        '(-v --verbose)'{-v,--verbose}'[Verbose output]'
                    ;;
                models:detect|models:watch|models:analyze)
                    _arguments \\
                        '(-p --path)'{-p,--path}'[Project path]:path:_files -/' \\
                        '--orm[ORM type]:orm:(prisma sequelize typeorm mongoose)' \\
                        '--language[Language]:language:(typescript javascript)'
                    ;;
                graphics:generate)
                    _arguments \\
                        '(-d --description)'{-d,--description}'[Application description]:description:' \\
                        '(-r --requirements)'{-r,--requirements}'[Requirements file]:file:_files' \\
                        '(-t --type)'{-t,--type}'[Application type]:type:(e-commerce blog dashboard saas)' \\
                        '(-n --name)'{-n,--name}'[Application name]:name:' \\
                        '(-p --path)'{-p,--path}'[Project path]:path:_files -/' \\
                        '(-o --output)'{-o,--output}'[Output directory]:output:_files -/' \\
                        '--style[Graphics style]:style:(modern minimalist professional)' \\
                        '--colors[Color scheme]:colors:' \\
                        '--quality[Image quality]:quality:' \\
                        '--no-enrich[Skip AI enrichment]' \\
                        '--no-variations[Skip variations]' \\
                        '--no-optimize[Skip optimization]' \\
                        '(-v --verbose)'{-v,--verbose}'[Verbose output]'
                    ;;
                graphics:type)
                    _arguments \\
                        '1:type:(logo favicon hero og-image)' \\
                        '(-n --name)'{-n,--name}'[Application name]:name:' \\
                        '(-p --path)'{-p,--path}'[Project path]:path:_files -/' \\
                        '(-o --output)'{-o,--output}'[Output directory]:output:_files -/' \\
                        '--style[Graphics style]:style:(modern minimalist professional)'
                    ;;
                completion)
                    _arguments \\
                        '1:action:(install uninstall generate)' \\
                        '2:shell:(bash zsh fish powershell)'
                    ;;
                admin)
                    _arguments \\
                        '(-p --port)'{-p,--port}'[Port]:port:'
                    ;;
            esac
            ;;
    esac
}

_tryforge "$@"

# Show installation success message
echo "✅ TryForge Zsh completion installed!"
`;
}

/**
 * Generate Fish completion script
 */
function generateFishCompletion() {
  return `# TryForge Fish Completion Script
# Place this in ~/.config/fish/completions/tryforge.fish

# Remove any existing completions
complete -c tryforge -e

# Main commands
complete -c tryforge -f -n '__fish_use_subcommand' -a 'create' -d 'Initialize a new project from description'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'refactor' -d 'Refactor and improve existing application'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'analyze' -d 'Analyze codebase'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'status' -d 'Show system and project status'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'test' -d 'Run tests'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'build' -d 'Build application for production'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'start' -d 'Start development servers'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'stop' -d 'Stop all servers'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'db:reset' -d 'Reset database'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'db:migrate' -d 'Run database migrations'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'db:seed' -d 'Seed database with sample data'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'admin' -d 'Open admin panel'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'preview' -d 'Start live preview with hot reload'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'deploy' -d 'Deploy to cloud'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'deploy:status' -d 'Check deployment status'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'generate' -d 'AI-powered code generation'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'models:generate' -d 'Generate missing database models'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'models:detect' -d 'Detect and generate missing models'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'models:watch' -d 'Watch and auto-generate models'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'models:list' -d 'List existing models'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'models:analyze' -d 'Analyze models'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'graphics:generate' -d 'Generate professional graphics'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'graphics:detect' -d 'Detect missing graphics'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'graphics:watch' -d 'Watch and auto-generate graphics'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'graphics:list' -d 'List all graphics'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'graphics:analyze' -d 'Analyze graphics'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'graphics:type' -d 'Generate specific graphic type'
complete -c tryforge -f -n '__fish_use_subcommand' -a 'completion' -d 'Manage shell auto-completion'

# create command
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l framework -s f -a 'react vue angular svelte' -d 'Framework'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l styling -s s -a 'css scss tailwind styled-components' -d 'Styling'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l database -s d -a 'postgresql mysql mongodb sqlite' -d 'Database'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l auth -s a -a 'jwt oauth session none' -d 'Authentication'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l graphics -s g -a 'modern minimalist professional playful' -d 'Graphics style'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l colors -s c -d 'Color scheme'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l template -s t -a 'minimal standard full' -d 'Template'
complete -c tryforge -f -n '__fish_seen_subcommand_from create' -l features -d 'Feature list'

# refactor command
complete -c tryforge -f -n '__fish_seen_subcommand_from refactor' -l scope -s s -a 'ui performance security quality all' -d 'Scope'
complete -c tryforge -f -n '__fish_seen_subcommand_from refactor' -l files -s f -d 'File pattern'

# analyze command
complete -c tryforge -f -n '__fish_seen_subcommand_from analyze' -a 'codebase performance security ui database bundle'
complete -c tryforge -f -n '__fish_seen_subcommand_from analyze' -l output -s o -a 'console json markdown' -d 'Output format'

# test command
complete -c tryforge -f -n '__fish_seen_subcommand_from test' -a 'all backend frontend integration e2e'
complete -c tryforge -f -n '__fish_seen_subcommand_from test' -l watch -s w -d 'Watch mode'

# build command
complete -c tryforge -f -n '__fish_seen_subcommand_from build' -l env -s e -a 'development staging production' -d 'Environment'

# deploy command
complete -c tryforge -f -n '__fish_seen_subcommand_from deploy; and not __fish_seen_subcommand_from vercel netlify railway render' -a 'vercel netlify railway render'
complete -c tryforge -f -n '__fish_seen_subcommand_from deploy' -l path -s p -d 'Project path'

# deploy:status command
complete -c tryforge -f -n '__fish_seen_subcommand_from deploy:status; and not __fish_seen_subcommand_from vercel netlify railway render' -a 'vercel netlify railway render'
complete -c tryforge -f -n '__fish_seen_subcommand_from deploy:status' -l path -s p -d 'Project path'

# generate command
complete -c tryforge -f -n '__fish_seen_subcommand_from generate; and not __fish_seen_subcommand_from component route feature test' -a 'component route feature test'
complete -c tryforge -f -n '__fish_seen_subcommand_from generate' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from generate' -l file -s f -d 'File path'

# models:generate command
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l description -s d -d 'Application description'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l requirements -s r -d 'Requirements file'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l orm -a 'prisma sequelize typeorm mongoose' -d 'ORM type'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l language -a 'typescript javascript' -d 'Language'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l no-enrich -d 'Skip AI enrichment'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l no-migrations -d 'Skip migrations'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l interactive -s i -d 'Interactive mode'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:generate' -l verbose -s v -d 'Verbose output'

# models:detect command
complete -c tryforge -f -n '__fish_seen_subcommand_from models:detect' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:detect' -l orm -a 'prisma sequelize typeorm mongoose' -d 'ORM type'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:detect' -l language -a 'typescript javascript' -d 'Language'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:detect' -l no-migrations -d 'Skip migrations'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:detect' -l verbose -s v -d 'Verbose output'

# models:watch command
complete -c tryforge -f -n '__fish_seen_subcommand_from models:watch' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:watch' -l orm -a 'prisma sequelize typeorm mongoose' -d 'ORM type'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:watch' -l language -a 'typescript javascript' -d 'Language'

# models:list command
complete -c tryforge -f -n '__fish_seen_subcommand_from models:list' -l path -s p -d 'Project path'

# models:analyze command
complete -c tryforge -f -n '__fish_seen_subcommand_from models:analyze' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from models:analyze' -l orm -a 'prisma sequelize typeorm mongoose' -d 'ORM type'

# graphics:generate command
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l description -s d -d 'Application description'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l requirements -s r -d 'Requirements file'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l type -s t -a 'e-commerce blog dashboard saas' -d 'Application type'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l name -s n -d 'Application name'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l output -s o -d 'Output directory'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l style -a 'modern minimalist professional' -d 'Graphics style'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l colors -d 'Color scheme'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l quality -d 'Image quality'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l no-enrich -d 'Skip AI enrichment'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l no-variations -d 'Skip variations'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l no-optimize -d 'Skip optimization'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:generate' -l verbose -s v -d 'Verbose output'

# graphics:detect command
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:detect' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:detect' -l output -s o -d 'Output directory'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:detect' -l quality -d 'Image quality'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:detect' -l verbose -s v -d 'Verbose output'

# graphics:watch command
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:watch' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:watch' -l output -s o -d 'Output directory'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:watch' -l quality -d 'Image quality'

# graphics:list command
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:list' -l path -s p -d 'Project path'

# graphics:analyze command
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:analyze' -l path -s p -d 'Project path'

# graphics:type command
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:type; and not __fish_seen_subcommand_from logo favicon hero og-image' -a 'logo favicon hero og-image'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:type' -l name -s n -d 'Application name'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:type' -l path -s p -d 'Project path'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:type' -l output -s o -d 'Output directory'
complete -c tryforge -f -n '__fish_seen_subcommand_from graphics:type' -l style -a 'modern minimalist professional' -d 'Graphics style'

# admin command
complete -c tryforge -f -n '__fish_seen_subcommand_from admin' -l port -s p -d 'Port'

# completion command
complete -c tryforge -f -n '__fish_seen_subcommand_from completion; and not __fish_seen_subcommand_from install uninstall generate' -a 'install uninstall generate'
complete -c tryforge -f -n '__fish_seen_subcommand_from completion; and __fish_seen_subcommand_from generate' -a 'bash zsh fish powershell'

# Show installation success message
echo "✅ TryForge Fish completion installed!"
`;
}

/**
 * Generate PowerShell completion script
 */
function generatePowerShellCompletion() {
  return `# TryForge PowerShell Completion Script
# Add this to your PowerShell profile: $PROFILE

Register-ArgumentCompleter -Native -CommandName tryforge -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)

    $commands = @{
        'create' = 'Initialize a new project from description'
        'refactor' = 'Refactor and improve existing application'
        'analyze' = 'Analyze codebase'
        'status' = 'Show system and project status'
        'test' = 'Run tests'
        'build' = 'Build application for production'
        'start' = 'Start development servers'
        'stop' = 'Stop all servers'
        'db:reset' = 'Reset database'
        'db:migrate' = 'Run database migrations'
        'db:seed' = 'Seed database with sample data'
        'admin' = 'Open admin panel'
        'preview' = 'Start live preview'
        'deploy' = 'Deploy to cloud'
        'deploy:status' = 'Check deployment status'
        'generate' = 'AI-powered code generation'
        'models:generate' = 'Generate missing database models'
        'models:detect' = 'Detect and generate missing models'
        'models:watch' = 'Watch and auto-generate models'
        'models:list' = 'List existing models'
        'models:analyze' = 'Analyze models'
        'graphics:generate' = 'Generate professional graphics'
        'graphics:detect' = 'Detect missing graphics'
        'graphics:watch' = 'Watch and auto-generate graphics'
        'graphics:list' = 'List all graphics'
        'graphics:analyze' = 'Analyze graphics'
        'graphics:type' = 'Generate specific graphic type'
        'completion' = 'Manage shell auto-completion'
    }

    $commandLine = $commandAst.ToString()
    $words = $commandLine -split '\\s+'

    # Main command completion
    if ($words.Count -eq 2) {
        $commands.Keys | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $commands[$_])
        }
        return
    }

    $command = $words[1]

    # Command-specific completions
    switch ($command) {
        'create' {
            $options = @{
                '--framework' = @('react', 'vue', 'angular', 'svelte')
                '--styling' = @('css', 'scss', 'tailwind', 'styled-components')
                '--database' = @('postgresql', 'mysql', 'mongodb', 'sqlite')
                '--auth' = @('jwt', 'oauth', 'session', 'none')
                '--graphics' = @('modern', 'minimalist', 'professional', 'playful')
                '--template' = @('minimal', 'standard', 'full')
            }
        }
        'analyze' {
            if ($words.Count -eq 3) {
                @('codebase', 'performance', 'security', 'ui', 'database', 'bundle') |
                    Where-Object { $_ -like "$wordToComplete*" } |
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
                return
            }
            $options = @{
                '--output' = @('console', 'json', 'markdown')
            }
        }
        'deploy' {
            if ($words.Count -eq 3) {
                @('vercel', 'netlify', 'railway', 'render') |
                    Where-Object { $_ -like "$wordToComplete*" } |
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
                return
            }
        }
        'generate' {
            if ($words.Count -eq 3) {
                @('component', 'route', 'feature', 'test') |
                    Where-Object { $_ -like "$wordToComplete*" } |
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
                return
            }
        }
        'graphics:type' {
            if ($words.Count -eq 3) {
                @('logo', 'favicon', 'hero', 'og-image') |
                    Where-Object { $_ -like "$wordToComplete*" } |
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
                return
            }
        }
        'completion' {
            if ($words.Count -eq 3) {
                @('install', 'uninstall', 'generate') |
                    Where-Object { $_ -like "$wordToComplete*" } |
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
                return
            }
            if ($words[2] -eq 'generate' -and $words.Count -eq 4) {
                @('bash', 'zsh', 'fish', 'powershell') |
                    Where-Object { $_ -like "$wordToComplete*" } |
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
                return
            }
        }
    }

    # Flag completion
    if ($wordToComplete -like '-*') {
        $flags = @('--framework', '--styling', '--database', '--auth', '--graphics', '--template',
                   '--path', '--output', '--verbose', '--help', '--version')
        $flags | Where-Object { $_ -like "$wordToComplete*" } |
            ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_) }
    }
}

Write-Host "✅ TryForge PowerShell completion installed!" -ForegroundColor Green
`;
}

/**
 * Generators object
 */
const generators = {
  bash: generateBashCompletion,
  zsh: generateZshCompletion,
  fish: generateFishCompletion,
  powershell: generatePowerShellCompletion,
};

module.exports = {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  generatePowerShellCompletion,
  generators,
};
