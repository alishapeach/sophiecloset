# Sophie's Closet

A small Netlify site: a room with a one-door wardrobe in Sophie's blues. Her
password opens the door onto her image gallery. Images are hosted on
Cloudinary. The site keeps the list, tags and names.

This is a fresh closet. It starts empty and doesn't read anything from the old
Sophie's Closet site.

---

## 1. Deploy

1. Make a new GitHub repo. A private one is better.
2. Upload everything in this folder: `public`, `netlify`, `netlify.toml`,
   `package.json`, `.gitignore`, `README.md`.
3. In Netlify, import the repo. Set the publish directory to `public` and the
   build command to `npm install`. Deploy.

## 2. Password

In Netlify, go to Site configuration, then Environment variables. Add:

| Key | Value |
|---|---|
| `SOPHIE_PASSWORD` | Sophie's password |

Then go to Deploys and choose Trigger deploy.

- **The password** is matched exactly, capitals included.
- **Until it's set,** the door stays shut and says no password is set.
- **Cloudinary:** the cloud name is already in the code (`dqmtjtppa`). To
  point the closet at another account, add `SOPHIE_CLOUDINARY` with that cloud
  name.

## 3. Cloudinary presets

The account needs these two unsigned upload presets, under Settings, then
Upload, then Upload presets:

| Preset | Folder | Used by |
|---|---|---|
| `sophiecloset` | `sophiecloset` | Upload, into the closet |
| `sophieshares` | `sophieshares` | Share (quick links) and the Stash |

Uploads keep their filename as the image name. If that name is already taken,
the image gets a fresh ID and still shows the filename.

## 4. Check it worked

Open `your-site.netlify.app/.netlify/functions/closet` in a browser.

- **Short JSON mentioning `expected JSON`:** it's working. A plain browser
  visit just isn't the request the function wants.
- **A 404:** the publish directory is probably wrong. It should be `public`.

Then open the site, click the door and type the password.

## Post codes

The name tag is set in the app (Edit, then Name) and starts as `Sophie`. The
mouseover is set with Edit, then Mouseover.

```
Upstairs     [img title="..." height="380"]URL[/img][color #7DB0D9]Sophie[/color]
Underground  <IMG title="..." height=380 SRC="URL"><FONT COLOR=#7DB0D9>Sophie<BR></FONT>
Stash/Share  [img height="400"]URL[/img]   and   <IMG height=400 SRC=URL>
```

With no mouseover, the `title` part is left out.

## Links

- `your-site.netlify.app` shows the room.
- `#sophie` on the end of the address goes straight to the password.

## Worth knowing

- **One password,** not user accounts. Anyone with the address and the
  password gets everything.
- **Image links:** Cloudinary image URLs are public on their own. The list is
  what's private.
- **Search engines:** `robots.txt` and the noindex headers keep them out. That
  doesn't stop someone who has the link.
- **Backups:** use the Backup button now and then. It zips every image on the
  current shelf plus a plain URL list. Edit, then Restore loads a closet
  backup `.json` file.
- **Local testing:** `REQUIRE_PASSWORDS` in `netlify/functions/closet.mjs`
  stays `true`. Set it to `false` only to test with the door open, and never
  deploy it that way.

## What's in the app

- **Shelves:** the closet and the Stash, two separate shelves.
- **Tags:** All, plus a Hidden tag that All leaves out. An image can sit under
  any number of tags, and clicking it lists them.
- **Names and search:** every image has a name, and Search reads names and
  tags.
- **Sort:** Custom, Newest or Oldest.
- **Edit mode:** select several images to reorder, tag or delete them.
- **Buttons:** Upload, Share, Backup, Restore, Name and Mouseover. The `i`
  button explains each one.

## Files

```
public/index.html                the app; SITES holds her look, post codes and presets
public/robots.txt                keeps search engines out
netlify.toml                     publish dir, build command, redirect, headers
netlify/functions/closet.mjs     CLOSETS: password check, read and write
package.json                     the one dependency
.gitignore                       keeps node_modules out of the repo
```
