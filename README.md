
# ImportErrorList vscode README

独自にエラーリストをVScodeで読み込めるようにします

Allows VScode to read the error list independently


## Features

独自のエラーリスト(JSON)をVSCodeで読み込み、ツリー表示、ソースファイルで一括表示、ソースジャンプ出来るようにします

Load your own error list with VSCode and enable tree display, bulk display of source files, and source jump.

![キャプチャ](https://github.com/kawamoto0401/ImportErrorList/blob/master/media/cap1.PNG)

VSCodeが未対応のツール（例えば静的確認やテストツール）の結果をテキストファイルで見るよりは、VScodeで表示した方が解析しやすいと思い作成

テキストファイルを独自のJSONファイルにすることで読み込むことができるようにしますので、別途、Python等でJSONへの変換が必要になります

I created this because I thought it would be easier to analyze the results of tools that are not supported by VSCode (e.g. static confirmation or testing tools), rather than viewing them in a text file.

Since the text file can be read by converting it into a unique JSON file, you will need to convert it separately using Python, etc.


### JSONファイルの構造
(詳細は https://github.com/kawamoto0401/ImportErrorList/blob/master/sample/data.json 参照)

```json
{
  "ImportErrorList": {
    "version": "1.0"
  },
  "data": [
    {
      "filename": "D:\\temp\\ImportErrorList\\src\\extension.ts",
      "subject": "test Subject",
      "description": "test Description",
      "row": 1,
      "column": 1,
      "comment": "test Comment",
      "level": 1,
      "tooltip": "test tooltip",
      "tags": "Edit Tool"
    },
    {
      "filename": "D:\\temp\\ImportErrorList\\src\\extension.ts",
      "subject": "test Subject",
      "description": "test Description",
      "row": 2,
      "column": 2,
      "comment": "test Comment\r\ntest Comment",
      "level": 1,
      "tooltip": "test tooltip2",
      "tags": "Edit"
    }
  ]
}
```

Line
2-3,5 Aplのチェックコード

7：filename(ファイルパス)

8：subject(題名)

9：description(内容)

10：row(行番号 1-)

11：column(列番号 1-)

12：comment(コメント)

13：level(レベル 1：Red 2：Yellow 3:Blue)

14：tooltip(ツールチップ)

15：tags(タグ)


### Known Issues

多言語対応していません

日本語のみです

Not multilingual

Japanese only
