// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

// import { TestView } from './testView';
import { DepNodeProvider, Dependency } from './nodeDependencies';

import {
    ExtensionContext,
    FileDeleteEvent, FileRenameEvent,
    OverviewRulerLane,
    Range, Selection,
    StatusBarItem,
    TextDocument, TextDocumentChangeEvent, TextEditor, TextEditorDecorationType
} from 'vscode';
import { WebViewProvider } from './WebViewProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "importerrorlist" is now active!');

	// WebView を登録
	const webViewProvider = new WebViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider( "example.webview", webViewProvider )
		);

	const nodeDependenciesProvider = new DepNodeProvider(webViewProvider);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

	// ツリーが選択されたときを登録
	vscode.commands.registerCommand('extension.getTreeviewSelect', element => nodeDependenciesProvider.getTreeviewSelect( element ));

	// ツリーがタイトル釦を登録
	vscode.commands.registerCommand('nodeDependencies.initTreeviewEntry', () => nodeDependenciesProvider.initTreeview());

	vscode.commands.registerCommand('nodeDependencies.bookmark', (node: Dependency) => nodeDependenciesProvider.setbookmark(node));
	vscode.commands.registerCommand('nodeDependencies.bookmarkAll', (node: Dependency) => nodeDependenciesProvider.setbookmarkAll(node));

	// 初期のウェルカムウィンドウの釦
	vscode.commands.registerCommand('openUserFile', async () => {
		nodeDependenciesProvider.getjson();
	});

	// アクティブなエディターが変更されたときに発生するイベント
	vscode.window.onDidChangeActiveTextEditor(textEditor => { nodeDependenciesProvider.updateEditorDecorations(textEditor); });

	// テキストドキュメントが変更されたときに発行されるイベント
	vscode.workspace.onDidChangeTextDocument(textDocumentChangeEvent => { nodeDependenciesProvider.onEditorDocumentChanged(textDocumentChangeEvent); });

}

// this method is called when your extension is deactivated
export function deactivate() {}
