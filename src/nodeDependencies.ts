import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { WebViewProvider } from './WebViewProvider';
import { GutterIconMng } from './GutterIconMng';

// ErrorDataのマスタ情報
class UserData {
	constructor(
		/// 
		public readonly filename: string,
		public readonly subject : string,
		public readonly description : string,
		public readonly row : number, 
		public readonly column: number, 
		public readonly level : number,
		public readonly comment : string,
		public readonly tooltip: string,
		public readonly tags : Array<string>,
		public readonly id : number
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

// TreeItemのモデル情報
class UserTreeItemData {

	// 検索したときに対象外なら表示する/しないを管理
	public _isVisual : boolean = true;

	constructor(
		/// 
		public readonly name: string,
		public readonly level : number,
		public readonly tooltip: string,
		public readonly treeid : number,
		public readonly userid : number,
		public readonly type: typeof treeItemType[keyof typeof treeItemType],
		) {
	}

	get isVisual(): boolean {
		return this._isVisual;
	}
	
	set isVisual(b: boolean) {
		this._isVisual = b;
	}
}


const treeItemType = {
	subject: 0,
	file: 1,
	tag: 2,
	subjectSub: 3,
	fileSub: 4,
	tagSub: 5,
	none: 6
} as const;


export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;

	// ErrorDataの配列
	private userDataList: Array<UserData>;

	// ErrorDataの通し番号
	private id : number;

	// Treeのの通し番号
	private treeId : number;

	// TreeとUserDataをつなぎ合わせる
	private treeItemMap : Map< number, number >;

	// ガーターアイコンを管理する
	private gutterIconMng : GutterIconMng;
 
	constructor(private webViewProvider: WebViewProvider ) {
		this.userDataList = [];

		// 数字はデバッグのし易さのため意味なし
		this.id = 1000;
		this.treeId = 1000000;

		this.gutterIconMng  = new GutterIconMng;
		this.treeItemMap = new Map< number, number>;
	}

	// 
	refresh(): void {
		// vscode.window.showInformationMessage('refresh:');
		this._onDidChangeTreeData.fire();
	}

	// 初期化
	initTreeview(): void {
		// vscode.window.showInformationMessage('initTreeview:');
		
		this.treeItemMap.clear();

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
			if( treeItemType.subject === element.type ) {
				// vscode.window.showInformationMessage('subject');

				let nodeList: Array<string> = [];

				// 同一の題名を抽出する
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

					data.push(new Dependency(element, treeItemType.subjectSub, "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ( treeItemType.file === element.type ) {
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

					data.push(new Dependency(element, treeItemType.fileSub, "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ( treeItemType.tag === element.type ) {
				let nodeList: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const element = this.userDataList[index];

					for (let index2 = 0; index2 < element.tags.length; index2++) {
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

					data.push(new Dependency(element, treeItemType.tagSub, "", vscode.TreeItemCollapsibleState.Collapsed));
				}

				return Promise.resolve( data );

			} else if ( treeItemType.subjectSub === element.type ) {
				// vscode.window.showInformationMessage('subject Children : ' + element.label );

				let nodeList: Array<UserData> = [];
				// let nodeIDList: Array<number> = [];
				// let nodeIDTooltip: Array<string> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];

					if( element.label !== data.subject ) {
						continue;
					}

					// nodeList.push( data.filename );
					nodeList.push( data );
					// nodeIDTooltip.push( data.tooltip );
				}

				// ファイル名でソートする
				nodeList.sort((a,b) => {
					if (a.filename > b.filename ) {
						return 1;
					}
					return -1;
				});
				
				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index].filename;
					const id = String(nodeList[index].id);
					const tooltip = nodeList[index].tooltip;

					data.push(new Dependency(element, treeItemType.none, String(this.treeId), vscode.TreeItemCollapsibleState.None, tooltip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));

					this.treeItemMap.set( this.treeId, nodeList[index].id );
					this.treeId++;
				}

				return Promise.resolve( data );

			} else if ( treeItemType.fileSub === element.type ) {

				let nodeList: Array<UserData> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];

					if( element.label !== data.filename ) {
						continue;
					}

					nodeList.push( data );
				}

				// 行数でソートし、同じ時は題名でソートする
				nodeList.sort((a,b) => {
					if (a.row > b.row ) {
						return 1;
					}
					else if( a.row === b.row ) {
						if( a.subject > a.subject ) {
							return 1;
						}						
					}
					return -1;
				});
				
				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index].row + ":" + nodeList[index].subject;
					const id = String(nodeList[index].id);
					const tooltip = nodeList[index].tooltip;

					data.push(new Dependency(element, treeItemType.none, String(this.treeId), vscode.TreeItemCollapsibleState.None, tooltip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));

					this.treeItemMap.set( this.treeId, nodeList[index].id );
					this.treeId++;
				}

				return Promise.resolve( data );				

			} else if ( treeItemType.tagSub === element.type ) {

				let nodeList: Array<UserData> = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					const data = this.userDataList[index];
					for (let index2 = 0; index2 < data.tags.length; index2++) {

						if( element.label !== data.tags[index2] ) {
							continue;
						}

						nodeList.push( data );
					}
				}

				// 題名でソートし、同じ時はファイル名でソートする
				nodeList.sort((a,b) => {
					if (a.subject > b.subject ) {
						return 1;
					}
					else if( a.subject === b.subject ) {
						if( a.filename > a.filename ) {
							return 1;
						}						
					}
					return -1;
				});
				
				let data : Dependency[] = [];

				for (let index = 0; index < nodeList.length; index++) {
					const element = nodeList[index].subject + "：" + nodeList[index].filename;
					const id = String(nodeList[index].id);
					const tooltip = nodeList[index].tooltip;

					data.push(new Dependency(element, treeItemType.none, String(this.treeId), vscode.TreeItemCollapsibleState.None, tooltip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [id]}));

					this.treeItemMap.set( this.treeId, nodeList[index].id );
					this.treeId++;
				}

				return Promise.resolve( data );				

			} else {
				return Promise.resolve([]);
			}
					
		} else {

			if ( 0 !== this.userDataList.length) {
				// ファイル読み込み時
				return Promise.resolve(
					[new Dependency("Subject", treeItemType.subject, "", vscode.TreeItemCollapsibleState.Collapsed), 
					new Dependency("File", treeItemType.file, "", vscode.TreeItemCollapsibleState.Collapsed), 
					new Dependency("Tag", treeItemType.tag, "", vscode.TreeItemCollapsibleState.Collapsed)
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
			if( element === String(id) ) {

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

				// ファイルを開く
				vscode.workspace.openTextDocument(filename).then(function (doc) {
					vscode.window.showTextDocument(doc).then( (editor) => {

						// 行と列からカーソルを移動させる
						let pos = new vscode.Position( row, column );
						editor.selection = new vscode.Selection( pos, pos );

						// 行と列からスクリーンを移動させる
						let range = new vscode.Range(pos, pos);
						editor.revealRange(range);
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
			title: 'Select JSON file to open',
			filters: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"Json files": ['json'],
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'All files': ['*'] }});
	
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
	
						this.userDataList.push( new UserData(data[i].filename, subject, description, data[i].row, data[i].column, data[i].level, data[i].comment, tooltip, tagllist, this.id));

						this.id++;
					}
				} catch(e) {
					vscode.window.showInformationMessage('JSON Error');
				}

				this.refresh();
			}
		});
	}
	
	public setbookmark( element?: Dependency ){

		if (element) {

			const key = Number(element.id);

			if( this.treeItemMap.has(key)) {
				const userId = this.treeItemMap.get(key);

				for (let index = 0; index < this.userDataList.length; index++) {
					const id = this.userDataList[index].id;
					if( userId === id ) {
		
						const filename = this.userDataList[index].filename;
						const row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0 ;
						const column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0 ;
		
						// 非同期はthiisが使えないため参照する
						let gutterIconMng = this.gutterIconMng;
		
						// ファイルを開く
						vscode.workspace.openTextDocument(filename).then(function (doc) {
							vscode.window.showTextDocument(doc).then( (editor) => {
		
								// 行と列からカーソルは移動しない
								let pos = new vscode.Position( row, column );
		
								// 行と列からスクリーンを移動させる
								let range = new vscode.Range(pos, pos);
								editor.revealRange(range);

								// ガーターアイコンを追加
								gutterIconMng.setGutterIconMng( editor, filename, [row] );
							});
						});
		
						return;
					}
				}				
			}
		}
	}
	
	public setbookmarkFrom( element?: Dependency ){

		if (element) {

			const key = Number(element.id);

			if( this.treeItemMap.has(key)) {
				const userId = this.treeItemMap.get(key);

				let filename : string = "";
				let row = 0;
				let column = 0;

				for (let index = 0; index < this.userDataList.length; index++) {
					const id = this.userDataList[index].id;
					if( userId === id ) {
		
						filename = this.userDataList[index].filename;
						row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0;
						column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0;

						break;
					}
				}

				if( 0 === filename.length ) {
					return;
				}

				let rows : number[] = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					if( filename === this.userDataList[index].filename ) {
						if( row <= this.userDataList[index].row ) {
							rows.push(this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0);
						}
					}
				}

				// 非同期はthiisが使えないため参照する
				let gutterIconMng = this.gutterIconMng;

				// ファイルを開く
				vscode.workspace.openTextDocument(filename).then(function (doc) {
					vscode.window.showTextDocument(doc).then( (editor) => {

						// 行と列からカーソルは移動しない
						let pos = new vscode.Position( row, column );

						// 行と列からスクリーンを移動させる
						let range = new vscode.Range(pos, pos);
						editor.revealRange(range);

						// ガーターアイコンを追加
						gutterIconMng.setGutterIconMng( editor, filename, rows );
					});
				});
			}
		}
	}
	
	public setbookmarkAll( element?: Dependency ){

		if (element) {

			const key = Number(element.id);

			if( this.treeItemMap.has(key)) {
				const userId = this.treeItemMap.get(key);

				let filename : string = "";
				let row = 0;
				let column = 0;

				for (let index = 0; index < this.userDataList.length; index++) {
					const id = this.userDataList[index].id;
					if( userId === id ) {
		
						filename = this.userDataList[index].filename;
						row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0;
						column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0;

						break;
					}
				}

				if( 0 === filename.length ) {
					return;
				}

				let rows : number[] = [];

				for (let index = 0; index < this.userDataList.length; index++) {
					if( filename === this.userDataList[index].filename ) {
						rows.push(this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0);
					}
				}

				// 非同期はthiisが使えないため参照する
				let gutterIconMng = this.gutterIconMng;

				// ファイルを開く
				vscode.workspace.openTextDocument(filename).then(function (doc) {
					vscode.window.showTextDocument(doc).then( (editor) => {

						// 行と列からカーソルは移動しない
						let pos = new vscode.Position( row, column );

						// 行と列からスクリーンを移動させる
						let range = new vscode.Range(pos, pos);
						editor.revealRange(range);

						// ガーターアイコンを追加
						gutterIconMng.setGutterIconMng( editor, filename, rows );
					});
				});
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

	// アクティブなエディターが変更されたときに発生するイベント
    public updateEditorDecorations(textEditor: vscode.TextEditor | undefined) {
        if (typeof textEditor === "undefined") {
            return;
        }

        let fsPath = textEditor.document.uri.fsPath;

		let editorDecorations = this.gutterIconMng.getDecorationsList(fsPath);

        for (let [decoration, ranges] of editorDecorations) {
            textEditor.setDecorations(decoration, ranges);
        }
    }

	// テキストドキュメントが変更されたときに発行されるイベント
    public onEditorDocumentChanged(event: vscode.TextDocumentChangeEvent) {
        let fsPath = event.document.uri.fsPath;
    }
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly type: typeof treeItemType[keyof typeof treeItemType],
		public readonly id: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly tooltip?: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = tooltip;
		// this.description = this.version;

		if( treeItemType.none === type ) {
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
 		}	
	}
}
