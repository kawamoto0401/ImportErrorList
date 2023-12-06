import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class DepCommentProvider implements vscode.TreeDataProvider<Dependency2> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency2 | undefined | void> = new vscode.EventEmitter<Dependency2 | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency2 | undefined | void> = this._onDidChangeTreeData.event;

	dependency : Dependency2[];
	comment : string;

	constructor() {
		this.dependency = [];
		this.comment = "";
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Dependency2): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Dependency2): Thenable<Dependency2[]> {
		return Promise.resolve(
			[new Dependency2(this.comment, "", vscode.TreeItemCollapsibleState.None)]);
	}

	setComment(comment : string ) {
		this.dependency = [];
				
		this.comment = comment;

		this.refresh();	
	}
}

export class Dependency2 extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'Dependency2.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'Dependency2.svg')
	};

	contextValue = 'Dependency2';
}
