`git log` output for all branches that serves any terminal-looking screensaver in your OS.

Tested with phosphor, part of x-screensaver-data-extras

## Installation
* `npm install -g git-screensaver`
* `sudo apt-get install xscreensaver xscreensaver-gl xscreensaver-gl-extra xscreensaver-data-extra`
* Start screensaver in ubuntu.
* Set "Single screensaver", select "phosphor" in the list of screensavers.
* Go to the Advanced tab. Inside Text Manipulation, set to "Program".
* Set textbox to `git-screensaver --dir /home/user/path/to/repos`

## Example usage
* `git-screensaver --limit 10 --clear-screen --dir /home/user/Repos --recurse-level-count 2`
* `git-screensaver --since midnight --commit-text "{{relativeTime}} --- {{message}}" --dir /home/user/Repos --recurse-level-count 2`

## FAQ
### Slow screensaver
Add `--clear-screen` to work with slow outputs by clearing the screen instead of scrolling the text.

### Can't use node
If you're using nvm, make sure your nvm command is present in `~/.profile` and not only `~/.bashrc`.

### Not getting any output
Set `--author` to your git author name (partial match). By default, your $USER variable is used.

### See more authors than yourself
Add `--all-authors`

### Other questions
Run `git-screensaver --help` for a list of all options.

## How to install x-screensaver on Mac OSX
http://macappstore.org/xscreensaver/

## How do I use this on Windows?
No idea. You will need a screensaver that can output text somehow.
