# Minecraft Log Forwarder

## これは何？

マイクラのサーバについて、

- サーバの起動
- サーバの停止
- ユーザのログイン
- ユーザのログアウト

時のログをウェブフックを介してdiscordに飛ばすやつです

## 使い方

1. discordのサーバにwebhookを用意する
1. マイクラのサーバが動いているか環境に[deno](https://deno.land/)をインストールする
1. `logForwarder.ts`をマイクラのサーバが動いている環境にコピーする
1. 下記設定ファイルフォーマットを参考に設定ファイルを用意する
1. 4.で作成した設定ファイルを引数に`logForwarder.ts`をdenoで実行する

### 設定ファイルフォーマット

```json
{
    "logFilePath": "マイクラのログファイル（latest.log）のパス",
    "ModsDirPath": "modフォルダのパス（あれば）",
    "webhookUrl": "通知を飛ばす先のwebhookのエンドポイント"
}
```

### 実行例

- 設定ファイル名： `logForwarderConfig.json`

```bash
deno run --allow-read --allow-net logForwarder.ts logForwarderConfig.json
```
