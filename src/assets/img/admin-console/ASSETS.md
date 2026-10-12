# Admin console artwork

## Official brand files

Downloaded on 2026-10-12. All marks retain their official geometry and proportions. Apple uses the official monochrome shape in white on the dark background. Brand marks are bundled locally; no remote image requests are made by the admin app.

- Solana: https://solana.com/branding — https://solana.com/src/img/branding/solanaLogoMark.svg
- USDC: https://www.circle.com/pressroom — Token Logo/USDC Token.svg from https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/Pressroom/brandkit/logo-downloads/usdc.zip
- Google: https://developers.google.com/identity/branding-guidelines — https://developers.google.com/static/identity/images/g-logo.png
- Phantom: https://phantom.com/about — Phantom Logomark/Phantom-Icon-Purple.svg from the official Press Kit: https://sanity-proxy-v2.phantom.app/files/3nm6d03a/production/5e73f0ad2d621b5ed6ca3c66aad2b70686f8a00e.zip
- Apple: https://developer.apple.com/design/resources/ — https://developer.apple.com/apple-logo.svg

The brand names and artwork belong to their respective owners. These marks identify the actual asset or recorded sign-in provider; unknown providers display an em dash. The game’s Phantom sign-in is stored as `authProvider: wallet`; both `wallet` and explicit `phantom` render the official Phantom mark and label. A linked wallet does not override a recorded Google or Apple provider.

## Interface icons

The interface SVGs in icons/ were drawn for this console from the supplied client references. Shared CSS masks preserve crisp strokes and allow consistent blue, gold, green, red and purple treatments. Legacy icon names are mapped to the same local artwork, so secondary pages also use this set.

## Generated chip artwork

Files: fp-chip-stack-blue-v2.png, fp-chip-stack-green-v2.png, fp-chip-stack-red-v2.png, fp-chip-stack-purple-v2.png.

Created with the built-in image generation tool, with transparent backgrounds, using the following prompt template:

Use case: product-mockup. Asset type: small transparent-background poker chip product icon for a premium dark navy poker administration console. Render {composition}, {color} ceramic casino poker chips with evenly spaced bright white rectangular edge inlays and thin white edge rings. Three-quarter view, slightly above eye level; chunky, realistic polished 3D game inventory artwork matching an elegant casino UI. Compact horizontal silhouette centered in a square transparent canvas, fill 80 percent of canvas width and 60 percent height. Crisp clean edges, bright readable {color} faces, subtle highlights from top left, soft self-shading. No lettering, currency symbols, numbers, logo, ground plane, backdrop, surrounding glow, hands or other objects. Genuine transparent background, no checkerboard pixels.

Compositions: blue: one upright stack of eight chips and one short stack of three chips on its right; green: three stacks of chips, a taller center stack, medium left stack, short right stack; red: four stacks in a compact cluster, tallest stack at back left; purple: five stacks in a compact low cluster, tallest stack at back center.

Green cleanup prompt: Change only the surrounding green fog/glow: remove every trace of the surrounding green glow, haze, floor, shadow, and background, leaving only the exact three green-and-white chip stacks as a clean isolated cutout. Preserve the chips, count, colors, shape, texture, edge details, composition and highlights exactly. Fully transparent background all the way up to crisp chip edges.

Final green variant was edited from the blue transparent cutout using: Recolor ONLY the blue ceramic sections of these two poker-chip stacks to saturated emerald green. Keep every white stripe white, preserve the exact shapes, positions, lighting, composition, edges, and every transparent pixel of the source. Do not introduce glow, haze, shadow, floor, backdrop or any other objects. This is a strict color substitution from royal blue to emerald green, with the existing clean transparent background preserved exactly.

## Ring-game dialog

`ring-game-chip.svg` is a locally drawn vector emblem with a gold and ivory chip rim and a white spade, based on the supplied dialog reference. `icons/chevron-down.svg` is a local dropdown indicator. The live table preview reuses the existing `shark-table-preview.png` artwork with a darkened backdrop and a CSS felt surface.

`ring-table-generated-v2.png`: generated poker-table background, 2026-10-12. High three-quarter overhead dark emerald felt table, padded black stitched leather rail, subtle gold inlay and dim casino chairs. No baked-in text; the live table name, game type, stakes and buy-in remain HTML overlays. Replaces the CSS oval in the create/edit preview.
