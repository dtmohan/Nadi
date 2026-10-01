import fs from "fs";
const suite = JSON.parse(fs.readFileSync("/home/user/workspace/nadi-validation-suite.json", "utf8"));
const charts: any[] = Array.isArray(suite) ? suite : suite.charts;
fs.writeFileSync("/tmp/qa-charts.json", JSON.stringify(charts));
console.log("written", charts.length, "charts");
