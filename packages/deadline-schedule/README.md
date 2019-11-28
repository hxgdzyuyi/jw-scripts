# `deadline-schedule`

> 从 csv 文件根据倒计时生成 trello board，每周归并成一个 list

## Usage

将 CSV 转换成 trello

CSV 文件结构:

- Subject 日程名称
- Description 日程详情
- Days 还有几天到 deadline

```bash
node bin/index.js
   --csv [csv path]
   --deadline 2019-01-03
   --TRELLO_APP_KEY [app key]
   --TRELLO_USER_TOKEN [user token]
   --board [board name]
```
