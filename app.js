/* ============================================================
   科创8班 · 门户
   现在只做一件事：填「本周热搜」的条数，顺带走那口钟。
   取不到就留「—」——门面不能因为数据库抽风而变丑，也不能说谎。
   ============================================================ */

(function () {
  "use strict";

  /* 跟 class-hotsearch / liuyu 同一个库。这两个值本来就随网页公开，
     权限由数据库那边的 RLS 和函数管，不靠这里保密。 */
  var CFG = {
    url: "https://jjyospedfdctgjhmhnex.supabase.co",
    key: "sb_publishable_3Hj8gpHOwqcEAozNka_kFQ_GYgxyDOV"
  };

  function get(path) {
    /* 用 limit=1000 + 数数组长度，而不是靠 Content-Range 头：
       跨域下响应头不一定暴露给前端，数数组永远拿得到。
       ⚠️ PostgREST 默认上限也是 1000，超了就数不准，所以对外显示 1000+。 */
    return fetch(CFG.url + "/rest/v1/" + path, {
      headers: {
        apikey: CFG.key,
        Authorization: "Bearer " + CFG.key
      }
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (rows) {
      return Array.isArray(rows) ? rows : null;
    }).catch(function () {
      return null;
    });
  }

  function fill(name, text) {
    var el = document.querySelector('[data-count="' + name + '"]');
    if (el && text) el.textContent = text;
  }

  /* ---------- 本周的第一天（周一） ----------
     ⚠️ 必须和 class-hotsearch 里的 weekStartOf() 是同一套口径（周一开头），
        否则门户说 4 条、点进去榜单显示 3 条，看着像坏了。
     ⚠️ 用本地时区现算，不依赖任何接口；day 字段是 "YYYY-MM-DD" 纯日期串，
        直接按字符串比大小就是按日期比（"2026-10-19" <= "2026-10-20"）。 */
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function weekStart() {
    var d = new Date();
    var back = (d.getDay() + 6) % 7;          /* 周日 getDay()=0 → back=6；周一 → 0 */
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
    return m.getFullYear() + "-" + pad(m.getMonth() + 1) + "-" + pad(m.getDate());
  }

  /* 热搜榜要的是「本周几条」，不是「一共几条」——卡片上写的是 THIS WEEK。 */
  get("hot_items?select=day&limit=1000").then(function (rows) {
    if (!rows) return;
    if (rows.length >= 1000) { fill("hot", "1000+"); return; }
    var from = weekStart();
    var n = 0;
    for (var i = 0; i < rows.length; i++) {
      var day = String(rows[i] && rows[i].day || "").slice(0, 10);
      if (day && day >= from) n++;
    }
    fill("hot", String(n));
  });

  /* 附中语录的卡片暂时标「施工中」、数字也撤了，所以这里不再拉 ly_quotes。
     等它挂回首页时，把下面这段恢复就行：
       get("ly_quotes?select=id&limit=1000").then(rows => fill("ly", ...)) */

  /* ---------- 右上角那口钟 ---------- */

  function tick() {
    var el = document.getElementById("clock");
    if (!el) return;
    var d = new Date();
    el.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  tick();
  setInterval(tick, 1000);

})();
