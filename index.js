const process = require('process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const moment = require('moment');
const tensify = require('tensify');
const whimsy = require('whimsy');
const args = require('args');

const createGit = require('simple-git/promise');

const $USER = os.userInfo().username;

args.option('whimsy', 'Add some whimsiness', false);

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

let promises = getGitEnabledDirectories(
  getDirectories(path.resolve(path.join(__dirname, '../../Repos')))
).map(gitDir => {
  let git = createGit(gitDir);
  git.silent(true);

  return new Promise(resolve => {
    // git
    // .fetch()
    // .then(() =>
    git
      .log({
        // '--since': 'last week',
        '--author': $USER,
        '--all': null
      })
      // )
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

// eslint-disable-next-line no-new
new Promise(resolve => {
  // banner message
  log('Today I have committed in...');
  log('------------');

  Promise.all(promises).then(commands => {
    commands.forEach(command => {
      if (command && command.result.all.length > 0) {
        // message above each repo
        log('');
        log(
          path.basename(command.gitDir) + ':'
        );

        command.result.all.forEach(lineEntry => {
          let time = moment(lineEntry.date, 'YYYY-MM-DD hh:mm:ss a');
          // let handle = lineEntry.author_name;
          // try {
          //   handle = lineEntry.author_name.match(/\((.+)\)$/)[1];
          // } catch (e) {}

          try {
            // let firstWord = lineEntry.message.split(' ')[0];
            // let isPast = tensify(firstWord).past === firstWord;
            // let isParticiple = tensify(firstWord).past_participle === firstWord;

            let prefix = '';
            // if (isPast) {
            //   prefix = 'I';
            // } else if (isParticiple) {
            //   prefix = '';
            // } else {
            //   prefix = 'I committed:';
            // }

            // message for each commit
            if(lineEntry.message && !lineEntry.message.toLowerCase().startsWith("merge"))
            log(time.calendar() + ":", lineEntry.message);
          } catch (e) {}
        });
      }
    });

    // Message when done
    scroll('.');
    resolve();
  });
});
