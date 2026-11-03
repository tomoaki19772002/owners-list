// data.json を更新する（GitHub Actions から定期実行）
const fs = require("fs");
const { fetchAll } = require("./lib");

fetchAll().then(d => {
  const ok = d.owners.filter(o => o.http && o.http.status === 200).length;
  console.log(`取得成功 ${ok}/${d.owners.length}`);
  if (ok === 0) { console.error("すべて失敗（アクセス拒否の可能性）"); process.exit(1); }
  fs.writeFileSync("data.json", JSON.stringify(d));
});
