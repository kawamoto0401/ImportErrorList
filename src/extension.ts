// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

// import { TestView } from './testView';
import { DepNodeProvider, Dependency } from './nodeDependencies';
import { DepCommentProvider, Dependency2 } from './commentDependencies';
import { WebViewProvider } from './WebViewProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
	// 	? vscode.workspace.workspaceFolders[0].uri.fsPath : "Test";
	// 	// ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "importerrorlist" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('importerrorlist.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from ImportErrorList!');
	// });

	// context.subscriptions.push(disposable);

	//
	const commnetDependenciesProvider = new DepCommentProvider();
	vscode.window.registerTreeDataProvider('commentDependencies', commnetDependenciesProvider);

	const nodeDependenciesProvider = new DepNodeProvider(commnetDependenciesProvider);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

	// ツリーが選択されたときを登録
	vscode.commands.registerCommand('extension.getTreeviewSelect', element => nodeDependenciesProvider.getTreeviewSelect( element ));

	// ツリーがリフレッシュを登録
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('nodeDependencies.initTreeviewEntry', () => nodeDependenciesProvider.initTreeview());
	vscode.commands.registerCommand('nodeDependencies.searchTreeviewEntry', () => nodeDependenciesProvider.searchTreeview());

	// 初期のウェルカムウィンドウの釦
	vscode.commands.registerCommand('openUserFile', async () => {
		nodeDependenciesProvider.getjson();
	});


	// WebView を登録
	context.subscriptions.push(
	vscode.window.registerWebviewViewProvider(
		"example.webview",
		new WebViewProvider(context.extensionUri)
	)
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
