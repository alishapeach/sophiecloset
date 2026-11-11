/* ---------------------------------------------------------------------------
   /api/closet: the closet's memory.

   POST { password }          -> 200 { state }  the whole closet, or 401
   PUT  { password, state }   -> 200 { ok }     overwrite the stored closet

   The image list lives in Netlify Blobs, not in the published HTML, so a
   stranger who loads the site sees a door and nothing else. The password is
   read from the CLOSET_PASSWORD environment variable.
--------------------------------------------------------------------------- */

import { getStore } from '@netlify/blobs';

/* First-run contents of the closet. Only read when the store is empty; after
   your first Save on the live site the stored copy wins and this is ignored. */
const SEED = {
  "images": [
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554029/fioershaa2wvaub7ejl8.png",
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554028/mczje5ykvttrw9u6ukgu.png",
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554027/nu2b0aypwddc8aiithbl.png",
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554026/nzm4qjbdippqftonkd54.png",
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554024/hib2z9yisfv3v9m4ppwt.png",
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554024/gh9kidpd4io8miovqipv.png",
    "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554023/yr7rhirixp3przmccvsb.png"
  ],
  "vault": [],
  "tags": {
    "Nekkie": [
      "https://res.cloudinary.com/fqvox4tn/image/upload/v1786554027/nu2b0aypwddc8aiithbl.png"
    ],
    "Hidden": []
  },
  "labels": {},
  "name": "Sophie",
  "mouseover": ""
};

const STORE = 'sophies-closet';
const KEY = 'state';

// Set CLOSET_PASSWORD in Netlify -> Site configuration -> Environment variables.
// The fallback is Sophie's password, so a fresh deploy works before you have
// set anything up.
const PASSWORD = process.env.CLOSET_PASSWORD || 'goldengirl!';

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
function matches(given) {
  const a = String(given ?? '');
  const b = PASSWORD;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Keep only the six fields the closet actually uses, and only in the right
   shapes; a malformed PUT should never be able to wedge the store. */
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

  if (!matches(body.password)) return json({ error: 'nope' }, 401);

  let store;
  try {
    store = getStore(STORE);
  } catch (err) {
    return json({ error: 'storage unavailable: ' + err.message }, 503);
  }

  if (req.method === 'POST') {
    try {
      const saved = await store.get(KEY, { type: 'json' });
      // Nothing saved yet means this is the first visit: hand over the seed.
      return json({ state: saved ? clean(saved) : clean(SEED), seeded: !saved });
    } catch (err) {
      return json({ error: 'could not read the closet: ' + err.message }, 503);
    }
  }

  if (req.method === 'PUT') {
    const state = clean(body.state);
    if (!state.images.length && !state.vault.length) {
      // Refusing an empty write protects against a half-loaded page wiping it.
      return json({ error: 'refusing to save an empty closet' }, 400);
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
