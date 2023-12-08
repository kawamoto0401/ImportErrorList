import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { DepCommentProvider, Dependency2 } from './commentDependencies';


class UserData {
	constructor(
		/// 
		public filename: string,
		public subject : string,
		public description : string,
		public row : number, 
		public column: number, 
		public level : number,
		public comment : string,
		public tooltip: string,
		public tags : Array<string>,
		public id : string
		) {
	}

	isSeachWord( str : string ) {
		if(( 0 <= this.filename.indexOf(str) ) || ( 0 <= this.subject.indexOf(str) ) || ( 0 <= this.description.indexOf(str) )) {
			return true;
		}

		if( this.tags ){
			for (let cnt1 = 0; cnt1 < this.tags.length; cnt1++) {
				const element = this.tags[cnt1];

				if( 0 <= element.indexOf(str )) {
					return true;
				}				
			}
		}

		return false;
	}

}

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;

	// dependency : Dependency[];
	userDataList: Array<UserData>;
	// searchWord : string;
	id : number;

	constructor(private commentDependencies: DepCommentProvider ) {
		// this.dependency = [];
		this.userDataList = [];
		// this.searchWord = "";
		this.id = 1000;
	}

	//
	refresh(): void {
		vscode.window.showInformationMessage('refresh:');
		this._onDidChangeTreeData.fire();
	}

	// 初期化
	initTreeview(): void {
		vscode.window.showInformationMessage('initTreeview:');
		// this.dependency.length = 0;
		this.userDataList.length = 0;
		this.refresh();
	}

	searchTreeview(): void {
		vscode.window.showInformationMessage('searchTreeview:');

		const name = vscode.window.showInputBox({ title : 'Search Word'});
		if( !name ) {
			return;
		}
	
		name.then( name => {

			// this.searchWord = "";

			if (name !== undefined) {
				// this.searchWord = name;

				if( 0 > name.length ) {
					vscode.window.showInformationMessage('Non Search:');

				}else {
					vscode.window.showInformationMessage(name);


					const max = this.userDataList.length;
					let index = 0;

					for (let cnt1 = 0; cnt1 < max; cnt1++) {
						const element = this.userDataList[index];
						
						//
						if( !this.userDataList[index].isSeachWord(name)) {
							this.userDataList.splice( index, 1 );
						}else {
							index++;
						}
					}

				}
			}	
			this.refresh();
		});
	}

	//
	getTreeItem(element: Dependency): vscode.TreeItem {
		vscode.window.showInformationMessage('element:' + element.label);
		return element;
	}

	//
	getChildren(element?: Dependency): Thenable<Dependency[]> {
		// if (!this.workspaceRoot) {
		// 	vscode.window.showInformationMessage('No dependency in empty workspace');
		// 	return Promise.resolve([]);
		// }

		if (element) {
			// 子ツリーの表示
			if( "Subject" === element.type ) {
				vscode.window.showInformationMessage('Subject');

				var nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const element = this.userDataList[index];

					if( nodeList.indexOf(element.subject) > -1 ) {
						continue;
					}

					nodeList.push( element.subject );
				}

				var data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];

					data.push(new Dependency(element, "", "SubjectSub", "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ( "File" === element.type ) {
				vscode.window.showInformationMessage('File');

				var nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const element = this.userDataList[index];

					if( nodeList.indexOf(element.filename) > -1 ) {
						continue;
					}

					nodeList.push( element.filename );
				}

				var data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];

					data.push(new Dependency(element, "", "FileSub", "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ("Tag" === element.type) {
				vscode.window.showInformationMessage('Tab');

				return Promise.resolve([]);

			} else if ("SubjectSub" === element.type) {
				vscode.window.showInformationMessage('Subject : ' + element.label );

				var nodeList: Array<string> = [];
				var nodeIDList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];

					if( element.label !== data.subject ) {
						continue;
					}

					nodeList.push( data.filename );
					nodeIDList.push( String(data.id) );
				}

				var data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];
					const id = nodeIDList[index];

					data.push(new Dependency(element, "", "", "", vscode.TreeItemCollapsibleState.None, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));
				}

				return Promise.resolve( data );

			} else if ("FileSub" === element.type) {
				vscode.window.showInformationMessage('FileSub : ' + element.label );

				var nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];

					if( element.label !== data.filename ) {
						continue;
					}

					nodeList.push( data.subject );
				}

				var data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];

					data.push(new Dependency(element, "", "", "", vscode.TreeItemCollapsibleState.None));
				}

				return Promise.resolve( data );				

			} else {
				return Promise.resolve([]);
			}
					
		} else {

			if ( 0 !== this.userDataList.length) {
				// ファイル読み込み時
				return Promise.resolve(
					[new Dependency("Subject", "", "Subject", "", vscode.TreeItemCollapsibleState.Collapsed), 
					new Dependency("File", "", "File", "", vscode.TreeItemCollapsibleState.Collapsed), 
					new Dependency("Tag", "", "Tag", "", vscode.TreeItemCollapsibleState.Collapsed)
				]);
			} else {
				// 起動時
				return Promise.resolve([]);
			}
		}
	}

	// 選択されたtreeview
	getTreeviewSelect(element?: string): void {
		vscode.window.showInformationMessage('getTreeviewSelect');

		for (let index = 0; index < this.userDataList.length; index++) {
			const id = this.userDataList[index].id;
			if( element === id ) {

				// 
				let str : string;

				if( undefined !== this.userDataList[index].comment ) {
					this.commentDependencies.setComment(this.userDataList[index].comment);
				}else {
					this.commentDependencies.setComment("");				
				}

				const filename = this.userDataList[index].filename;
				const row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0 ;
				const column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0 ;

				// ファイルを開く
				vscode.workspace.openTextDocument(filename).then(function (doc) {
					vscode.window.showTextDocument(doc).then(function (editor) {
						let pos = new vscode.Position( row, column );
						editor.selection = new vscode.Selection( pos, pos);

						return;
					});
				});

				return;
			}
 		}
	}


	// JSONファイルの入力とツリービューへの展開
	getjson() : void {

		const userfile = vscode.window.showOpenDialog({
			canSelectFiles: true, 
			canSelectFolders: false, 
			canSelectMany: false, 
			title: 'Select a left file for compare' });
	
		if( !userfile ) {
			return;
		}
	
		userfile.then(fileUri => {
			if (fileUri && fileUri[0]) {

				try {

					let fileContent = fs.readFileSync(fileUri[0].fsPath, 'utf8');
					if( 0 >= fileContent.length ) {
						return;
					}
		
					const jsonData = JSON.parse(fileContent);
					if(( null === jsonData ) || ( null === jsonData.ImportErrorList ) || ( null === jsonData.ImportErrorList.version )) {
						return;
					}

					const version = jsonData.ImportErrorList.version;
					if( 1 !== version ) {
						return;
					}
		
					const data = jsonData.data;

					// this.dependency = [];
					this.userDataList = [];
					
					for (let  i = 0; i < data.length; i++) {

						this.userDataList.push( new UserData(data[i].filename, data[i].subject, data[i].description, data[i].row, data[i].column, data[i].level, data[i].comment, data[i].tooltip, data[i].tags, String(this.id)));

						this.id++;
					}
				} catch(e) {
					vscode.window.showInformationMessage('JSON Error');
				}

				this.refresh();
			}
		});
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly type: string,
		public readonly id: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';
}
