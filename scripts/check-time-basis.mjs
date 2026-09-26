// Regression check for the birth-time basis: run against a server on port 5000.
// Einstein: 14 Mar 1879 11:30 Ulm. Before standard time; the birthplace's mean time (+0:39:57) must apply, not Berlin's (+0:53:28).
// Gandhi: 2 Oct 1869 07:12 Porbandar. Local mean time +4:38:31, not Howrah's +5:53:20; the accepted lagna is Libra.
const cases = [
  { name: "Einstein", birthDate: "1879-03-14", birthTime: "11:30", timezone: "Europe/Berlin", latitude: 48.4011, longitude: 9.9876, utc: "1879-03-14T10:50:03.000Z", sign: 2 },
  { name: "Gandhi", birthDate: "1869-10-02", birthTime: "07:12", timezone: "Asia/Kolkata", latitude: 21.6417, longitude: 69.6293, utc: "1869-10-02T02:33:29.000Z", sign: 6 },
  { name: "Modern IST", birthDate: "1973-04-24", birthTime: "13:00", timezone: "Asia/Kolkata", latitude: 18.967, longitude: 72.833, utc: "1973-04-24T07:30:00.000Z", sign: 3 },
];
let failed = 0;
for (const c of cases) {
  const body = { ...c, gender: "male", place: c.name, ayanamsa: "lahiri", nodeType: "mean", notes: "", events: [] };
  const r = await fetch("http://localhost:5000/api/compute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  const sign = Math.floor(d.jaimini.lagna.lon / 30);
  const ok = d.utc === c.utc && sign === c.sign;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.name}: utc ${d.utc} (want ${c.utc}), lagna sign ${sign} (want ${c.sign}), ${d.timeBasis.label}`);
}
process.exit(failed ? 1 : 0);
