

import * as path from 'path';
import internal = require('stream');
import * as vscode from 'vscode';
import { DecorationRangeBehavior, OverviewRulerLane, Uri, ExtensionContext } from "vscode";
import { TextEditorDecorationType } from "vscode";

// ガーターアイコンを管理する
export class GutterIconMng {

    public readonly placeholderDecorationUri = Uri.file(
        path.join(__dirname, "..", "resources", "dark", "bookmark_r.svg")
    );

    public readonly placeholderDecoration = vscode.window.createTextEditorDecorationType(
        {
            gutterIconPath: this.placeholderDecorationUri.fsPath,
            gutterIconSize: 'contain',
        }
    );

    // SVGフォルダのパス
    private svgDir: Uri;

    // 削除するためのTextEditorDecorationTypeをファイルパス：行番号で管理
    private gutterIconMap: Map<string, vscode.TextEditorDecorationType>;

    // フォルダパスの設定とMapを設定
    // TODO:引数にした方が拡張性があるが放置
    constructor() {
        this.svgDir = Uri.file( path.join(__dirname, "..", "resources", "dark"));
        this.gutterIconMap = new Map();
	}

    // 引数にファイルパスと行数を設定
    // ハッシュに登録する
    setGutterIconMng( editor: vscode.TextEditor, filename : string, rows : number[], level: number) {

        let svgUri = Uri.joinPath(this.svgDir, "bookmark_r.svg");
        switch (level) {
            case 3:
                svgUri = Uri.joinPath(this.svgDir, "bookmark_b.svg");
                break;

            case 2:
                svgUri = Uri.joinPath(this.svgDir, "bookmark_y.svg");
                break;

            case 1:
            default:
                svgUri = Uri.joinPath(this.svgDir, "bookmark_r.svg");
                break;
        }

        const decorationOptions = {
            gutterIconPath: svgUri,
            rangeBehavior: DecorationRangeBehavior.ClosedClosed
        };

        const decorationType = vscode.window.createTextEditorDecorationType(decorationOptions);

        let ranges : vscode.Range[] = [];

        //
        for (const row of rows) {
            const pos = new vscode.Position( row, 0 );
            const range = new vscode.Range(pos, pos);

            if( this.isGutterIconMng(filename, row)) {
                continue;
            }

            ranges.push(range);

            const key = filename + "," + row;
            this.gutterIconMap.set( key, decorationType );
        }

        if( 0 === ranges.length ) {
            return;
        }

        editor.setDecorations(decorationType, ranges);

        return;
    }


    // 引数にファイルパスと行数を設定
    // ハッシュから削除を行う
    deleteGutterIconMng( filename : string, row : number) {

        const key = filename + "," + row;

        if( this.gutterIconMap.has(key)) {
            const decorationType = this.gutterIconMap.get(key);
            if( decorationType ) {
                decorationType.dispose();
            }
        }
    }

    // 引数にファイルパスと行数からガーターアイコンがあるかをチェック
    // ハッシュから探す
    isGutterIconMng( filename : string, row : number) {

        const key = filename + "," + row;
        let isData : boolean = false;

        if( this.gutterIconMap.has(key)) {
            isData = true;
        }
        return isData;
    }

    // 持っているアイコンを全て破棄(MapはGC対象外)
    deleteGutterIconMngAll() {

        for (const [key, decorationType] of this.gutterIconMap) {
            if( decorationType ) {
                decorationType.dispose();
            }
        }

        this.gutterIconMap.clear();
    }

    //
    public getDecorationsList(fsPath: string): Map<vscode.TextEditorDecorationType, Array<vscode.Range>> {

        let editorDecorations = new Map<TextEditorDecorationType, vscode.Range[]>();
        for (let [filePathLineNumber, decoration] of this.gutterIconMap) {

            let result = filePathLineNumber.split(',');

            let filePath = result[0];
            let lineNumber = Number(result[1]);

            if( filePath !== fsPath ) {
                // ファイルパスに:があるときはWindowsのドライブ名があるとし、最初の1文字目は大文字小文字は判断しない
                let drv1 = fsPath.match("^[A-Za-z]:");
                if( null === drv1 ){
                    continue;
                }

                let drv2 = filePath.match("^[A-Za-z]:");
                if( null === drv2 ){
                    continue;
                }

                if( drv1[0].toLowerCase !== drv2[0].toLowerCase ) {
                    continue;
                }

                if( filePath.substring(1) !== fsPath.substring(1) ) {
                    continue;
                }
            }

            let ranges = editorDecorations.get(decoration);
            if (typeof ranges === "undefined") {
                ranges = new Array<vscode.Range>();
                editorDecorations.set(decoration, ranges);
            }

            ranges.push(new vscode.Range(lineNumber, 0, lineNumber, 0));
        }

         return editorDecorations;
    }

}


