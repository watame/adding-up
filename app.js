"use strict";
// CSV読み込み用モジュールの呼出
const fs = require("fs");
const readline = require("readline");
// ストリームの展開
const rs = fs.createReadStream("./popu-pref.csv");
// 展開したストリームをInputとして設定
const rl = readline.createInterface({ input: rs, output: {} });
// 集計用の連想配列 key:都道府県 value:集計データのオブジェクト
const prefectureDataMap = new Map();
// line というイベント（改行までストリームが進んだら発火するイベント）が発生したら、無名関数を呼び出す
// (lineString) => {} という形式で呼出しを行い、読み込んだ文字列が`lineString`として取得できる
rl.on("line", (lineString) => {
  // カンマで情報を分割し、配列に代入
  const columns = lineString.split(",");
  // 各種データを型変換して保持
  const year = parseInt(columns[0]);
  const prefecture = columns[1];
  const popu = parseInt(columns[3]);
  // 2010年と2015年のみデータを表示する
  if (year === 2010 || year === 2015) {
    // 登録済キーの値を取得
    let value = prefectureDataMap.get(prefecture);
    // 登録されていない値(undefinedはfalsyなので、false条件に入る)の場合は、オブジェクトを作成する
    if (!value) {
      value = {
        popu10: 0, // 2010年人口
        popu15: 0, // 2015年人口
        change: null, // 変化率（データ取得ループ内ではNULL）
      };
    }
    // 2010年と2015年とでvalueに格納する値を変更する
    if (year === 2010) {
      value.popu10 = popu;
    }
    if (year === 2015) {
      value.popu15 = popu;
    }
    prefectureDataMap.set(prefecture, value);
  }
});

// クローズイベントの設定
rl.on("close", () => {
  // Map, Array の中身を of の直前の [] に定義された変数に代入してforループができる
  // 配列の要素のみを利用したい場合に便利
  // Mapに for-of 構文を利用すると、[第一引数：key, 第二引数：value]の形式で値が取得できる
  for (let [key, value] of prefectureDataMap) {
    // 2010 -> 2015 の人口数の変化率を求める
    value.change = value.popu15 / value.popu10;
  }
  // データの並び替えを行う
  // 1. 連想配列を配列に変換 [[key, value], [key, value], ...] のような形式の配列になる
  // 2. sort内で無名関数で比較関数を呼ぶ
  //    比較関数：2つの引数を受け取り以下の挙動を選択する
  //             pair1がpair2よりも前になる：負の値
  //             pair2がpair1よりも前になる：正の値
  //             pair1がpair2の並びがそのまま：0
  const rankingArray = Array.from(prefectureDataMap).sort((pair1, pair2) => {
    // 降順に並べたいので、pair2の変化率 - pair1変化率が正の値を返せば並び替えを行う条件を指定
    return pair2[1].change - pair1[1].change;
  });
  // 配列の入れ子は読みにくいので整形
  // map関数を使用し、Arrayの要素それぞれを与えられた関数を適用した内容に変換した配列を作成
  const rankingStrings = rankingArray.map(([key, value]) => {
    return (
      key + ":" + value.popu10 + "=>" + value.popu15 + "変化率" + value.change
    );
  });
  console.log(rankingStrings);
});
