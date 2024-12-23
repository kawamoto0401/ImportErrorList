import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { WebViewProvider } from './WebViewProvider';
import { GutterIconMng } from './GutterIconMng';
import { TreeUserData, TreeType, TreeWarningLevel, RequstData } from './TreeUserData';

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


export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;

	// ErrorDataの配列
	private userDataList: Array<UserData>;

	// ErrorDataの通し番号
	private id : number;

	// ガーターアイコンを管理する
	private gutterIconMng : GutterIconMng;

	constructor(private webViewProvider: WebViewProvider ) {
		this.userDataList = [];

		// 数字はデバッグのし易さのため意味なし
		this.id = 1000;

		this.gutterIconMng  = new GutterIconMng;
	}

	//
	refresh(): void {
		console.log("### refresh ");
		this._onDidChangeTreeData.fire();
	}

	// 初期化
	initTreeview(): void {
		console.log("### initTreeview ");
		
		this.gutterIconMng.deleteGutterIconMngAll();

		this.userDataList.length = 0;
		this.refresh();
	}

	// ツリー検索(未対応)
	// 検索用の画面を表示、ツリービューに反映する
	searchTreeview(): void {
		console.log("### searchTreeview ");

		const name = vscode.window.showInputBox({ title : 'Search Word'});
		if( !name ) {
			return;
		}
	
		name.then( name => {

			if (name !== undefined) {
				if( 0 > name.length ) {
					vscode.window.showInformationMessage('Non Search:');
				}else {
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
		console.log("### getTreeItem ");
	
		return element;
	}

	// 子ツリーの表示
	//
	getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (element) {
			let treeUserData = TreeUserData.getInstance();
			let nodeList = treeUserData.getChildrenTreeNodeList(Number(element.treeType), Number(element.id));
			if( !nodeList ) {
				return Promise.resolve([]);					
			}

			let dependencyList : Dependency[] = [];

			for (let cnt1 = 0; cnt1 < nodeList.length; cnt1++) {
				const element = nodeList[cnt1];
		
				if( TreeType.data === element.treeType ) {
					// Fileのときは、Treeの最終ノードとし、クリック時にジャンプ出来るようにする
					dependencyList.push(new Dependency(element.name, element.id.toString(), element.treeType, element.warninglevel, vscode.TreeItemCollapsibleState.None, element.toolTip, {
						command: 'extension.getTreeviewSelect',
						title: '',
						arguments: [element.id]
					}));
				}
				else {
					dependencyList.push( new Dependency( element.name, element.id.toString(), element.treeType, element.warninglevel, vscode.TreeItemCollapsibleState.Collapsed) );
				}
			}

			return Promise.resolve(dependencyList);
					
		} else {

			if ( 0 !== this.userDataList.length) {
				// ファイル読み込み時

				let treeUserData = TreeUserData.getInstance();
				let nodeList = treeUserData.getChildrenTreeNodeList( TreeType.root, undefined);
				if( !nodeList ) {
					return Promise.resolve([]);					
				}

				let dependencyList : Dependency[] = [];

				for (let cnt1 = 0; cnt1 < nodeList.length; cnt1++) {
					const element = nodeList[cnt1];
					
					dependencyList.push( new Dependency( element.name, element.id.toString(), element.treeType, element.warninglevel, vscode.TreeItemCollapsibleState.Collapsed) );
				}

				return Promise.resolve(dependencyList);
			} else {
				// 起動時
				return Promise.resolve([]);
			}
		}
	}

	private isFileExists(filePath: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			fs.access(filePath, fs.constants.F_OK, (err) => {
				if (err) {
					resolve(false); // ファイルが存在しないか、アクセス権限がない
				} else {
					resolve(true); // ファイルが存在し、アクセス可能
				}
			});
		});
	}

	// Treeviewが選択された
	// 選択のelementからIDを取得してWebviewに反映
	getTreeviewSelect(element?: string): void {
		console.log("### getTreeviewSelect ");

		// TreeのIDからリストのIDに変換
		let treeUserData = TreeUserData.getInstance();
		let node = treeUserData.getTreeNode(Number(element));
		if( !node ) {
			return;
		}

		for (let index = 0; index < this.userDataList.length; index++) {
			const id = this.userDataList[index].id;
			if( node.dataID === id ) {

				// Webviewに反映させる
				let subject = '-';
				let description = '-';
				let comment = '-';

				if( undefined !== this.userDataList[index].subject ) {
					subject = this.userDataList[index].subject;
				}
				if( undefined !== this.userDataList[index].description ) {
					description = this.userDataList[index].description;
				}
				if( undefined !== this.userDataList[index].comment ) {
					comment = this.userDataList[index].comment;
				}

				this.webViewProvider.chgComment(subject, description, comment);


				const filename = this.userDataList[index].filename;
				const row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0 ;
				const column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0 ;

				// ファイルの存在チェック
				this.isFileExists(filename)
					.then(exists => {
						if (exists) {
							// ファイルを開く
							vscode.workspace.openTextDocument(filename).then(function (doc) {
								vscode.window.showTextDocument(doc).then((editor) => {

									// 行と列からカーソルを移動させる
									let pos = new vscode.Position(row, column);
									editor.selection = new vscode.Selection(pos, pos);

									// 行と列からスクリーンを移動させる
									let range = new vscode.Range(pos, pos);
									editor.revealRange(range);
								});
							});
						} else {
							vscode.window.showInformationMessage('Open Error:' + filename);
						}
					})
					.catch(err => {
						console.error('エラーが発生しました:', err);
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
						// eslint-disable-next-line no-throw-literal
						throw 'length 0';
					}
		
					const jsonData = JSON.parse(fileContent);
					if( null === jsonData ) {
						// eslint-disable-next-line no-throw-literal
						throw 'JSON null';
					}
					if (( null === jsonData.ImportErrorList ) || ( null === jsonData.ImportErrorList.version )) {
						// eslint-disable-next-line no-throw-literal
						throw 'format error';
					}
					const version = jsonData.ImportErrorList.version;
					if( 1 !== version ) {
						// eslint-disable-next-line no-throw-literal
						throw 'Not Version';
					}
		
					const data = jsonData.data;

					// 現在のtreeviewを破棄する
					this.userDataList = [];
	
					let treeUserData = TreeUserData.getInstance();
					treeUserData.init();

					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: "Progress...",
						cancellable: true
					}, async(progress, token) => {
						for (let cnt1 = 0; cnt1 < data.length; cnt1++) {

							if( token.isCancellationRequested) {
								vscode.window.showInformationMessage('Operation canselled');							
								return;
							}

							let subject = "No subject";
							if( 0 < data[cnt1].subject.length ) {
								subject = data[cnt1].subject;
							}
							let description = "No description";
							if( 0 < data[cnt1].description.length ) {
								description = data[cnt1].description;
							}
							let tooltip = data[cnt1].subject + " " + data[cnt1].filename + ":" + data[cnt1].row;
							if( 0 < data[cnt1].tooltip.length ) {
								tooltip = data[cnt1].tooltip;
							}
			
							// tagsをスペース分割する
							const tag : string  = data[cnt1].tags;
							const taglist : Array<string> = tag.split(/(\s+)/).filter( e => e.trim().length > 0);
		
							this.userDataList.push( new UserData(data[cnt1].filename, subject, description, data[cnt1].row, data[cnt1].column, data[cnt1].level, data[cnt1].comment, tooltip, taglist, this.id));
	
	
							// TreeDataを生成する
							let requstData: RequstData = {name: data[cnt1].filename + ":" + data[cnt1].row, row: data[cnt1].row, dataID: this.id, toolTip: "", warninglevel: data[cnt1].level};
							treeUserData.addSubject(subject, requstData);

							requstData.name = data[cnt1].row + ":" + subject;							
							treeUserData.addFile(data[cnt1].filename, requstData);
	
							for (let cnt2 = 0; cnt2 < taglist.length; cnt2++) {
								const element = taglist[cnt2];
								requstData.name = data[cnt1].filename + ":" + data[cnt1].row;
								treeUserData.addTag(element, requstData);
							}
	
							this.id++;
							
							if(( cnt1 % 100 ) === 0 ) {
								progress.report({ message: "読み込み中 " + cnt1 + "/" + data.length});
								await new Promise(resolve => setTimeout(resolve, 1));
							}
						}
	
						// 不要な枝を削除する
						progress.report({ message: "整理中..."});
						treeUserData.pruneFile();
	
						// デバッグ用
						treeUserData.output();

						this.refresh();
					});
				} catch(err) {
					if (typeof err === 'string') {
						vscode.window.showInformationMessage('JSON Error:' + err);
					} else {
						vscode.window.showInformationMessage('JSON Error:unkown');
					}
				}
			}
		});
	}
	
	public setbookmark( element?: Dependency ){

		if (element) {

			// TreeのIDからリストのIDに変換
			let treeUserData = TreeUserData.getInstance();
			let node = treeUserData.getTreeNode(Number(element.id));
			if( !node ) {
				return;
			}

			const userId = node.dataID;

			// ErorrListから対象のIDのファイル名を取得
			for (let index = 0; index < this.userDataList.length; index++) {
				const id = this.userDataList[index].id;
				if( userId === id ) {
	
					const filename = this.userDataList[index].filename;
					const row = this.userDataList[index].row > 0 ? this.userDataList[index].row - 1 : 0 ;
					const column = this.userDataList[index].column > 0 ? this.userDataList[index].column - 1 : 0 ;
					const level = this.userDataList[index].level;

					// ファイルの存在チェック
					this.isFileExists(filename)
					.then(exists => {
						if (exists) {
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
									gutterIconMng.setGutterIconMng( editor, filename, [row], level );
								});
							});
						} else {
							return;
						}
					})
					.catch(err => {
						console.error('エラーが発生しました:', err);
					});
	
					return;
				}
			}
		}
	}
	
	public setbookmarkAll( element?: Dependency ){

		if (element) {
			// TreeのIDからリストのIDに変換
			let treeUserData = TreeUserData.getInstance();

			// IDから子のIDに変換
			let nodeChildList = treeUserData.getChildrenTreeNodeList( TreeType.node, Number(element.id));
			if( !nodeChildList ) {
				return;
			}

			// IDからUserDataを取得
			let taggetUserDataList : UserData[] = [];
			for (const el of nodeChildList) {
				for (let index = 0; index < this.userDataList.length; index++) {
					const id = this.userDataList[index].id;
					if( el.dataID === id ) {
						taggetUserDataList.push( this.userDataList[index] );						
						break;
					}
				}				
			}
			if( !taggetUserDataList ) {
				return;
			}

			interface GutterFileData {
				fileName: string;
				lines: { row: number; column: number; level: number }[];
			}
			let gutterFileDataList : GutterFileData[] = [];
			for (const el of taggetUserDataList) {
				let isHit = false;
				for (let index = 0; index < gutterFileDataList.length; index++) {
	
					if( el.filename === gutterFileDataList[index].fileName ) {

						gutterFileDataList[index].lines.push( { row: el.row > 0 ? el.row - 1 : 0, column: el.column > 0 ? el.column - 1 : 0, level: el.level } );

						isHit = true;
						break;
					}
				}
				if( !isHit ) {
					let lines : { row: number; column: number; level: number }[] = [{ row: el.row > 0 ? el.row - 1 : 0, column: el.column > 0 ? el.column - 1 : 0, level: el.level }];
					gutterFileDataList.push( { fileName: el.filename, lines: lines } );
				}
			}


			for (const gutterFileData of gutterFileDataList) {
				
				// ファイルの存在チェック
				this.isFileExists(gutterFileData.fileName)
					.then(exists => {
						if (exists) {
							// level毎にガーターアイコンを追加
							for (let cnt1 = 1; cnt1 <= 3; cnt1++) {

								let rows: number[] = [];
								let level = cnt1;

								for (let index = 0; index < gutterFileData.lines.length; index++) {
									if (cnt1 === gutterFileData.lines[index].level) {
										rows.push(gutterFileData.lines[index].row);
									}
								}
								if (0 === rows.length) {
									continue;
								}

								// 非同期はthiisが使えないため参照する
								let gutterIconMng = this.gutterIconMng;

								// ファイルを開く
								vscode.workspace.openTextDocument(gutterFileData.fileName).then(function (doc) {
									vscode.window.showTextDocument(doc).then((editor) => {
										// ガーターアイコンを追加
										gutterIconMng.setGutterIconMng(editor, gutterFileData.fileName, rows, level);
									});
								});
							}							
						}
					})
					.catch(err => {
						console.error('エラーが発生しました:', err);
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
		console.log("### updateEditorDecorations ");

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

		// 不要
    }
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly id: string,
		public readonly treeType: number,
		public readonly warninglevel: number,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly tooltip?: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = tooltip;

		if( treeType === TreeType.data ) {
			switch (warninglevel) {
				case TreeWarningLevel.comment:
					this.iconPath = {
						light: path.join(__filename, '..', '..', 'resources', 'light', 'bookmark_b.svg'),
						dark: path.join(__filename, '..', '..', 'resources', 'dark', 'bookmark_b.svg')
					};
					this.contextValue = 'ContextErrorCode';
					break;
	
				case TreeWarningLevel.warning:
					this.iconPath = {
						light: path.join(__filename, '..', '..', 'resources', 'light', 'bookmark_y.svg'),
						dark: path.join(__filename, '..', '..', 'resources', 'dark', 'bookmark_y.svg')
					};
	
					this.contextValue = 'ContextErrorCode';
					break;
	
				case TreeWarningLevel.none:
				case TreeWarningLevel.error:
				default:
						this.iconPath = {
						light: path.join(__filename, '..', '..', 'resources', 'light', 'bookmark_r.svg'),
						dark: path.join(__filename, '..', '..', 'resources', 'dark', 'bookmark_r.svg')
					};
	
					this.contextValue = 'ContextErrorCode';
					break;
			}
		}
		else if (treeType === TreeType.node) {
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'file.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file.svg')
			};
			this.contextValue = 'ContextFile';
		}
		else {
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
			};
		}
	}
}
