# 正式统计后台使用说明

玩家入口仍是 https://lxy-yuki.github.io/ 。无需启动本地服务器。

创作者后台：
https://maiying-game-counter.maiying-game-counter-worker.workers.dev/creator-stats.html

登录密码为 Windows 用户环境变量 CREATOR_PASSWORD 中保存的原密码。
密码和两个安全密钥已配置为 Cloudflare Worker Secrets，不在 GitHub 代码中。

计数口径：在基金会主页至少搜索一个有效关键词的浏览器资料，最多计一次。
后台只有密码登录者能读取；只读分享链接可设置有效期并撤销。持有分享链接的人可查看，
因此请只把链接发给希望其查看的人。

Cloudflare 项目名：maiying-game-counter。
D1 数据库名：maiying-game-stats，绑定名 DB。
GitHub 仓库：lxy-yuki/lxy-yuki.github.io，生产分支 main。

自动构建配置使用仓库根目录 /：

```text
Build command: npm --prefix cloudflare-counter ci
Deploy command: npm --prefix cloudflare-counter run deploy
```

这两条命令自动进入 cloudflare-counter 子目录处理后端。
非生产分支预览已关闭。Secrets 在 Worker 设置中单独保存，更新代码不会覆盖 Secrets。

修改游戏代码后提交并推送到 main：GitHub Pages 更新网页，Cloudflare 自动部署统计后端。
只在电脑本地修改文件而没有推送 GitHub，不会更新线上版本。

查看日志、用量、Secrets：Cloudflare → Workers & Pages → maiying-game-counter → 设置或 Observability。
查看数据与恢复：Cloudflare → Storage & databases → D1 → maiying-game-stats。
不要删除数据库、players 表或 DEVICE_HASH_SALT，避免丢失人数或破坏设备去重。

Worker 健康检查：
https://maiying-game-counter.maiying-game-counter-worker.workers.dev/api/health

目前使用免费 Workers 与 D1；额度耗尽或玩家网络无法访问 Workers 时不能保证实时计数。
玩家端会自动重试失败请求，并在下次打开基金会主页时继续发送待确认请求。

本项目只自行保存匿名设备哈希和首次计数时间；托管平台本身可能保留必要的访问日志。
若 workers.dev 在玩家网络中无法连接，需使用可访问的自定义后端域名，代码中修改 stats-config.js 即可。
