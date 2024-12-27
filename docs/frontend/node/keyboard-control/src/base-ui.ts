import ansiEscapes from 'ansi-escapes'

export interface Position {
  x: number
  y: number
}

export abstract class BaseUi {
  private readonly stdout: NodeJS.WriteStream = process.stdout

  protected print(text: string) {
    process.stdout.write(text)
  }

  protected setCursorAt({ x, y }: Position) {
    this.print(ansiEscapes.cursorTo(x, y))
  }

  protected printAt(message: string, position: Position) {
    this.setCursorAt(position)
    this.print(message)
  }

  protected clearLine(row: number) {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row })
  }

  get terminalSize(): { columns: number; rows: number } {
    return {
      columns: this.stdout.columns,
      rows: this.stdout.rows
    }
  }

  abstract render(): void
}
