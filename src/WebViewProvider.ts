import * as vscode from "vscode";

export class WebViewProvider implements vscode.WebviewViewProvider {

  private view?: vscode.WebviewView;

  constructor(private extensionUri: vscode.Uri) { }

  // WebViewView
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.title = 'Comment(コメント)';
    webviewView.webview.html = this.getWebviewContent('-', '-', '-');
  }

  public getWebviewContent(subject: string, description : string, commnent: string) {
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebView Example</title>
      </head>
      <body>
      <label fot="description">subject : ${subject}</label>
      <br>
      <body>
      <label fot="description">description : ${description}</label>
      <br>
      <label fot="commnent">commnent : ${commnent}</label>
      </body>
      </html>
    `;
  }

  public chgComment(subject: string, description: string, commnent: string) {

    if (this.view) {

      // XSS対策で、HTML特殊文字をエスケープさせて対策
      const subjectTmp = this.escapeHTML(subject);
      const descriptionTmp = this.escapeHTML(description);
      const commnentTmp = this.escapeHTML(commnent);

      // 改行コードを判定し、HTMLの<BR>に変換する
      const commnentTmp2 = commnentTmp.replace(/\r?\n/g, '<br>');

      this.view.webview.html = this.getWebviewContent(subjectTmp, descriptionTmp, commnentTmp2);
    }
  }

  // HTML特殊文字をエスケープさせて対策
  public escapeHTML(str: string) {
    return str.replace(/&/g, '&lt;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, "&#x27;");
  }
}



