# AGENTS.md: light-dial

Notes for coding agents adding `<light-dial>` to a project.

## What it is

`<light-dial>` is a framework-free Web Component (one ES module, no dependencies, MIT) for the light of a scene. It shows a lamp that goes round an object, plus two number fields, and reports where the light comes from (`angle`) and how strong it is (`intensity`). It lights nothing by itself: listen to its events and drive a three.js light, a CSS shadow, a gradient, anything. Demo: https://likemiens.com/ui/light-dial

## Install

- CDN, pinned: `<script type="module" src="https://cdn.jsdelivr.net/gh/Likemiens/light-dial@v1.0.0/light-dial.js"></script>`
- Always the latest: `https://likemiens.com/ui/light-dial/light-dial.js` (CORS open). Pin a tag for production.
- npm: `npm install github:Likemiens/light-dial`, then `import "light-dial"`. Types: `light-dial.d.ts`.
- Vendored: copy `light-dial.js` (and `light-dial.d.ts`) into the project and import it as a module.

## Contract

| Attribute / property | Type, range | Default | Notes |
|---|---|---|---|
| `angle` | number, −180…180 | `0` | 0 = light in front of the object (camera side), 90 = on its right, ±180 = behind. Any number folds in: 270 → −90 |
| `intensity` | number, 0…150 (%) | `80` | 0 = lamp off. A value out of range shows an error; `value` and events hold it at the edge |
| `label` | string | `"Light"` (`"Свет"` in ru) | the visible name |
| `disabled` | boolean | `false` | dimmed, ignores input |
| `lang` | `en` or `ru` | nearest `[lang]` | screen-reader texts and the default label |
| `state` | `hover`, `drag`, `focus`, `typing` | none | fakes a look for previews; leave unset in real UI |
| `value` (read-only) | `{ angle, intensity }` | | what the events carry |

- Events: `input` while the light moves (drag, wheel, keys, typing); `change` when a gesture ends (release, a key step, a field left, 200 ms after the wheel stops). Both are `CustomEvent<{ angle, intensity }>`, bubbling and composed. Setting attributes or properties from code fires nothing.
- CSS custom properties, set on the element itself: `--ld-lamp`, `--ld-lamp-fill`, `--ld-beam`, `--ld-focus`, `--ld-ink`, `--ld-title`, `--ld-surface`, `--ld-surface-hover`, `--ld-line`, `--ld-line-hover`, `--ld-error`. `--ld-speed` (default 1) scales transition times and inherits from parents. Parts: `base`, `label`, `dial`, `field`.
- Keyboard on the dial (`role="slider"`): arrows ±5° (Shift ±15°), Page Up/Down ±45°, Home −180°, End 180°. In a field: ↑/↓ ±1 (Shift ±10), Enter applies, Esc restores. Pointer: drag the lamp (Shift snaps to 15°), press elsewhere on the dial to put it there, wheel 5° per 100 px.
- Exports: `LightDial` (the class) and `wrapAngle(n)` (folds any angle into −180…180). The module defines `light-dial` once, only if it is not defined yet.

## Recipes

three.js: lights in a group round the object, the key light on +z (camera side).

```js
rig.rotation.y = THREE.MathUtils.degToRad(angle); // if the camera orbits, add its azimuth: Math.atan2(camera.position.x, camera.position.z)
key.intensity = base * (intensity / 80);          // 80 is the default, so `base` is your normal strength
```

CSS: a shadow that falls away from the lamp.

```js
const a = (angle * Math.PI) / 180, p = intensity / 100, l = 3 + 9 * p;
el.style.boxShadow = `${-Math.sin(a) * l}px ${-Math.cos(a) * l}px ${6 + 10 * p}px rgb(0 0 0 / ${0.3 * Math.min(p, 1)})`;
```

First paint: events fire only on user input. Read `dial.value` once the element is defined (`await customElements.whenDefined("light-dial")`), then listen to `input`.

## Gotchas

- It is an ES module: use `<script type="module">` or `import`. A classic `<script>` fails on `export`.
- SSR (Next.js, Nuxt, SvelteKit…): the module touches `document` and `HTMLElement` when it loads. Import it on the client only (`useEffect`, `onMounted`, `onMount`, a dynamic `import()`). Rendering the tag on the server is fine; it upgrades when the module runs.
- Vite: a file in `public/` can't be imported by a bare path in dev (`import("/light-dial.js")`). Vite appends `?import` and refuses it. Install the package and `import "light-dial"`, or import by a full URL: `import(/* @vite-ignore */ new URL("/light-dial.js", location.origin).href)`.
- React 19 passes `angle`, `intensity`, `label`, `disabled` and `state` to the element as properties. Listen with a ref and `addEventListener("input", …)` in an effect. React 18 and older set attributes only, and `disabled={false}` becomes `disabled="false"`, which still disables: pass `disabled={flag || undefined}`.
- TypeScript + JSX: add `"light-dial"` to `JSX.IntrinsicElements` yourself; the `.d.ts` types the DOM only.
- Until the module runs, the tag is an empty inline element. Reserve its room: `light-dial:not(:defined) { display: block; height: 56px; }` (64 px on touch screens).
- `--ld-*` colours go on `light-dial` itself: the element declares its own defaults, so values set on a parent don't reach it. `--ld-speed` is the exception.
- It needs at least 200 px of width: the label, the dial and the fields sit in one row.
- `lang` is read from the nearest `[lang]` when the element renders. If the page language changes at runtime, set `lang` on the element itself.

## Don't

- Don't listen to the inner fields or reach into the shadow DOM: their native events stay inside. Use the element's `input` and `change`.
- Don't read the `angle` or `intensity` attributes to learn where the user put the light; they are not updated. Use `event.detail` or `dial.value`.
- Don't leave `state` set in a real UI: it fakes hover, drag, focus or typing.
- Don't mirror the angle: 90 is the object's right as seen from the camera, the same way three.js turns `rotation.y`.
- Don't edit the module to restyle it: use `--ld-*` and `::part()`.
