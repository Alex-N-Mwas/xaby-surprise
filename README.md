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
