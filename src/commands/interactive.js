/**
 * Interactive Command - Conversational project creation
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const ConversationalAI = require('../core/conversational-ai');
const TryForge = require('../index');

async function interactive(projectName, options) {
  const ai = new ConversationalAI();
  const tryforge = new TryForge();

  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║   TryForge Interactive Mode  🤖       ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝\n'));

  // Start conversation
  const initial = await ai.startConversation(projectName);
  console.log(chalk.green(initial.message));

  // Ask questions
  const answers = {};
  
  for (const question of initial.questions || []) {
    let answer;
    
    if (question.type === 'text') {
      const response = await inquirer.prompt([{
        type: 'input',
        name: 'answer',
        message: question.text,
        default: question.default
      }]);
      answer = response.answer;
      
      // If this is initial description, analyze it
      if (question.id === 'initial_description') {
        const analysis = await ai.analyzePrompt(answer);
        console.log(chalk.yellow(`\n✨ Rozumiem! Chcesz stworzyć: ${analysis.projectType}\n`));
        
        // Generate more questions based on analysis
        const moreQuestions = ai.generateQuestions(analysis);
        
        // Ask follow-up questions
        for (const q of moreQuestions) {
          if (q.type === 'choice') {
            const resp = await inquirer.prompt([{
              type: 'list',
              name: 'answer',
              message: q.text,
              choices: q.options.map(opt => ({
                name: opt.label,
                value: opt.value
              })),
              default: q.default
            }]);
            answers[q.id] = resp.answer;
          } else if (q.type === 'multichoice') {
            const resp = await inquirer.prompt([{
              type: 'checkbox',
              name: 'answer',
              message: q.text,
              choices: q.options.map(opt => ({
                name: opt.label,
                value: opt.value,
                checked: false
              }))
            }]);
            answers[q.id] = resp.answer;
          }
        }
      }
    } else if (question.type === 'choice') {
      const response = await inquirer.prompt([{
        type: 'list',
        name: 'answer',
        message: question.text,
        choices: question.options.map(opt => ({
          name: opt.label,
          value: opt.value
        })),
        default: question.default
      }]);
      answers[question.id] = response.answer;
    } else if (question.type === 'multichoice') {
      const response = await inquirer.prompt([{
        type: 'checkbox',
        name: 'answer',
        message: question.text,
        choices: question.options.map(opt => ({
          name: opt.label,
          value: opt.value,
          checked: false
        }))
      }]);
      answers[question.id] = response.answer;
    }
  }

  // Process answers
  const result = await ai.processAnswers(answers);
  
  // Show summary
  console.log(chalk.green(result.message));

  // Confirm
  const confirm = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: 'Rozpocząć generowanie projektu?',
    default: true
  }]);

  if (!confirm.proceed) {
    console.log(chalk.yellow('\n❌ Anulowano. Możesz rozpocząć ponownie komendą: tryforge create\n'));
    return;
  }

  // Get project name if not provided
  let finalProjectName = projectName;
  if (!finalProjectName) {
    const nameResponse = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Nazwa projektu:',
      default: 'my-project',
      validate: (input) => {
        if (/^[a-z0-9-]+$/.test(input)) {
          return true;
        }
        return 'Nazwa może zawierać tylko małe litery, cyfry i myślniki';
      }
    }]);
    finalProjectName = nameResponse.name;
  }

  // Generate project
  const spinner = ora('Generowanie projektu...').start();

  try {
    const project = await tryforge.createProject(finalProjectName, {
      template: result.template.name,
      ...result.projectContext
    });

    spinner.succeed(chalk.green('✅ Projekt wygenerowany pomyślnie!'));

    console.log(chalk.cyan('\n╔═══════════════════════════════════════╗'));
    console.log(chalk.cyan('║   Projekt gotowy! 🎉                  ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════╝\n'));

    console.log(chalk.white('📂 Lokalizacja:'), chalk.yellow(`./${finalProjectName}/`));
    console.log(chalk.white('\n🚀 Następne kroki:\n'));
    console.log(chalk.gray('   1. ') + chalk.white(`cd ${finalProjectName}`));
    console.log(chalk.gray('   2. ') + chalk.white('npm install'));
    console.log(chalk.gray('   3. ') + chalk.white('npm start'));
    console.log(chalk.white('\n📚 Dokumentacja:'), chalk.yellow(`${finalProjectName}/README.md`));
    console.log(chalk.white('🎨 Visual Editor:'), chalk.yellow(`tryforge editor ./${finalProjectName}`));
    console.log(chalk.white('🔄 Workflow Builder:'), chalk.yellow('tryforge workflow\n'));

  } catch (error) {
    spinner.fail(chalk.red('❌ Błąd podczas generowania projektu'));
    console.error(chalk.red('\nSzczegóły błędu:'), error.message);
    console.log(chalk.yellow('\nSpróbuj ponownie lub zgłoś problem na GitHub'));
  }
}

module.exports = interactive;
