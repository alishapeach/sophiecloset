# Sophie's Closet: Netlify build (v3.1)

The closet app, hosted. Save writes to the site, so a change on your
laptop is there on your phone and a refresh doesn't lose it.

This replaces the single `sophies-closet.html` file. Keep that file somewhere
as a backup; the site doesn't need it.

---

## Putting it online

1. **Make a repo.** On GitHub: New repository, name it whatever you like, keep
   it private. Then Add file → Upload files and drag in everything from this
   folder: the `public` folder, the `netlify` folder, `netlify.toml`,
   `package.json`, `.gitignore` and this README. Commit.
2. **Import it in Netlify.** Add new project → Import an existing project →
   GitHub → pick the repo. The settings come from `netlify.toml`, but check
   them before you deploy: **Publish directory** `public`, **Build command**
   `npm install`. Deploy.
3. **Password.** It's `goldengirl!` out of the box. To change it later, see below.

## Then check it worked

Open `your-site.netlify.app/.netlify/functions/closet` in a browser.

- Short JSON mentioning `expected JSON` → working. That error is just a plain
  browser visit not being the request the function wants.
- 404 → something's off; check the deploy log in Netlify.

Then open the site itself and try the door.

## Set your own password

Site configuration → Environment variables → Add a variable.
Key `CLOSET_PASSWORD`, value whatever you want. Save, then Deploys → Trigger
deploy. This overrides `goldengirl!`, so leave it unset to keep that one.

The password is case-sensitive: `goldengirl!` works, `GoldenGirl!` doesn't.

## How it works

| | Old file | Now |
|---|---|---|
| Image list | baked into the HTML | in Netlify Blobs, behind the password |
| Password | in the HTML, readable via View Source | env var, checked server-side |
| Save | downloaded a file to re-upload | writes to the site |

The door calls `/api/closet` with what you typed. Wrong password, the function
returns 401 and sends nothing. Right password, it returns the closet. Save sends
it back. First visit falls back to the copy baked into the function (Sophie's 7
images and the Nekkie tag); after your first Save the stored version takes over.

New since the old file:

- **Stash**: a second shelf. Its images are kept but carry no name tag.
- **Hidden** tag: anything in it stays out of All.
- **Custom order**: ⇅ cycles Custom, Newest, Oldest. In Edit, select images
  and move them with ↑ ↓.
- **Rename**: click an image and type over its name. Search looks at names
  and tags.
- **Name**: edit the name tag in both post codes from Edit mode.
- **URL uploads** retry through the browser when a site blocks Cloudinary.

Upload, Share, Backup, tags and Mouseover work as before, and uploads still go
to Cloudinary with the two unsigned presets (`closet` and `shares`).

If a save can't reach the site the app downloads a baked copy instead and says
so, so a save is never silently dropped.

## Worth knowing

- One shared password, not accounts. Anyone with the URL and the password gets
  everything.
- The Cloudinary image URLs are public on their own, as they always were. The
  *list* is private now; a single leaked URL still opens.
- `robots.txt` and noindex headers keep search engines out. That isn't the same
  as keeping out someone with the link.
- Netlify's site-wide password is a paid feature. The app's own door is free.
- Use the Backup button occasionally. It zips every image on the current shelf
  plus a URL list.

## Files

```
public/index.html                the app, with no image list or password in it
public/robots.txt                keeps search engines out
netlify.toml                     publish dir, build command, redirect, headers
netlify/functions/closet.mjs     password check, read/write, seed copy
package.json                     the one dependency
.gitignore                       keeps node_modules out of the repo
```
