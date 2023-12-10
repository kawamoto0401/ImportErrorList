import * as vscode from "vscode";

export class WebViewProvider implements vscode.WebviewViewProvider {

  private view?: vscode.WebviewView;

  constructor(private extensionUri: vscode.Uri) { }

  //
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.title = 'Comment';
    webviewView.webview.html = this.getWebviewContent('-', '-');
  }

  public getWebviewContent(description : string, commnent: string) {
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebView Example</title>
      </head>
      <body>
      <label fot="description">${description}</label>
      <br>
      <label fot="commnent">${commnent}</label>
      </body>
      </html>
    `;
  }

  public chgComment(description : string, commnent: string) {

    if (this.view) {
      // 改行コードを判定し、HTMLの<BR>に変換する
      const newComment = commnent.replace(/\r?\n/g, '<br>');

      this.view.webview.html = this.getWebviewContent(description, newComment);
    }
  }
}