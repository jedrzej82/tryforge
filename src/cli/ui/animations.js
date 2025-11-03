/**
 * TryForge CLI - Animation Frames and Sequences
 *
 * Provides animation frames for various CLI effects
 */

const { colors, icons } = require('./themes');

/**
 * Success animation frames
 */
const successFrames = [
  '   ',
  '.  ',
  '.. ',
  '...',
  '✓..',
  '✓✓.',
  '✓✓✓',
  colors.success('✓✓✓'),
  colors.success.bold('✓✓✓')
];

/**
 * Error animation frames
 */
const errorFrames = [
  '   ',
  'x  ',
  'xx ',
  'xxx',
  colors.error('xxx'),
  colors.error.bold('xxx')
];

/**
 * Celebration animation frames
 */
const celebrationFrames = [
  '       ',
  '   .   ',
  '  .·.  ',
  ' .·*·. ',
  '.·*★*·.',
  '·*★✨★*·',
  '*★✨🎉✨★*',
  colors.highlight('★✨🎉✨★'),
  colors.success.bold('  🎉  ')
];

/**
 * Loading dots animation
 */
const loadingDotsFrames = [
  '.  ',
  '.. ',
  '...',
  ' ..',
  '  .',
  '   '
];

/**
 * Bouncing ball animation
 */
const bouncingBallFrames = [
  '(●    )',
  '( ●   )',
  '(  ●  )',
  '(   ● )',
  '(    ●)',
  '(   ● )',
  '(  ●  )',
  '( ●   )'
];

/**
 * Progress arrow animation
 */
const progressArrowFrames = [
  '>    ',
  '->   ',
  '-->  ',
  ' --> ',
  '  -->',
  '   ->',
  '    >',
  '     '
];

/**
 * Pulse animation
 */
const pulseFrames = [
  '◯',
  '◎',
  '●',
  '◎',
  '◯'
];

/**
 * Hourglass animation
 */
const hourglassFrames = [
  '⏳',
  '⏳',
  '⌛',
  '⌛'
];

/**
 * Rocket launch animation
 */
const rocketFrames = [
  '       ',
  '   🚀  ',
  '  🚀   ',
  ' 🚀    ',
  '🚀     ',
  '      🚀',
  '       '
];

/**
 * Build/compile animation
 */
const buildFrames = [
  '[    ]',
  '[=   ]',
  '[==  ]',
  '[=== ]',
  '[====]',
  colors.success('[====]')
];

/**
 * Download animation
 */
const downloadFrames = [
  '↓    ',
  ' ↓   ',
  '  ↓  ',
  '   ↓ ',
  '    ↓',
  '     ↓'
];

/**
 * Upload animation
 */
const uploadFrames = [
  '↑    ',
  ' ↑   ',
  '  ↑  ',
  '   ↑ ',
  '    ↑',
  '     ↑'
];

/**
 * Thinking animation
 */
const thinkingFrames = [
  '💭   ',
  ' 💭  ',
  '  💭 ',
  '   💭',
  '  💭 ',
  ' 💭  '
];

/**
 * Code typing animation
 */
const codeTypingFrames = [
  '</>   ',
  '</> . ',
  '</> ..',
  '</> ...',
  colors.primary('</> ...')
];

/**
 * Checkmark reveal animation
 */
const checkmarkRevealFrames = [
  '○',
  '◔',
  '◑',
  '◕',
  '●',
  colors.success('✓')
];

/**
 * Cross reveal animation
 */
const crossRevealFrames = [
  '○',
  '◔',
  '◑',
  '◕',
  '●',
  colors.error('✗')
];

/**
 * Fire animation
 */
const fireFrames = [
  '🔥   ',
  ' 🔥  ',
  '  🔥 ',
  '   🔥',
  '  🔥 ',
  ' 🔥  '
];

/**
 * Sparkle animation
 */
const sparkleFrames = [
  '·    ',
  ' ·   ',
  '  ✦  ',
  '   ✧ ',
  '    ✨',
  '   ✨ ',
  '  ✨  ',
  ' ✨   ',
  '✨    '
];

/**
 * Install packages animation
 */
const installFrames = [
  '📦 [    ] Installing...',
  '📦 [=   ] Installing...',
  '📦 [==  ] Installing...',
  '📦 [=== ] Installing...',
  '📦 [====] Installing...',
  colors.success('📦 [====] Installed!')
];

/**
 * Generate animation with custom frames
 */
function createAnimation(frames, options = {}) {
  const {
    interval = 80,
    repeat = true,
    onComplete = null
  } = options;

  let currentFrame = 0;
  let intervalId = null;
  let isRunning = false;

  return {
    start(callback) {
      if (isRunning) return;

      isRunning = true;
      intervalId = setInterval(() => {
        if (callback) {
          callback(frames[currentFrame]);
        }

        currentFrame++;

        if (currentFrame >= frames.length) {
          if (repeat) {
            currentFrame = 0;
          } else {
            this.stop();
            if (onComplete) onComplete();
          }
        }
      }, interval);
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      isRunning = false;
    },

    reset() {
      currentFrame = 0;
    },

    getCurrentFrame() {
      return frames[currentFrame];
    },

    isRunning() {
      return isRunning;
    }
  };
}

/**
 * Create a success animation sequence
 */
function createSuccessAnimation(message = 'Success!') {
  return {
    frames: successFrames,
    finalMessage: colors.success(`${icons.success} ${message}`)
  };
}

/**
 * Create an error animation sequence
 */
function createErrorAnimation(message = 'Error!') {
  return {
    frames: errorFrames,
    finalMessage: colors.error(`${icons.error} ${message}`)
  };
}

/**
 * Create a celebration animation
 */
function createCelebration(message = 'Congratulations!') {
  return {
    frames: celebrationFrames,
    finalMessage: colors.success.bold(`${icons.celebration} ${message}`)
  };
}

/**
 * ASCII art for milestones
 */
const asciiArt = {
  success: `
${colors.success('    ✓    ')}
${colors.success('  ✓   ✓  ')}
${colors.success('✓   ✓   ✓')}
  `,

  trophy: `
${colors.highlight('   ___')}
${colors.highlight('  |___|')}
${colors.highlight('   |_|')}
${colors.highlight('   | |')}
  `,

  rocket: `
${colors.primary('    /\\')}
${colors.primary('   /  \\')}
${colors.primary('  |    |')}
${colors.primary('  |    |')}
${colors.primary(' /|    |\\')}
${colors.primary('/_|____|_\\')}
  `,

  star: `
${colors.highlight('    *')}
${colors.highlight('   ***')}
${colors.highlight('  *****')}
${colors.highlight('   ***')}
${colors.highlight('    *')}
  `,

  checkmark: `
${colors.success('       ✓')}
${colors.success('      ✓')}
${colors.success('     ✓')}
${colors.success('✓   ✓')}
${colors.success(' ✓ ✓')}
${colors.success('  ✓')}
  `,

  celebration: `
${colors.highlight('  ✨ 🎉 ✨')}
${colors.success('   SUCCESS!')}
${colors.highlight('  ✨ 🎉 ✨')}
  `
};

/**
 * Create a loading animation with custom text
 */
function createLoadingAnimation(text, style = 'dots') {
  const frameStyles = {
    dots: loadingDotsFrames,
    ball: bouncingBallFrames,
    arrow: progressArrowFrames,
    pulse: pulseFrames,
    hourglass: hourglassFrames
  };

  const frames = frameStyles[style] || frameStyles.dots;

  return createAnimation(frames.map(frame => `${frame} ${text}`), {
    interval: 100,
    repeat: true
  });
}

/**
 * Get animation by name
 */
function getAnimation(name) {
  const animations = {
    success: successFrames,
    error: errorFrames,
    celebration: celebrationFrames,
    loadingDots: loadingDotsFrames,
    bouncingBall: bouncingBallFrames,
    progressArrow: progressArrowFrames,
    pulse: pulseFrames,
    hourglass: hourglassFrames,
    rocket: rocketFrames,
    build: buildFrames,
    download: downloadFrames,
    upload: uploadFrames,
    thinking: thinkingFrames,
    codeTyping: codeTypingFrames,
    checkmarkReveal: checkmarkRevealFrames,
    crossReveal: crossRevealFrames,
    fire: fireFrames,
    sparkle: sparkleFrames,
    install: installFrames
  };

  return animations[name] || animations.loadingDots;
}

module.exports = {
  // Frame arrays
  successFrames,
  errorFrames,
  celebrationFrames,
  loadingDotsFrames,
  bouncingBallFrames,
  progressArrowFrames,
  pulseFrames,
  hourglassFrames,
  rocketFrames,
  buildFrames,
  downloadFrames,
  uploadFrames,
  thinkingFrames,
  codeTypingFrames,
  checkmarkRevealFrames,
  crossRevealFrames,
  fireFrames,
  sparkleFrames,
  installFrames,

  // ASCII art
  asciiArt,

  // Factory functions
  createAnimation,
  createSuccessAnimation,
  createErrorAnimation,
  createCelebration,
  createLoadingAnimation,
  getAnimation
};
