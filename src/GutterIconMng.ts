

import * as path from 'path';
import internal = require('stream');
import * as vscode from 'vscode';
import { DecorationRangeBehavior, OverviewRulerLane, Uri, ExtensionContext } from "vscode";
import { TextEditorDecorationType } from "vscode";

export class GutterIconMng {

    public readonly placeholderDecorationUri = Uri.file(
        path.join(__dirname, "..", "resources", "dark", "file_r.svg")
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
    constructor() {
        this.svgDir = Uri.file( path.join(__dirname, "..", "resources", "dark"));
        this.gutterIconMap = new Map();
	}

    // 引数にファイルパスと行数を設定
    // ハッシュに登録する
    setGutterIconMng( editor: vscode.TextEditor, filename : string, rows : number[]) {

        // 
        const svgUri = Uri.joinPath(this.svgDir, "file_r.svg");
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

            const key = filename + ":" + row;

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

        const key = filename + ":" + row;

        if( this.gutterIconMap.has(key)) {
            const decorationType = this.gutterIconMap.get(key);
            if( decorationType ) { 
                decorationType.dispose();
            }
        }
    }

    // 引数にファイルパスと行数からアイコンがあるかをチェック
    // ハッシュから探す
    isGutterIconMng( filename : string, row : number) {

        const key = filename + ":" + row;
        let isData : boolean = false;

        if( this.gutterIconMap.has(key)) {
            isData = true;
        }
        return isData;
    }

    deleteGutterIconMngAll() {

        for (const [key, decorationType] of this.gutterIconMap) {
            if( decorationType ) { 
                decorationType.dispose();
            }
        }

        this.gutterIconMap.clear();        
    }
}


