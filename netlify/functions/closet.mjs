/* ---------------------------------------------------------------------------
   /api/closet, the memory behind Sophie's door.

   POST { closet, password }          -> 200 { state, cloud }  that closet, or 401
   PUT  { closet, password, state }   -> 200 { ok }            overwrite that closet

   `closet` is "sophie". Her closet lives in its own Netlify Blobs store. The
   image list lives here, not in the published HTML, so a stranger who loads
   the site sees the room and nothing else.

   The password comes from a Netlify environment variable only (README,
   section 2). Her Cloudinary cloud name is written in below; an environment
   variable can override it. The closet starts empty.
--------------------------------------------------------------------------- */

import { getStore } from '@netlify/blobs';

/* SETUP, one entry per door (here, just hers). The key must match the key in
   SITES at the top of the script in public/index.html.

   store     Netlify Blobs store name. Unique per closet.
   env       Environment variable holding that closet's password.
   cloudEnv  Environment variable that can override its Cloudinary cloud name.
   cloud     Its Cloudinary cloud name, used when that variable isn't set.
   shared    (unused here) for a piece opened by other closets' passwords.
   cloudFrom (unused here) whose Cloudinary account a shared piece uploads to.
   name      The name tag a brand-new closet starts with. */
const CLOSETS = {
  sophie: {
    store: 'sophie-closet',
    env: 'SOPHIE_PASSWORD',
    cloudEnv: 'SOPHIE_CLOUDINARY',
    cloud: 'dqmtjtppa',
    name: 'Sophie'
  }
};

const KEY = 'state';

/* Leave this true. Set it to false only to test locally with the doors open;
   nothing should ever be deployed with it false. */
const REQUIRE_PASSWORDS = true;

// A brand-new closet: empty, carrying only its name tag.
const seedFor = c => ({ images: [], vault: [], tags: {}, labels: {}, name: c.name, mouseover: '' });

// Every password that opens closet c: its own, or for a shared piece each
// owner's. Unset variables are skipped, so a missing one never opens anything.
const passwordsFor = c => (c.shared ? c.shared.map(k => CLOSETS[k]) : [c])
  .map(o => process.env[o.env])
  .filter(pw => typeof pw === 'string' && pw.length > 0);

const cloudFor = c => { const o = c.cloudFrom ? CLOSETS[c.cloudFrom] : c; return process.env[o.cloudEnv] || o.cloud || ''; };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });

/* Compare in constant time so the response time can't be used to guess the
   password one character at a time. */
function matches(given, expected) {
  const a = String(given ?? '');
  const b = String(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Keep only the six fields a closet actually uses, and only in the right
   shapes, so a malformed PUT can never wedge the store. */
function clean(state) {
  const s = state && typeof state === 'object' ? state : {};
  const urls = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
  const map  = v => {
    const out = {};
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k, val] of Object.entries(v)) out[k] = val;
    }
    return out;
  };
  const tags = {};
  for (const [k, v] of Object.entries(map(s.tags))) tags[k] = urls(v);
  const labels = {};
  for (const [k, v] of Object.entries(map(s.labels))) {
    if (typeof v === 'string') labels[k] = v;
  }
  return {
    images: urls(s.images),
    vault: urls(s.vault),
    tags,
    labels,
    name: typeof s.name === 'string' ? s.name : '',
    mouseover: typeof s.mouseover === 'string' ? s.mouseover : ''
  };
}


export default async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'expected JSON' }, 400);
  }

  // Own keys only, so "constructor" or "__proto__" can't pass as a closet.
  const which = typeof body.closet === 'string' ? body.closet : '';
  const closet = Object.prototype.hasOwnProperty.call(CLOSETS, which) ? CLOSETS[which] : null;
  if (!closet) return json({ error: 'unknown closet' }, 400);

  if (REQUIRE_PASSWORDS) {
    const pws = passwordsFor(closet);
    // No password set in Netlify yet: keep the door shut and say why.
    if (!pws.length) return json({ error: 'no password set', unset: true }, 503);
    if (!pws.some(pw => matches(body.password, pw))) return json({ error: 'nope' }, 401);
  }

  let store;
  try {
    store = getStore(closet.store);
  } catch (err) {
    return json({ error: 'storage unavailable: ' + err.message }, 503);
  }

  if (req.method === 'POST') {
    try {
      const saved = await store.get(KEY, { type: 'json' });
      // Nothing saved yet means a brand-new closet.
      return json({ state: saved ? clean(saved) : clean(seedFor(closet)), seeded: !saved, cloud: cloudFor(closet) });
    } catch (err) {
      return json({ error: 'could not read the closet: ' + err.message }, 503);
    }
  }

  if (req.method === 'PUT') {
    const state = clean(body.state);
    if (!state.images.length && !state.vault.length) {
      /* Refusing an empty write protects against a half-loaded page wiping a
         full closet. It only applies when there is something to lose: on a
         brand new closet, saving a name before the first upload is fine. */
      let existing = null;
      try { existing = await store.get(KEY, { type: 'json' }); } catch { /* treat as empty */ }
      const had = existing &&
        ((Array.isArray(existing.images) && existing.images.length) ||
         (Array.isArray(existing.vault)  && existing.vault.length));
      if (had) return json({ error: 'refusing to save an empty closet' }, 400);
    }
    try {
      await store.setJSON(KEY, state);
      return json({ ok: true, images: state.images.length, vault: state.vault.length });
    } catch (err) {
      return json({ error: 'could not write the closet: ' + err.message }, 503);
    }
  }

  return json({ error: 'method not allowed' }, 405);
};
