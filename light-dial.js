// <light-dial> — where the light comes from and how strong it is: https://likemiens.com/ui/light-dial
// The light control of Cubas as one ES module, no dependencies. MIT.
//
//   <script type="module" src="https://likemiens.com/ui/light-dial/light-dial.js"></script>
//   <light-dial angle="0" intensity="80"></light-dial>
//
// The dial is a view from above with the camera at the bottom: the square in the middle is the object, the lamp
// goes round it. 0° puts the lamp in front of the object, 90° on its right, ±180° behind it — the turn of a light
// rig round the vertical axis, anticlockwise from above, as three.js counts rotation.y.
// `input` comes while the light moves, `change` when a gesture ends; both carry { angle, intensity }.

const css = `
:host {
  --ld-ink: rgb(42 38 36 / 68%);
  --ld-title: rgb(42 38 36 / 58%);
  --ld-surface: rgb(255 255 255 / 48%);
  --ld-surface-hover: rgb(255 255 255 / 70%);
  --ld-line: rgb(55 49 46 / 4%);
  --ld-line-hover: rgb(55 49 46 / 12%);
  --ld-focus: rgb(12 117 241 / 72%);
  --ld-lamp: #3d8bf2;
  --ld-lamp-fill: #dceafd;
  --ld-beam: #3d8bf2;
  --ld-error: #d93036;
  --ld-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --ld-fast: calc(150ms / var(--ld-speed, 1));
  display: block;
  min-width: 200px;
  color: var(--ld-ink);
  font-weight: 500;
  -webkit-tap-highlight-color: transparent;
}
:host([hidden]) { display: none; }
* { box-sizing: border-box; }
.ld {
  display: grid;
  grid-template-columns: 50px 56px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  transition: opacity var(--ld-fast) ease-out;
}
.title { color: var(--ld-title); font-size: 12px; line-height: 1; letter-spacing: -0.1px; }
.dial {
  position: relative;
  width: 56px;
  height: 56px;
  border: 1px solid var(--ld-line);
  border-radius: 9px;
  background: var(--ld-surface);
  cursor: grab;
  outline: 2px solid transparent;
  outline-offset: 2px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition:
    border-color var(--ld-fast) ease-out,
    background-color var(--ld-fast) ease-out,
    outline-color var(--ld-fast) ease-out;
}
/* hover lightens the dial and its edge, without a shadow */
.dial:focus-visible,
.dial[data-dragging],
:host([state="hover"]) .dial,
:host([state="drag"]) .dial {
  border-color: var(--ld-line-hover);
  background: var(--ld-surface-hover);
}
@media (hover: hover) and (pointer: fine) {
  :host(:not([disabled])) .dial:hover { border-color: var(--ld-line-hover); background: var(--ld-surface-hover); }
  :host(:not([disabled])) .field:hover { border-color: rgb(55 49 46 / 10%); background: var(--ld-surface-hover); }
}
.dial:focus-visible, :host([state="focus"]) .dial { outline-color: var(--ld-focus); }
/* held, the dial keeps its size; only the cursor closes */
.dial[data-dragging], :host([state="drag"]) .dial { cursor: grabbing; }
svg { position: absolute; inset: -1px; width: 56px; height: 56px; overflow: visible; pointer-events: none; }
stop { stop-color: var(--ld-beam); }
.beam { transition: opacity var(--ld-fast) ease-out; }
.lamp path {
  stroke: var(--ld-lamp);
  stroke-width: 1.2;
  stroke-linejoin: round;
  transition: fill var(--ld-fast) ease-out, stroke var(--ld-fast) ease-out;
}
.body { fill: var(--ld-lamp-fill); }
.lens { fill: #fff; }
/* the square in the middle is the object seen from above */
.head { fill: rgb(255 255 255 / 76%); stroke: rgb(55 49 46 / 32%); stroke-width: 1; }
/* at 0% the lamp is switched off */
.ld[data-off] .lamp path { stroke: rgb(55 49 46 / 38%); }
.ld[data-off] .body, .ld[data-off] .lens { fill: rgb(255 255 255 / 40%); }
.values { display: grid; gap: 6px; min-width: 0; }
.field {
  position: relative;
  display: flex;
  align-items: center;
  height: 25px;
  min-width: 0;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: var(--ld-surface);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  outline: 2px solid transparent;
  outline-offset: 2px;
  cursor: text;
  transition:
    border-color var(--ld-fast) ease-out,
    background-color var(--ld-fast) ease-out,
    color var(--ld-fast) ease-out,
    outline-color var(--ld-fast) ease-out;
}
.field:focus-within, :host([state="typing"]) .field:last-child {
  border-color: rgb(55 49 46 / 10%);
  background: var(--ld-surface-hover);
  outline-color: var(--ld-focus);
}
.field[data-invalid] { border-color: rgb(217 48 54 / 45%); color: var(--ld-error); outline-color: transparent; }
.field[data-invalid]:focus-within, :host([state="typing"]) .field[data-invalid]:last-child { outline-color: rgb(217 48 54 / 55%); }
input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  color: inherit;
  background: transparent;
  font: inherit;
}
input::selection { background: rgb(12 117 241 / 22%); }
/* the allowed range, over a field that holds a number out of it */
.hint {
  position: absolute;
  right: -1px;
  bottom: calc(100% + 7px);
  padding: 4px 6px;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 0 0 1px rgb(217 48 54 / 22%);
  color: var(--ld-error);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  animation: hint calc(160ms / var(--ld-speed, 1)) var(--ld-ease) both;
}
.hint[hidden] { display: none; }
@keyframes hint { from { opacity: 0; transform: translateY(3px); } }
:host([disabled]) .ld { opacity: 0.5; }
:host([disabled]) .dial, :host([disabled]) .field { cursor: not-allowed; }
:host([disabled]) .lamp path { stroke: rgb(55 49 46 / 45%); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* fingers get the larger panel of Cubas, and 16px text, so that a field does not zoom the page */
@media (pointer: coarse) {
  .ld { grid-template-columns: 50px 64px minmax(0, 1fr); gap: 10px; }
  .dial, svg { width: 64px; height: 64px; }
  .dial { border-radius: 11px; }
  .field { height: 29px; padding: 0 10px; border-radius: 9px; font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  *, .ld { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
`;

const html = `
<div class="ld" part="base">
  <span class="title" part="label"></span>
  <div class="dial" part="dial" role="slider" tabindex="0" aria-valuemin="-180" aria-valuemax="180">
    <svg viewBox="-28 -28 56 56" aria-hidden="true">
      <defs>
        <linearGradient id="beam" x1="0" y1="15" x2="0" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-opacity="0.55" />
          <stop offset="1" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g class="turn">
        <path class="beam" d="M-4.6 15.4 L4.6 15.4 L9.5 3 L-9.5 3 Z" fill="url(#beam)" />
        <g class="lamp" transform="translate(0 19.5)">
          <path class="body" d="M-5.6 -1.6 C-5.6 2.6 -3.2 5.4 0 5.4 C3.2 5.4 5.6 2.6 5.6 -1.6 Z" />
          <path class="lens" d="M-5.6 -1.6 Q0 -4.6 5.6 -1.6 Z" />
        </g>
      </g>
      <rect class="head" x="-3.5" y="-3.5" width="7" height="7" rx="2" />
    </svg>
  </div>
  <div class="values">
    <label class="field" part="field">
      <span class="sr" data-text="angle"></span>
      <input name="angle" inputmode="numeric" autocomplete="off" spellcheck="false" />
      <span aria-hidden="true">°</span>
    </label>
    <label class="field" part="field">
      <span class="sr" data-text="intensity"></span>
      <input name="intensity" inputmode="numeric" autocomplete="off" spellcheck="false" />
      <span aria-hidden="true">%</span>
      <span class="hint" aria-hidden="true" hidden>0–150%</span>
    </label>
  </div>
</div>`;

const MAX = 150;
const ruPlural = new Intl.PluralRules("ru");
const TEXTS = {
  en: {
    title: "Light",
    direction: "Light direction",
    angle: "Light angle",
    intensity: "Light intensity",
    degrees: (n) => `${n} ${Math.abs(n) === 1 ? "degree" : "degrees"}`,
  },
  ru: {
    title: "Свет",
    direction: "Направление света",
    angle: "Угол света",
    intensity: "Интенсивность света",
    degrees: (n) => {
      const form = ruPlural.select(Math.abs(n));
      return `${n} ${form === "one" ? "градус" : form === "few" ? "градуса" : "градусов"}`;
    },
  },
};
// arrows turn by 5° (with Shift by 15°), Page Up and Page Down by 45°
const KEY_STEPS = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 45, PageDown: -45 };

/** Any angle as the dial shows it, −180…180: 270° is −90°. */
export const wrapAngle = (value) => {
  const wrapped = ((((value + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 && value > 0 ? 180 : wrapped;
};
const clampIntensity = (value) => Math.min(MAX, Math.max(0, value));
const number = (value, fallback) => (value === null || value === "" || !Number.isFinite(+value) ? fallback : +value);
const format = (value) => {
  const rounded = Math.round(value);
  return rounded < 0 ? `−${-rounded}` : String(rounded);
};
/** What is typed in a field: a number, NaN for something that is not one, null while it is only begun. */
const read = (text) => {
  const cleaned = text.replace(/[\s°%]/g, "").replace(/−/g, "-");
  return cleaned === "" || cleaned === "-" ? null : Number(cleaned);
};

const template = document.createElement("template");
template.innerHTML = `<style>${css}</style>${html}`;

export class LightDial extends HTMLElement {
  static observedAttributes = ["angle", "intensity", "label", "disabled", "state", "lang"];

  #angle = 0;
  #intensity = 80;
  #drafts = new Map();
  #before = 0;
  #wheelEnd = 0;
  #drag = false;
  #parts;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.append(template.content.cloneNode(true));
    const $ = (selector) => root.querySelector(selector);
    this.#parts = {
      base: $(".ld"),
      title: $(".title"),
      dial: $(".dial"),
      turn: $(".turn"),
      beam: $(".beam"),
      angle: $("input[name=angle]"),
      intensity: $("input[name=intensity]"),
      hint: $(".hint"),
      labels: root.querySelectorAll("[data-text]"),
    };
    // the fields' own input events stay inside: the element sends its own, with the value
    root.addEventListener("input", (event) => event.stopPropagation());
    this.#bindDial();
    this.#bindField("angle", wrapAngle);
    this.#bindField("intensity", clampIntensity);
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback(name, _, value) {
    if (name === "angle") this.#angle = wrapAngle(number(value, 0));
    if (name === "intensity") this.#intensity = number(value, 80);
    this.#render();
  }

  /** −180…180: 0 puts the lamp in front of the object, 90 on its right. */
  get angle() {
    return this.#angle;
  }
  set angle(value) {
    this.#angle = wrapAngle(number(value, 0));
    this.#render();
  }

  /** 0…150 %. A value set from outside the range is shown as an error and is held at its edge in `value`. */
  get intensity() {
    return this.#intensity;
  }
  set intensity(value) {
    this.#intensity = number(value, 80);
    this.#render();
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  get label() {
    return this.getAttribute("label");
  }
  set label(value) {
    if (value == null) this.removeAttribute("label");
    else this.setAttribute("label", value);
  }

  /** "hover" | "drag" | "focus" | "typing": shows that state without a pointer or keys, for previews. */
  get state() {
    return this.getAttribute("state");
  }
  set state(value) {
    if (value == null) this.removeAttribute("state");
    else this.setAttribute("state", value);
  }

  get value() {
    return { angle: this.#angle, intensity: clampIntensity(this.#intensity) };
  }

  #emit(type) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: this.value }));
  }

  #set(next, end = false) {
    if (next.angle !== undefined) this.#angle = wrapAngle(next.angle);
    if (next.intensity !== undefined) this.#intensity = next.intensity;
    this.#render();
    this.#emit("input");
    if (end) this.#emit("change");
  }

  #bindDial() {
    const { dial } = this.#parts;
    // Where the pointer is, seen from the middle of the dial: the lamp of angle a stands at (sin a, cos a),
    // y down, 19.5 of the dial's 56 units out. `lamp` tells whether the pointer is on the lamp itself.
    const pointer = (event) => {
      const box = dial.getBoundingClientRect();
      const unit = box.width / 56;
      const x = (event.clientX - (box.left + box.width / 2)) / unit;
      const y = (event.clientY - (box.top + box.height / 2)) / unit;
      const a = (this.#angle * Math.PI) / 180;
      return {
        angle: (Math.atan2(x, y) * 180) / Math.PI,
        lamp: Math.hypot(x - Math.sin(a) * 19.5, y - Math.cos(a) * 19.5) < 10,
      };
    };
    // Shift snaps the lamp to 15°
    const snapped = (angle, event) => {
      const snap = event.shiftKey ? 15 : 1;
      return Math.round(wrapAngle(angle) / snap) * snap;
    };

    // A press on the dial puts the lamp there; a press on the lamp takes it where it is, without a jump.
    // The drag is followed on the window, so nothing on the page can take the lamp out of the hand.
    dial.addEventListener("pointerdown", (event) => {
      if (this.disabled || event.button !== 0 || this.#drag) return;
      event.preventDefault();
      dial.focus({ preventScroll: true });
      const start = pointer(event);
      const offset = start.lamp ? wrapAngle(this.#angle - start.angle) : 0;
      const id = event.pointerId;
      const move = (next) => {
        if (next.pointerId === id) this.#set({ angle: snapped(pointer(next).angle + offset, next) });
      };
      const end = (next) => {
        if (next.pointerId !== id) return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        dial.removeAttribute("data-dragging");
        this.#drag = false;
        this.#emit("change");
      };
      this.#drag = true;
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
      // over a frame of the page the window hears nothing; the capture keeps those moves coming
      try {
        dial.setPointerCapture(id);
      } catch {
        // a pointer that is already gone ends on its own
      }
      dial.toggleAttribute("data-dragging", true);
      if (!start.lamp) this.#set({ angle: snapped(start.angle, event) });
    });
    dial.addEventListener("keydown", (event) => {
      const step = KEY_STEPS[event.key];
      const shown = Math.round(this.#angle);
      const next =
        event.key === "Home" ? -180
        : event.key === "End" ? 180
        : step === undefined ? null
        : shown + step * (event.shiftKey && event.key.startsWith("Arrow") ? 3 : 1);
      if (this.disabled || next === null) return;
      event.preventDefault();
      this.#set({ angle: next }, true);
    });
    // 100px of scrolling is 5°; the page does not scroll while the dial turns
    dial.addEventListener("wheel", (event) => {
      const delta = (event.deltaY || event.deltaX) * (event.deltaMode === 1 ? 33 : 1);
      if (this.disabled || !delta) return;
      event.preventDefault();
      this.#set({ angle: this.#angle + delta * (event.shiftKey ? 0.15 : 0.05) });
      clearTimeout(this.#wheelEnd);
      this.#wheelEnd = setTimeout(() => this.#emit("change"), 200);
    }, { passive: false });
  }

  // A number typed by hand is applied at once and brought into its range when the field is left.
  #bindField(name, fit) {
    const input = this.#parts[name];
    input.addEventListener("focus", () => {
      this.#before = this[name];
      input.select();
    });
    input.addEventListener("input", () => {
      this.#drafts.set(name, input.value);
      const typed = read(input.value);
      if (typed !== null && !Number.isNaN(typed)) this.#set({ [name]: fit(typed) });
      else this.#render();
    });
    input.addEventListener("blur", () => {
      if (!this.#drafts.delete(name)) return;
      this.#render();
      this.#emit("change");
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") input.blur();
      if (event.key === "Escape") {
        this.#set({ [name]: this.#before });
        input.blur();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        this.#drafts.delete(name);
        const step = (event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 10 : 1);
        this.#set({ [name]: fit(Math.round(this[name]) + step) }, true);
      }
    });
  }

  #render() {
    const parts = this.#parts;
    const text = (this.closest("[lang]")?.lang ?? "").toLowerCase().startsWith("ru") ? TEXTS.ru : TEXTS.en;
    const shown = Math.round(this.#angle);
    const power = clampIntensity(this.#intensity);
    const disabled = this.disabled;

    parts.title.textContent = this.label ?? text.title;
    for (const label of parts.labels) label.textContent = text[label.dataset.text];
    parts.turn.setAttribute("transform", `rotate(${-this.#angle})`);
    parts.beam.setAttribute("opacity", String(Math.sqrt(power / MAX)));
    parts.base.toggleAttribute("data-off", power === 0);

    parts.dial.tabIndex = disabled ? -1 : 0;
    parts.dial.setAttribute("aria-label", text.direction);
    parts.dial.setAttribute("aria-valuenow", String(shown));
    parts.dial.setAttribute("aria-valuetext", text.degrees(shown));
    if (disabled) parts.dial.setAttribute("aria-disabled", "true");
    else parts.dial.removeAttribute("aria-disabled");

    for (const name of ["angle", "intensity"]) {
      const input = parts[name];
      const value = name === "angle" ? this.#angle : this.#intensity;
      const draft = this.#drafts.get(name);
      if (draft === undefined && input.value !== format(value)) input.value = format(value);
      const typed = draft === undefined ? value : read(draft);
      const invalid = typed !== null && (Number.isNaN(typed) || (name === "intensity" && (typed < 0 || typed > MAX)));
      input.disabled = disabled;
      input.closest(".field").toggleAttribute("data-invalid", invalid);
      if (invalid) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      if (name === "intensity") parts.hint.hidden = !invalid;
    }
  }
}

if (!customElements.get("light-dial")) customElements.define("light-dial", LightDial);
