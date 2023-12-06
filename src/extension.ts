// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

import { TestView } from './testView';
import { DepNodeProvider, Dependency } from './nodeDependencies';
import { DepCommentProvider, Dependency2 } from './commentDependencies';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "importerrorlist" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('importerrorlist.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ImportErrorList!');
	});

	context.subscriptions.push(disposable);

	// 登録済みのビューIDと上記のデータプロバイダーを指定して、ツリーデータプロバイダーを登録します。

	const nodeDependenciesProvider2 = new DepCommentProvider();
	vscode.window.registerTreeDataProvider('commentDependencies', nodeDependenciesProvider2);

	const nodeDependenciesProvider = new DepNodeProvider(rootPath, nodeDependenciesProvider2);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

	// ツリーが選択されたときを登録
	vscode.commands.registerCommand('extension.openPackageOnNpm', element => nodeDependenciesProvider.gettest( element ));

	// ツリーがリフレッシュを登録
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('nodeDependencies.fileEntry', () => nodeDependenciesProvider.getFile());
	vscode.commands.registerCommand('nodeDependencies.editEntry', () => nodeDependenciesProvider.getEdit());

	// 初期のウェルカムウィンドウの釦
	vscode.commands.registerCommand('openUserFile', async () => {
		nodeDependenciesProvider.getjson();
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
