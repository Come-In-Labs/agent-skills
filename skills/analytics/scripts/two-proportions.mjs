// Compare two proportions, such as treatment vs holdout:
//   node two-proportions.mjs <hits_a> <n_a> <hits_b> <n_b>
// Prints both rates, the difference with a Newcombe 95% interval (Wilson-based,
// sound for small counts), a pooled two-sided z-test, and the smallest
// difference this sample detects with 80% power at alpha 0.05.

const [ha, na, hb, nb] = process.argv.slice(2).map(Number);
if (![ha, na, hb, nb].every(Number.isFinite) || na <= 0 || nb <= 0 || ha > na || hb > nb) {
  console.error("usage: node two-proportions.mjs <hits_a> <n_a> <hits_b> <n_b>");
  process.exit(1);
}

const Z95 = 1.959964;
const Z80 = 0.841621;

function wilson(hits, n) {
  const p = hits / n;
  const denom = 1 + (Z95 * Z95) / n;
  const centre = (p + (Z95 * Z95) / (2 * n)) / denom;
  const half = (Z95 * Math.sqrt((p * (1 - p)) / n + (Z95 * Z95) / (4 * n * n))) / denom;
  return [centre - half, centre + half];
}

// Abramowitz-Stegun 7.1.26, accurate to about 1e-7.
function normalCdf(x) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(x) / Math.SQRT2));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

const pa = ha / na;
const pb = hb / nb;
const diff = pa - pb;
const [la, ua] = wilson(ha, na);
const [lb, ub] = wilson(hb, nb);
const low = diff - Math.sqrt((pa - la) ** 2 + (ub - pb) ** 2);
const high = diff + Math.sqrt((ua - pa) ** 2 + (pb - lb) ** 2);

const pooled = (ha + hb) / (na + nb);
const se = Math.sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb));
const z = se > 0 ? diff / se : 0;
const p = 2 * (1 - normalCdf(Math.abs(z)));
const mde = (Z95 + Z80) * se;

const pct = (x) => `${(100 * x).toFixed(1)}%`;
const pp = (x) => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(1)} pp`;

console.log(`A: ${ha} of ${na} = ${pct(pa)}`);
console.log(`B: ${hb} of ${nb} = ${pct(pb)}`);
console.log(`difference A - B: ${pp(diff)} (95% interval ${pp(low)} to ${pp(high)})`);
console.log(`z = ${z.toFixed(2)}, two-sided p = ${p.toFixed(3)}`);
console.log(`smallest difference this sample detects (80% power): about ${pp(mde).replace("+", "")}`);
if (Math.min(ha, na - ha, hb, nb - hb) < 5) console.log("note: fewer than 5 in a cell, read the interval, not the p-value");
