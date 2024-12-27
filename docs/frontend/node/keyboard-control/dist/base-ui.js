import ansiEscapes from 'ansi-escapes';
export class BaseUi {
    constructor() {
        this.stdout = process.stdout;
    }
    print(text) {
        process.stdout.write(text);
    }
    setCursorAt({ x, y }) {
        this.print(ansiEscapes.cursorTo(x, y));
    }
    printAt(message, position) {
        this.setCursorAt(position);
        this.print(message);
    }
    clearLine(row) {
        this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
    }
    get terminalSize() {
        return {
            columns: this.stdout.columns,
            rows: this.stdout.rows
        };
    }
}
