# NextMe-800

Approved Air-style paper website with the Cinema video atlas, an English research story, a three-level interactive behavior tree, and the NextMe-800 arXiv preprint PDF. Static HTML/CSS/JS for GitHub Pages.

130 selected moments: 130 verified source-frame video previews, 0 still photographs. Source footage sampled at 1 Hz; previews play at 3x. Sound is enabled only for available aligned anonymized audio. Captions refer to selected activities; images are curated for diversity, not unbiased duration sampling.

Serve locally with `python3 -m http.server 8766`.

Small 160px posters load first; visible tiles animate as compact 96px GIFs. After images load, up to three nearby 640px videos are prefetched with low priority. Hover playback is 3x; original source sampling is 1 Hz, so motion is sparse rather than native high-frame-rate footage.

When available, gaze is matched by exact source frame filename and projected through the same crop. Green points and yellow trails are approximate recorded gaze, not inferred attention. Missing or invalid gaze is omitted.

Recovered nearby previews contain the 15 nearest indexed source frames within 60 seconds of the selected moment, in chronological order, including the SHA-256 verified center frame. Gaps are compressed, so 3x denotes preview playback rate, not a claim of uniform real-world elapsed time for sparse sequences. These clips are silent to avoid mismatched audio.

Official website: https://kkkkawayi.github.io/nextme-800/

Paper: [NextMe-800 arXiv preprint](NextMe-800_arXiv_preprint.pdf). The PDF is an unchanged copy of the author-approved 24-page preprint (SHA-256 `7d9d73a78e197ba3ac050f6bcc8453ada35e35014b8afac981dabea8904eca67`).

The selected story and source are maintained in the sibling `apple-review/` directory. `build.py` uses a preserved `atlas-base.html` and content-hashed CSS/JS URLs; production `index.html` omits local design-review controls. Recorded tree nodes are blue, previous-evening possibilities gold, and illustrative alternatives green. Drag or use a trackpad to pan; click a node to center it and reveal its direct children; zoom and fit controls provide an overview.
