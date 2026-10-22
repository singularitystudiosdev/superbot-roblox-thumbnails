// A billing address's fields (Billing's Edit billing address and Add payment method, settings-pay.8a3994ee.js), as
// Stripe's address form lays them out: full name, country or region, two address lines, city, then the state and its
// ZIP side by side. The state is a list where the country has one (the US, Canada), a free field elsewhere, and the
// postal code is named and checked as that country names and writes it.
import { esc } from './parts.bdeb2397.js';

// ISO 3166-1 codes a US company bills to (Cuba, Iran, North Korea and Syria are left out, as US sanctions keep them off
// such lists); named in English by the browser, so no name is spelt here
const CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IS IT JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const named = new Intl.DisplayNames(['en'], { type: 'region' });
export const countryName = (code) => named.of(code);
const COUNTRIES = CODES.map((code) => [code, countryName(code)]).sort((a, b) => a[1].localeCompare(b[1]));

// the countries whose state is picked from a list, with what they call it and their postal code, and its pattern
const REGIONS = {
  US: {
    label: 'State',
    postal: 'ZIP code',
    pattern: /^\d{5}(-\d{4})?$/,
    example: '80202',
    list: 'AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|DC District of Columbia|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|PA Pennsylvania|PR Puerto Rico|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming',
  },
  CA: {
    label: 'Province',
    postal: 'Postal code',
    pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
    example: 'M5V 2T6',
    list: 'AB Alberta|BC British Columbia|MB Manitoba|NB New Brunswick|NL Newfoundland and Labrador|NS Nova Scotia|NT Northwest Territories|NU Nunavut|ON Ontario|PE Prince Edward Island|QC Quebec|SK Saskatchewan|YT Yukon',
  },
};
const regionsOf = (country) => REGIONS[country]?.list.split('|').map((r) => [r.slice(0, 2), r.slice(3)]);

// `id` keeps two forms' fields apart (both modals are in the page at once)
export const addressHTML = (id) => `<div class="st-addr-fields">
    <label class="st-field st-wide"><span class="st-field-l">Full name</span><input name="fullName" autocomplete="billing name" maxlength="80"></label>
    <label class="st-field st-wide"><span class="st-field-l">Country or region</span><select name="country" autocomplete="billing country">${COUNTRIES.map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('')}</select></label>
    <label class="st-field st-wide"><span class="st-field-l">Address line 1</span><input name="line1" autocomplete="billing address-line1" maxlength="100"></label>
    <label class="st-field st-wide"><span class="st-field-l">Address line 2</span><input name="line2" autocomplete="billing address-line2" maxlength="100" placeholder="Apt., suite, unit number, etc. (optional)"></label>
    <label class="st-field st-wide"><span class="st-field-l">City</span><input name="city" autocomplete="billing address-level2" maxlength="60"></label>
    <label class="st-field"><span class="st-field-l" id="${id}-region-l"></span><span class="st-region"></span></label>
    <label class="st-field"><span class="st-field-l" id="${id}-postal-l"></span><input name="postal" autocomplete="billing postal-code" maxlength="12"></label>
  </div>`;

// the state field as the country has it: its list (a placeholder first, so none is picked for you) or a free field
function paintRegion(root, country, value = '') {
  const r = REGIONS[country], slot = root.querySelector('.st-region'), label = root.querySelector('[id$="-region-l"]');
  label.textContent = r ? r.label : 'State, county or region';
  root.querySelector('[id$="-postal-l"]').textContent = r ? r.postal : 'Postal code';
  slot.innerHTML = r
    ? `<select name="region" autocomplete="billing address-level1" aria-labelledby="${label.id}"><option value="">Select</option>${regionsOf(country).map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join('')}</select>`
    : `<input name="region" autocomplete="billing address-level1" maxlength="60" placeholder="Optional" aria-labelledby="${label.id}">`;
  slot.firstChild.value = value;
}

// `root` holds addressHTML's fields; the state follows the country picked
export function wireAddress(root) {
  // the full name's field is fullName, so Profile's name stays the one `name` field in Settings
  const field = (key) => root.querySelector(`[name="${key === 'name' ? 'fullName' : key}"]`);
  field('country').addEventListener('change', () => paintRegion(root, field('country').value));
  return {
    fill(a) {
      for (const n of ['name', 'line1', 'line2', 'city', 'postal']) field(n).value = a[n] ?? '';
      field('country').value = a.country;
      paintRegion(root, a.country, a.region);
    },
    // { address } when every field it needs reads right, else { error, field } naming the first that does not
    read() {
      const v = Object.fromEntries(['name', 'country', 'line1', 'line2', 'city', 'region', 'postal'].map((n) => [n, field(n).value.trim()]));
      const r = REGIONS[v.country];
      if (!v.name) return { error: 'Enter the name on the account or card.', field: field('name') };
      if (!v.line1) return { error: 'Enter the street address.', field: field('line1') };
      if (!v.city) return { error: 'Enter the city.', field: field('city') };
      if (r && !v.region) return { error: `Select a ${r.label.toLowerCase()}.`, field: field('region') };
      if (r && !r.pattern.test(v.postal)) return { error: `Enter a ${r.postal}, like ${r.example}.`, field: field('postal') };
      if (v.country === 'CA') v.postal = v.postal.toUpperCase().replace(/^(\w{3}) ?(\w{3})$/, '$1 $2');
      return { address: v };
    },
  };
}

// the address as lines to show: the name, the street, the city with its state and code, the country
export function addressLines(a) {
  const place = [a.city, [a.region, a.postal].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [a.name, [a.line1, a.line2].filter(Boolean).join(', '), place, countryName(a.country)];
}
