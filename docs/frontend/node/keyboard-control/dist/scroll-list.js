import { BaseUi } from './base-ui.js';
import chalk from 'chalk';
export class ScrollList extends BaseUi {
    constructor(list = []) {
        super();
        this.list = list;
        this.curSelectedIndex = 0;
        this.scrollTop = 0;
        this.KEYS = {
            up: () => this.cursorUp(),
            down: () => this.cursorDown()
        };
        this.render();
    }
    onKeyInput(name) {
        if (name !== 'up' && name !== 'down') {
            return;
        }
        const action = this.KEYS[name];
        action();
        this.render();
    }
    cursorUp() {
        this.moveCursor(-1);
    }
    cursorDown() {
        this.moveCursor(1);
    }
    moveCursor(index) {
        this.curSelectedIndex += index;
        if (this.curSelectedIndex < 0) {
            this.curSelectedIndex = 0;
        }
        if (this.curSelectedIndex >= this.list.length) {
            this.curSelectedIndex = this.list.length - 1;
        }
        this.fitScroll();
    }
    fitScroll() {
        const shouldScrollUp = this.curSelectedIndex < this.scrollTop;
        const shouldScrollDown = this.curSelectedIndex > this.scrollTop + this.terminalSize.rows - 1;
        if (shouldScrollUp) {
            this.scrollTop -= 1;
        }
        if (shouldScrollDown) {
            this.scrollTop += 1;
        }
        this.clear();
    }
    clear() {
        for (let row = 0; row < this.terminalSize.rows; row++) {
            this.clearLine(row);
        }
    }
    bgRow(text) {
        return chalk.bgBlue(text + ' '.repeat(this.terminalSize.columns - text.length));
    }
    render() {
        const visibleList = this.list.slice(this.scrollTop, this.scrollTop + this.terminalSize.rows);
        visibleList.forEach((item, index) => {
            const row = index;
            this.clearLine(row);
            let content = item;
            if (this.curSelectedIndex === this.scrollTop + row) {
                this.printAt(chalk.bgBlue(' '.repeat(this.terminalSize.columns)), { x: 0, y: row });
                content = this.bgRow(content);
            }
            this.printAt(content, {
                x: 0,
                y: row
            });
        });
    }
}
