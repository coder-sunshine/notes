import ansiEscapes from 'ansi-escapes';
import { Prompt } from './Prompt.js';
import chalk from 'chalk';
export class SelectPrompt extends Prompt {
    constructor(options) {
        super();
        this.options = options;
        this.out = process.stdout;
        this.index = 0;
        this.value = options.choices[0];
    }
    onKeyInput(str, key) {
        // 不是上下键
        if (!['up', 'down'].includes(key.name)) {
            return;
        }
        // 下键
        if (key.name === 'down') {
            this.index += 1; // 下移一行
            if (this.index > this.options.choices.length - 1) {
                this.index = 0; // 循环到顶部
            }
        }
        // 上键
        if (key.name === 'up') {
            this.index -= 1;
            if (this.index < 0) {
                this.index = this.options.choices.length - 1; // 循环到底部
            }
        }
        this.value = this.options.choices[this.index];
        this.render();
    }
    render() {
        this.out.write(ansiEscapes.eraseLine);
        this.out.write(ansiEscapes.cursorSavePosition);
        this.out.write(ansiEscapes.cursorTo(0));
        this.out.write([chalk.bold(this.options.message), chalk.gray('›'), ' ', chalk.blue(this.value)].join(''));
        for (let i = 0; i < this.options.choices.length; i++) {
            const choice = this.options.choices[i];
            this.out.write(ansiEscapes.cursorDown(1));
            this.out.write(ansiEscapes.cursorTo(2));
            if (this.value === choice) {
                this.out.write(chalk.blue('❯') + ' ' + choice);
            }
            else {
                this.out.write('  ' + choice);
            }
        }
        this.out.write(ansiEscapes.cursorRestorePosition);
    }
}
