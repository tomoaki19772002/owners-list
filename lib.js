const NAR = "https://www.nar.winkeiba.jp"; // 地方競馬
const JRA = "https://www.winkeiba.jp"; // 中央競馬
const OWNERS = [
  { cd: "伊藤　彰敏" },
  { cd: "服部　知明" },
  { cd: "池山　慎吾" },
  { cd: "高井　孝二" },
  { cd: "松井　好友" },
  { cd: "梅ケ枝　容晃" },
  { cd: "伊藤　弘泰" },
  { cd: "小澤　徳定" },
  { cd: "335886", base: JRA, kind: "JRA" },
];

const text = s => s.replace(/<br[^>]*>/g, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function parse(html, cd, base, kind) {
  const name = text((html.match(/<h2 class="title"[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || cd);
  const stat = label => text((html.match(new RegExp("<th[^>]*>" + label + "</th><td[^>]*>([\\s\\S]*?)</td>")) || [])[1] || "");
  const asOf = text((html.match(/成績集計[\s\S]*?現在/) || [""])[0]);
  const groups = [];
  for (const blk of html.split('<li class="item -nopad"').slice(1)) {
    const title = text((blk.match(/<div class="title"[^>]*>([\s\S]*?)<\/div><\/div>/) || [])[1] || "");
    const rows = [];
    for (const tr of blk.match(/<tr class="list-news"[\s\S]*?<\/tr>/g) || []) {
      const td = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
      if (td.length < 5) continue;
      const [rt, ra, hs, od, fn] = td;
      const odds = parseFloat((text(od).match(/([\d.]+)倍/) || [])[1]);
      rows.push({
        race: text(rt.split(/<br[^>]*>/)[0]),
        time: text(rt.split(/<br[^>]*>/)[1] || ""),
        raceName: text(ra),
        horse: text(hs),
        odds: isNaN(odds) ? null : odds,
        pop: parseInt((text(od).match(/(\d+)人気/) || [])[1]) || null,
        result: text(fn),
        raceUrl: base + ((ra.match(/href="([^"]+)"/) || [])[1] || ""),
      });
    }
    groups.push({ title, rows });
  }
  return {
    name, cd, kind, url: `${base}/data/owner?HorseOwnerCd=${encodeURIComponent(cd)}`,
    wins: stat("本年勝利"), prize: stat("本年度獲得賞金"), total: stat("通算成績"), asOf, groups,
  };
}

async function fetchOwner({ cd, base = NAR, kind = "地方" }) {
  const url = `${base}/data/owner?HorseOwnerCd=${encodeURIComponent(cd)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const o = parse(html, cd, base, kind);
    o.http = { status: res.status, len: html.length };
    return o;
  } catch (e) {
    return { name: cd, cd, kind, url, error: String(e), groups: [] };
  }
}

async function fetchAll() {
  // 並列取得だとサイト側で別人のページが返ることがあるため順番に取得
  const owners = [];
  for (const o of OWNERS) owners.push(await fetchOwner(o));
  return { fetchedAt: new Date().toISOString(), owners };
}

module.exports = { fetchAll };
