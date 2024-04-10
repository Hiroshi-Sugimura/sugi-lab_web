# appendixViewer 設計メモ

2019.07.03

## Abstract
　appendixViewerは「ECHONET Lite機器オブジェクト詳細規定」と同等の内容をブラウザーで表示するアプリケーションである。HTML5（HTML/CSS/JavaScript）で構成されているので、オフラインのWebブラウザー上で動作する。  
　「ECHONET Lite機器オブジェクト詳細規定」のデータはJSONで記述され、JavascriptのファイルelDeviceDescription.jsとして読み込まれる。現時点で35機種Release K対応である。対応機器を追加したり、最新のReleaseに対応するには、JSONデータをupdateしてから、DeviceDescription.jsをupdateする。なお、JSON dataのversionはV3.1.0である。JSON dataの記述フォーマットが修正された場合には、elDdViererの修正が必要になる。

## How to Launch
HTMLフォルダ内のindex.htmlをChromeなどのWebブラウザーで開く

## Frameworks
以下のFrameworksを利用している。  
jQueryは基本的にVue.jsが利用している。HTML内で一部jQueryを直接利用している。

- Vue.js
- Bootstrap
- jQuery

## Files
- bitmap.html: bitmapのデータを表示するためのHTMLファイル
- elDdViewer.js: メインのJavaScriptプログラム
- elDeviceDescription.js: JSONデータを読み込むためのプログラム
- index.html: メインのHTMLファイル
- lib: Vue.js, Bootstrap, jQueryのフォルダ
- note.html: 備考を表示するためのHTMLファイル
- parseJSON.js: オリジナルのJSONデータをもとに、指定された機器オブジェクト・リリースのJSONデータを作成する。definitionsの処理もおこなう。
- test.js: parseJSON.jsのテストファイル

## 設計メモ
### index.html
- Bootstrapを利用
- class="container-fluid"でWindowの幅を可変にしている
- Bootstrapのcardを利用
    - card-headerにプルダウンメニューやラジオボタンを組み込む。
    - card-bodyの１行目はtitle行として固定行
    - card-bodyの残りの行はコンテンツ表示で縦方向にスクロール可能。高さはWindowのHの80%に設定
        - div id="wrapper", height: 80vh
- コンテンツ表示は、arrayのappendix_listの中身を取り出して変数appendixに入れて処理
    - 値域の種類はappendix.propTypeによって条件分岐　state, numericValue, それ以外
    - appendix.propType自身は、state, number, numericValue, level, bitmap, date-time, time, raw
    - 値域の情報はappendix.rangeに入っている
    - 値域がbitmapの場合は、"bitmap"と表示される。それをクリックすると別windowが開き、bitmapのJSON dataが表示される。
- 備考欄の処理
    - appendix.noteの中身が'empty'ならば空欄。
    - appendix.noteの中身が'empty'でなければ、'*'を表示する。
    - '*'をクリックすると別windowが開き、appendix.noteを表示する
    - 表示はmethodのshowNote(appendix.note)をcallする

### elDdViewer.js
- Vueのmodel側
- Properties
- Methods
    - showNote: 備考欄の内容を別windowで表示する。表示データはlocalStrage経由で別windowに渡される。
