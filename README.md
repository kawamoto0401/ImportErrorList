
独自のエラーリストをVSCodeで読み込ませてソースジャンプ出来るようにします

VSCodeが未対応のツール(例えば静的確認やテストツール)の結果を独自のJsonファイルにすることで読み込むことが可能です


↓JSONファイル
    1:{ 
    2:	ImportErrorList: {
    3:	version: 1.0
    4:},
    5:data: [
    6:{
    7:  filename : "D:\\temp\\ImportErrorList\\src\\extension.ts",
    8:	subject : "test Subject",
    9:	description : "test Description",
	10:	row : 1,
	11:	column : 1,
	12:	comment : "test Comment",
	13:	level : 1,
	14:	tooltip : "test tooltip",
	15:	tags : "Edit Tool"
	16:},
	17:{
	18:	filename : "D:\\temp\\ImportErrorList\\src\\extension.ts",
	19:	subject : "test Subject",
	20:	description : "test Description",
	21:	row : 2,
	22:	column : 2,
	23:	comment : "test Comment\r\ntest Comment",
	24:	level : 1,
	25:	tooltip : "test tooltip2",
	26:	tags : "Edit"
	27:}]

1-4 Aplのチェックコード
7：filename(ファイルパス)
8：subject(題名)
9：description(内容)
10：row(行番号 1-)
11：column(列番号 1-)
12：comment(コメント)
13：level(レベル 1：Red 2：Yellow 3:Blue)
14：tooltip(ツールチップ )
15：tags(タグ)


↓Json作成ソース(Python)


