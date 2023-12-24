import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { WebViewProvider } from './WebViewProvider';
import { GutterIconMng } from './GutterIconMng';

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

	// ErrorDataの配列
	userDataList: Array<UserData>;

	// ErrorDataの通し番号
	id : number;

	// アイコン管理クラス
	gutterIconMng : GutterIconMng;

	constructor(private webViewProvider: WebViewProvider ) {
		this.userDataList = [];
		this.id = 1000;
		this.gutterIconMng  = new GutterIconMng;
	}

	// 
	refresh(): void {
		// vscode.window.showInformationMessage('refresh:');
		this._onDidChangeTreeData.fire();
	}

	// 初期化
	initTreeview(): void {
		// vscode.window.showInformationMessage('initTreeview:');
		
		this.gutterIconMng.deleteGutterIconMngAll();

		this.userDataList.length = 0;
		this.refresh();
	}

	// ツリー検索
	// 検索用の画面を表示、ツリービューに反映する
	searchTreeview(): void {
		// vscode.window.showInformationMessage('searchTreeview:');

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
					// vscode.window.showInformationMessage(name);


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

	// ツリーの表示
	// 
	getTreeItem(element: Dependency): vscode.TreeItem {
		// vscode.window.showInformationMessage('element:' + element.label);
		return element;
	}

	// 子ツリーの表示
	// 
	getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (element) {
			// 子ツリーの表示
			if( "Subject" === element.type ) {
				// vscode.window.showInformationMessage('Subject');

				let nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const element = this.userDataList[index];

					if( nodeList.indexOf(element.subject) > -1 ) {
						continue;
					}

					nodeList.push( element.subject );
				}

				nodeList.sort();

				let  data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];

					data.push(new Dependency(element, "SubjectSub", "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ( "File" === element.type ) {
				// vscode.window.showInformationMessage('File');

				let nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const element = this.userDataList[index];

					if( nodeList.indexOf(element.filename) > -1 ) {
						continue;
					}

					nodeList.push( element.filename );
				}

				nodeList.sort();

				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];

					data.push(new Dependency(element, "FileSub", "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ("Tag" === element.type) {
				// vscode.window.showInformationMessage('Tab');

				let nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const element = this.userDataList[index];

					for (let index2 = 0; index2 < this.userDataList.length; index2++) {
						const str : string = element.tags[index2];
						if( undefined === str ) {
							continue;
						}

						if( nodeList.indexOf( str ) > -1 ) {
							continue;
						}

						nodeList.push( str );
					}
				}

				nodeList.sort();

				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];

					data.push(new Dependency(element, "TagSub", "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ("SubjectSub" === element.type) {
				// vscode.window.showInformationMessage('Subject Children : ' + element.label );

				let nodeList: Array<string> = [];
				let nodeIDList: Array<string> = [];
				let nodeIDTooltip: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];

					if( element.label !== data.subject ) {
						continue;
					}

					nodeList.push( data.filename );
					nodeIDList.push( String(data.id) );
					nodeIDTooltip.push( String(data.tooltip) );
				}

				nodeList.sort();

				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];
					const id = nodeIDList[index];
					const tooltip = nodeIDTooltip[index];

					data.push(new Dependency(element, "", "", vscode.TreeItemCollapsibleState.None, tooltip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));
				}

				return Promise.resolve( data );

			} else if ("FileSub" === element.type) {
				// vscode.window.showInformationMessage('File Children : ' + element.label );

				let nodeList: Array<string> = [];
				let nodeIDList: Array<string> = [];
				let nodeIDTooltip: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];

					if( element.label !== data.filename ) {
						continue;
					}

					nodeList.push( data.subject );
					nodeIDList.push( String(data.id) );
					nodeIDTooltip.push( String(data.tooltip) );
				}

				nodeList.sort();

				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];
					const id = nodeIDList[index];
					const tooltip = nodeIDTooltip[index];

					data.push(new Dependency(element, "", "", vscode.TreeItemCollapsibleState.None, tooltip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));
				}

				return Promise.resolve( data );				

			} else if ("TagSub" === element.type) {
				// vscode.window.showInformationMessage('Tag Children : ' + element.label );

				let nodeList: Array<string> = [];
				let nodeIDList: Array<string> = [];
				let nodeIDTooltip: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];
					for (let index2 = 0; index2 < data.tags.length; index2++) {

						if( element.label !== data.tags[index2] ) {
							continue;
						}

						nodeList.push( data.subject + "：" + data.filename );
						nodeIDList.push( String(data.id) );
						nodeIDTooltip.push( String(data.tooltip) );
					}
				}

				nodeList.sort();

				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index];
					const id = nodeIDList[index];
					const tooltip = nodeIDTooltip[index];

					data.push(new Dependency(element, "", "", vscode.TreeItemCollapsibleState.None, tooltip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));
				}

				return Promise.resolve( data );				

			} else {
				return Promise.resolve([]);
			}
					
		} else {

			if ( 0 !== this.userDataList.length) {
				// ファイル読み込み時
				return Promise.resolve(
					[new Dependency("Subject", "Subject", "", vscode.TreeItemCollapsibleState.Collapsed), 
					new Dependency("File", "File", "", vscode.TreeItemCollapsibleState.Collapsed), 
					new Dependency("Tag", "Tag", "", vscode.TreeItemCollapsibleState.Collapsed)
				]);
			} else {
				// 起動時
				return Promise.resolve([]);
			}
		}
	}

	// Treeviewが選択された
	// 選択のelementからIDを取得してWebviewに反映
	getTreeviewSelect(element?: string): void {
		// vscode.window.showInformationMessage('getTreeviewSelect');

		for (let index = 0; index < this.userDataList.length; index++) {
			const id = this.userDataList[index].id;
			if( element === id ) {

				// Webviewに反映させる
				let description = '-';
				let comment = '-';

				if( undefined !== this.userDataList[index].description ) {
					description = this.userDataList[index].description;
				}
				if( undefined !== this.userDataList[index].comment ) {
					comment = this.userDataList[index].comment;
				}

				this.webViewProvider.chgComment(description, comment);


				const filename = this.userDataList[index].filename;
				const row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0 ;
				const column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0 ;

				let gutterIconMng = this.gutterIconMng;

				// ファイルを開く
				vscode.workspace.openTextDocument(filename).then(function (doc) {
					vscode.window.showTextDocument(doc).then( (editor) => {

						// 行と列からカーソルを移動させる
						let pos = new vscode.Position( row, column );
						editor.selection = new vscode.Selection( pos, pos );

						// 行と列からスクリーンを移動させる
						let range = new vscode.Range(pos, pos);
						editor.revealRange(range);

						gutterIconMng.setGutterIconMng( editor, filename, [row] );
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

					// 現在のtreeviewを破棄する
					this.userDataList = [];
					
					for (let  i = 0; i < data.length; i++) {

						let subject = "No subject"; 
						if( 0 < data[i].subject.length ) {
							subject = data[i].subject;
						}
						let description = "No description"; 
						if( 0 < data[i].description.length ) {
							description = data[i].description;
						}
						let tooltip = data[i].subject + " " + data[i].filename + ":" + data[i].row; 
						if( 0 < data[i].tooltip.length ) {
							tooltip = data[i].tooltip;
						}
		
						// tagsをスペース分割する
						const tag : string  = data[i].tags;
						const tagllist : Array<string> = tag.split(/(\s+)/).filter( e => e.trim().length > 0);
	
						this.userDataList.push( new UserData(data[i].filename, subject, description, data[i].row, data[i].column, data[i].level, data[i].comment, tooltip, tagllist, String(this.id)));

						this.id++;
					}
				} catch(e) {
					vscode.window.showInformationMessage('JSON Error');
				}

				this.refresh();
			}
		});
	}
	
	public bookmark( element?: Dependency ){
		if (element) {
			for (let index = 0; index < this.userDataList.length; index++) {
				const id = this.userDataList[index].id;
				if( element.id === id ) {
	
					// Webviewに反映させる
					let description = '-';
					let comment = '-';
	
					if( undefined !== this.userDataList[index].description ) {
						description = this.userDataList[index].description;
					}
					if( undefined !== this.userDataList[index].comment ) {
						comment = this.userDataList[index].comment;
					}
	
					this.webViewProvider.chgComment(description, comment);
	
	
					const filename = this.userDataList[index].filename;
					const row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0 ;
					const column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0 ;
	
					let gutterIconMng = this.gutterIconMng;
	
					// ファイルを開く
					vscode.workspace.openTextDocument(filename).then(function (doc) {
						vscode.window.showTextDocument(doc).then( (editor) => {
	
							// 行と列からカーソルを移動させる
							let pos = new vscode.Position( row, column );
							editor.selection = new vscode.Selection( pos, pos );
	
							// 行と列からスクリーンを移動させる
							let range = new vscode.Range(pos, pos);
							editor.revealRange(range);

							gutterIconMng.setGutterIconMng( editor, filename, [row] );
						});
					});
	
					return;
				}
			 }
		}
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
		public readonly type: string,
		public readonly id: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly tooltip?: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = tooltip;
		// this.description = this.version;

		if( "" === type ) {
			// TODO:レベルによってアイコンを変更する
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'file_r.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file_r.svg')
			};

			this.contextValue = 'dependency';
		}
		else {
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
			};

			// if( "SubjectSub" === type || "FileSub" === type || "TagSub" === type) {
			// 	this.contextValue = 'dependency';
			// }
 		}	
	}
}
