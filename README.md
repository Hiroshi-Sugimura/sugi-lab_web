# sugi-lab_web

## Github pages 構築

1. GithubにPublicリポジトリを作成
	- PrivateリポジトリでのPagesは有料
1. docsフォルダにファイルを配置
2. Settings > Pages
	1. Branch: None > main
	2. Branch: /(root) > /docs
	3. Save

> Githubからメールがくるけど実行失敗する。
> 見てみると、
> Ensure GITHUB_TOKEN has permission "id-token: write".
> のエラーがでるかもしれない

4. Github Pages > Source: Deploy from a branch > GitHub Actions
5. ActionsにいってRe-run all jobsするとうまくいくとおもう
6. deployのURLが公開URL
	例: https://hiroshi-sugimura.github.io/sugi-lab_web/

## URL変える（カスタムドメイン）

1. DNSサーバを修正
	- 参考: https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site


> A レコード
> 185.199.108.153
> 185.199.109.153
> 185.199.110.153
> 185.199.111.153
>
> AAAA レコード
> 2606:50c0:8000::153
> 2606:50c0:8001::153
> 2606:50c0:8002::153
> 2606:50c0:8003::153

2. Settings > Pages > Custom domain > 入力してSave
	- 例: www.sugi-lab.net


