const process = require('process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const tensify = require('tensify');
const whimsy = require('whimsy');
const args = require('args');
const micromustache = require('micromustache');

const moment = require('moment');
// require('moment/locale/sv');
// moment.locale('sv');

const createGit = require('simple-git/promise');

args.option('hide-merges', 'Do not show commits starting with [Mm]erge', true);
args.option(
  'fetch',
  'Should we fetch on all repos before doing git log?',
  true
);
args.option(
  'commit-text',
  'How to display the commit text line',
  '{{relativeTime}}: {{message}}'
);
args.option('since', 'How far back to display commits.', '1 month ago');
args.option('author', 'Author(s) to filter by.', os.userInfo().username);
args.option('show-all-authors', 'Show all authors', false);
args.option(
  'clear-screen',
  'Clear screen instead of scrolling down (good when you get slowness)',
  false
);
args.option('scroll-text', 'Text to output when scrolling the screen', '.');
args.option('scroll-amount', 'Lines to scroll', 50);
args.option(
  'banner-text',
  "Text to display, eg: 'I have committed in...'",
  'I have committed in...'
);
args.option(
  'banner-separator-text',
  "Text to display after the banner text, eg. '--------'",
  '------------'
);

const flags = args.parse(process.argv);

function getDirectories(searchPath) {
  return fs
    .readdirSync(searchPath)
    .filter(function(file) {
      return fs.statSync(searchPath + '/' + file).isDirectory();
    })
    .map(directoryName => {
      return path.resolve(path.join(searchPath, directoryName));
    });
}

function getGitEnabledDirectories(directories) {
  return directories.filter(dir => fs.existsSync(path.join(dir, '.git')));
}

let gitLogOptions = {
  '--all': null
};

if (flags.author && !flags.showAllAuthors) {
  gitLogOptions['--author'] = flags.author;
}

if (flags.since) {
  gitLogOptions['--since'] = flags.since;
}

let promises = getGitEnabledDirectories(
  getDirectories(path.resolve(path.join(__dirname, '../../Repos')))
).map(gitDir => {
  let git = createGit(gitDir);
  git.silent(true);

  return new Promise(resolve => {
    let gitLog = () =>
      git
        .log(gitLogOptions)
        .then(result => {
          return {
            result,
            gitDir
          };
        })
        .then(r => {
          resolve(r);
        })
        .catch(() => {
          resolve();
        });

    // either fetch first, or do git-log immediately
    flags.fetch ? git.fetch().then(gitLog) : gitLog();
  });
});

let newlines = 0;

function log() {
  // count the newlines in the message, plus the console.log newline
  newlines +=
    1 +
    Array.from(arguments)
      .join('')
      .split('\n').length -
    1;

  console.log.apply(this, arguments);

  // if (flags.whimsy) {
  //   console.log.call(this, whimsy(Array.from(arguments).join(' ')));
  // } else {
  //   console.log.call(
  //     this,
  //     Array.from(arguments)
  //       .join(' ')
  //       .replace(/\s*\{\{\s.+\s\}\}\s*/g, ' ')
  //   );
  // }
}

function scroll(newlineSymbol = '.', padAmount = 7, marginAmount = 0) {
  let times = Math.max(0, padAmount - newlines) + marginAmount;
  newlines = 0;

  while (times > 0) {
    console.log(newlineSymbol);
    times--;
  }
}

function clearScreen() {
  // ANSI special character for VT100 terminals (aka phosphor screensaver)
  process.stdout.write('\x1Bc');
}

// eslint-disable-next-line no-new
new Promise(resolve => {
  // banner message
  log(flags.bannerText);
  log(flags.bannerSeparatorText);

  Promise.all(promises).then(commands => {
    commands.forEach(command => {
      if (command && command.result.all.length > 0) {
        // message above each repo
        log('');
        log(path.basename(command.gitDir) + ':');

        let commits = command.result.all.filter(
          commit =>
            !flags.hideMerges ||
            (commit.message &&
              !commit.message.toLowerCase().startsWith('merge'))
        );

        commits.forEach(lineEntry => {
          let time = moment(lineEntry.date, 'YYYY-MM-DD hh:mm:ss a');

          try {
            let combinedEntry = Object.assign({}, lineEntry, {
              relativeTime: time.calendar()
            });

            log(
              whimsy(
                micromustache
                  .render(flags.commitText, combinedEntry)
                  // restore whimsy brackets
                  .replace('[[', '{{')
                  .replace(']]', '}}')
              )
            );
          } catch (e) {}
        });
      }
    });

    // Message when done
    if (flags.clearScreen) {
      clearScreen();
    } else {
      scroll(flags.scrollText, 0, flags.scrollAmount);
    }
    // log('\x1B[2J')
    resolve();
  });
});
