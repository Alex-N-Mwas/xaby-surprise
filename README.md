# A little thing for Xaby

A passcode-protected, respectful breakup tribute from Erlex. It has a gentle opening, a heartfelt note, reasons cards, a private message, a no-wrong-answers quiz, and a warm closing. There are no on-page edit or upload controls.

## Run the site

```sh
npm.cmd start
```

Open [http://localhost:3000](http://localhost:3000). Enter the passcode set in `.env` after reading the notice. Successful, consented entries are counted in `opens.json`; only the count and timestamp are saved. A passcode does not verify who entered it.

## Add music and photos

- Put audio files in [music](music/). The site plays supported tracks in filename order after the opening button is tapped. If the folder has no supported tracks, it uses the built-in soft instrumental. See [music/README.md](music/README.md).
- Put image files in [photos](photos/). They appear automatically in the gallery, and the filename becomes the caption. See [photos/README.md](photos/README.md).
- Put transparent PNG, WebP, or AVIF artwork in [cutouts](cutouts/). The images fade and pop in near the sides as the visitor scrolls. See [cutouts/README.md](cutouts/README.md).

The page needs to be hosted online for Xaby to open it from another device. Use HTTPS and persistent storage for `opens.json` and the two media folders.

## Deploy on Netlify

This project includes a Netlify setup. It publishes only the stylesheet and browser script as public files. The page HTML is returned by a function after checking the session, and requests for photos, music, and cutouts are also checked by a function. The media folders are included in the function bundle, not the public site folder. The public GitHub repository still exposes the original media and page source, independently of the website's passcode.

1. Create a GitHub repository. This project is being pushed to a public repository, so committed source and media files will be publicly viewable and downloadable.
2. Import the repository in Netlify. The included `netlify.toml` sets the build command and functions.
3. In Netlify project environment variables, add `ACCESS_CODE` with the passcode and `ACCESS_SESSION_SECRET` with a long random value. Do not put these values in `netlify.toml` or commit them.
4. Deploy. The passcode session lasts 12 hours. Netlify rate-limits passcode submissions to five per IP every ten minutes. The successful-open count and timestamp are stored in Netlify Blobs.

Generate a session secret locally with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Netlify media responses are streamed through the authenticated function, which supports files up to Netlify's current 20 MB streamed-response limit. Visitors who can open a photo can still save or screenshot it.
