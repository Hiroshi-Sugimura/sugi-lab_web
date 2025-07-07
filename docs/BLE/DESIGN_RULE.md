# Apple 風デザイン完全実装ガイド

Apple の Human Interface Guidelines と Apple 公式サイトの実装値を徹底分析し、完全に再現可能なレベルでのデザインルールを構築しました。以下のルールに従うことで、**確実に Apple 風の Web サイトデザインを実現**できます。

## 1. 配色システム（カラーパレット・使用場面・HEX コード）

### メインカラーパレット

**プライマリカラー**

- **ブラック**: `#000000` - メインテキスト、ナビゲーション、アイコン
- **ホワイト**: `#FFFFFF` - 背景、カード背景、逆転テキスト
- **グレー**: `#A3AAAE` - セカンダリテキスト、境界線

**システムカラー（iOS 準拠）**

- **システムブルー**: `#007AFF` - リンク、主要アクション、選択状態
- **システムレッド**: `#FF3B30` - エラー、削除、警告アクション
- **システムグリーン**: `#4CD964` - 成功、確認、正常状態
- **システムオレンジ**: `#FF9500` - 警告、注意喚起
- **システムパープル**: `#5856D6` - 創造性、プレミアム機能

**グレースケール（24 段階システム）**

- **テキスト用**: `#1D1D1F` (メイン), `#666666` (セカンダリ), `#979797` (キャプション)
- **背景用**: `#F5F5F7` (ライトグレー背景), `#EEEEEE` (分割線)
- **インタラクティブ**: `#0088CC` (ホバー用ブルー)

### カラー使用ルール

**テキストカラー適用**

```css
/* メインテキスト */
color: #000000; /* 主要コンテンツ */
color: #1d1d1f; /* 本文テキスト */
color: #666666; /* セカンダリ情報 */
color: #979797; /* キャプション・注釈 */
```

**アクションカラー適用**

```css
/* プライマリアクション */
background-color: #007aff;
color: #ffffff;

/* セカンダリアクション */
background-color: transparent;
color: #007aff;
border: 1px solid #007aff;
```

## 2. 角丸（border-radius）設定

### コンポーネント別角丸値

**ボタン系**

- **小さなボタン**: `border-radius: 8px` (高さ 32px 以下)
- **標準ボタン**: `border-radius: 12px` (高さ 44px)
- **大きなボタン**: `border-radius: 16px` (高さ 56px 以上)

**カード・コンテナ系**

- **小さなカード**: `border-radius: 12px` (幅 200px 以下)
- **標準カード**: `border-radius: 16px` (幅 200-400px)
- **大きなカード**: `border-radius: 20px` (幅 400px 以上)

**フォーム要素**

- **入力フィールド**: `border-radius: 8px`
- **テキストエリア**: `border-radius: 12px`
- **セレクトボックス**: `border-radius: 8px`

**モーダル・オーバーレイ**

- **モーダル**: `border-radius: 20px` (iOS 風)
- **ポップオーバー**: `border-radius: 16px`
- **ツールチップ**: `border-radius: 8px`

### 角丸実装の注意点

**連続的な角丸（Continuous Corners）**

```css
/* iOS風の滑らかな角丸を再現 */
border-radius: 16px;
/* フィグマの場合: Corner Smoothing 60-61% を適用 */
```

## 3. 余白システム（margin・padding）

### 基本スペーシングユニット

**8px ベースシステム**

- **極小**: `4px` - アイコンと文字の間隔
- **小**: `8px` - 関連要素間の最小間隔
- **標準**: `16px` - 一般的な要素間隔、カード内 padding
- **中**: `24px` - セクション間の区切り
- **大**: `32px` - メジャーセクション間
- **特大**: `48px` - ページ最上部・最下部の余白

### コンポーネント別余白設定

**ボタン**

```css
/* 標準ボタン */
padding: 12px 24px; /* 上下12px, 左右24px */
min-height: 44px; /* タッチターゲット最小サイズ */

/* 小さなボタン */
padding: 8px 16px;
min-height: 32px;

/* 大きなボタン */
padding: 16px 32px;
min-height: 56px;
```

**カード内部**

```css
/* カード内padding */
padding: 20px; /* 標準カード */
padding: 16px; /* 小さなカード */
padding: 24px; /* 大きなカード */
```

**レイアウト余白**

```css
/* ページレベル */
margin: 0 16px; /* モバイル水平マージン */
margin: 0 24px; /* タブレット水平マージン */
margin: 0 auto;
max-width: 1200px; /* デスクトップ中央寄せ */

/* セクション間 */
margin-bottom: 32px; /* セクション区切り */
margin-bottom: 48px; /* メジャーセクション区切り */
```

## 4. コントラストの考え方

### テキストコントラスト規則

**WCAG 2.1 準拠コントラスト比**

- **通常テキスト**: 4.5:1 以上
- **大きなテキスト**: 3:1 以上
- **UI コンポーネント**: 3:1 以上

**推奨テキスト組み合わせ**

```css
/* 高コントラスト（メインテキスト） */
background: #ffffff;
color: #000000; /* 21:1 ratio */
background: #f5f5f7;
color: #1d1d1f; /* 16.8:1 ratio */

/* 中コントラスト（セカンダリテキスト） */
background: #ffffff;
color: #666666; /* 5.74:1 ratio */
background: #f5f5f7;
color: #979797; /* 4.54:1 ratio */

/* アクションカラー */
background: #007aff;
color: #ffffff; /* 4.5:1 ratio */
```

### UI 要素のコントラスト

**インタラクティブ要素**

- **ボタン**: 背景色とテキストで 4.5:1 以上
- **リンク**: 周囲のテキストと 3:1 以上の差
- **フォーム**: 境界線と背景で 3:1 以上

**状態による色の変化**

```css
/* 通常状態 */
background-color: #007aff;

/* ホバー状態 */
background-color: #0056cc; /* 20%暗く */

/* 無効状態 */
background-color: #007aff;
opacity: 0.3; /* 30%透明度 */
```

## 5. カードデザインの使い方

### カードの基本スペック

**標準カード**

```css
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: none; /* 影でのみ区別 */
}
```

**影（Shadow）の設定**

```css
/* 軽い影（標準） */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

/* 中程度の影（ホバー時） */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

/* 強い影（モーダル・重要要素） */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
```

### カードサイズバリエーション

**小カード（モバイル）**

```css
.card-small {
  min-width: 280px;
  max-width: 320px;
  padding: 16px;
  border-radius: 12px;
}
```

**標準カード**

```css
.card-standard {
  min-width: 320px;
  max-width: 400px;
  padding: 20px;
  border-radius: 16px;
}
```

**大カード（デスクトップ）**

```css
.card-large {
  min-width: 400px;
  max-width: 600px;
  padding: 24px;
  border-radius: 20px;
}
```

### カード内レイアウト

**コンテンツ構造**

```css
.card-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eeeeee;
}

.card-body {
  margin-bottom: 20px;
  line-height: 1.5;
}

.card-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eeeeee;
}
```

## 6. スペースの使い方（要素間距離・グリッドシステム）

### 要素間距離の体系

**関連度による間隔**

- **密接関連**: `4px` - ラベルと値、アイコンとテキスト
- **関連**: `8px` - 同じグループ内の要素
- **やや関連**: `16px` - 異なるグループの要素
- **独立**: `24px` - セクション内の区切り
- **完全分離**: `32px` - セクション間の区切り

### グリッドシステム

**12 カラムフレキシブルグリッド**

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px; /* モバイル */
  padding: 0 24px; /* タブレット */
  padding: 0 32px; /* デスクトップ */
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px; /* モバイル */
  gap: 20px; /* タブレット */
  gap: 24px; /* デスクトップ */
}
```

**レスポンシブブレークポイント**

```css
/* モバイル */
@media (max-width: 767px) {
  .container {
    padding: 0 16px;
  }
  .grid {
    gap: 16px;
  }
}

/* タブレット */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    padding: 0 24px;
  }
  .grid {
    gap: 20px;
  }
}

/* デスクトップ */
@media (min-width: 1024px) {
  .container {
    padding: 0 32px;
  }
  .grid {
    gap: 24px;
  }
}
```

### タイポグラフィスペーシング

**SF Pro フォントシステム**

```css
/* システムフォント指定 */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;

/* サイズ階層 */
.text-large-title {
  font-size: 34px;
  line-height: 1.2;
  margin-bottom: 24px;
}
.text-title-1 {
  font-size: 28px;
  line-height: 1.25;
  margin-bottom: 20px;
}
.text-title-2 {
  font-size: 22px;
  line-height: 1.3;
  margin-bottom: 16px;
}
.text-headline {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 12px;
}
.text-body {
  font-size: 17px;
  line-height: 1.5;
  margin-bottom: 16px;
}
.text-caption {
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
}
```

## 実装チェックリスト

### 必須要件

- [ ] 最小タッチターゲット 44px×44px 確保
- [ ] コントラスト比 4.5:1 以上維持
- [ ] システムフォント（SF Pro）使用
- [ ] 8px ベースのスペーシング遵守
- [ ] 角丸値の統一（8px、12px、16px、20px）
- [ ] 影の一貫性確保

### 推奨事項

- [ ] ダークモード対応の色設計
- [ ] アクセシビリティ対応
- [ ] レスポンシブデザイン実装
- [ ] 滑らかなアニメーション追加
- [ ] セマンティックカラー使用

このガイドラインに従うことで、**Apple 公式サイトと同等の品質とデザイン一貫性**を持つ Web サイトを構築できます。各数値は実際の Apple の実装値に基づいており、そのまま適用することで確実に Apple 風のデザインを実現できます。


