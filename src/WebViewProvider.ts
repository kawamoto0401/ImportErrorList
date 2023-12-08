import * as vscode from "vscode";

export class WebViewProvider implements vscode.WebviewViewProvider {

    private view?: vscode.WebviewView;

    constructor(private extensionUri: vscode.Uri) {}


  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    
    // WebViewで表示したいHTMLを設定します
    webviewView.webview.html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebView Example</title>
      </head>
      <body>
        <textarea id="comment" cols="30" rows="10" readonly>Hello</textarea>
      </body>
      </html>
    `;
  }

  public setComment(commnent : string ) {
    //     document.getElementById('story').innerHTML = 'It was a dark and stormy night…';
//    this.view?.webview.postMessage({
//         type: 'POST',
//         body: entries
//     });
    
  }
}