// Types for https://likemiens.com/ui/light-dial/light-dial.js — <light-dial>, the light control of Cubas.

export interface LightDialValue {
  /** −180…180: 0 puts the lamp in front of the object, 90 on its right, ±180 behind it. */
  angle: number;
  /** 0…150 %. */
  intensity: number;
}

/** Shown without a pointer or keys, for previews of the component. */
export type LightDialState = "hover" | "drag" | "focus" | "typing";

export interface LightDialEventMap extends HTMLElementEventMap {
  /** While the light moves: dragging, scrolling, typing. */
  input: CustomEvent<LightDialValue>;
  /** When a gesture ends: the pointer is released, a key steps, a field is left. */
  change: CustomEvent<LightDialValue>;
}

export declare class LightDial extends HTMLElement {
  /** Attribute `angle`. Any number is folded into −180…180. */
  angle: number;
  /** Attribute `intensity`. A value out of 0…150 is shown as an error and held at its edge in `value`. */
  intensity: number;
  /** Attribute `disabled`. */
  disabled: boolean;
  /** Attribute `label`: the visible name, "Light" (or "Свет" under a Russian `lang`) by default. */
  label: string | null;
  /** Attribute `state`. */
  state: LightDialState | null;
  /** The angle and the intensity within its range — what the events carry. */
  readonly value: LightDialValue;

  addEventListener<K extends keyof LightDialEventMap>(
    type: K,
    listener: (this: LightDial, event: LightDialEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof LightDialEventMap>(
    type: K,
    listener: (this: LightDial, event: LightDialEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

/** Folds any angle into −180…180, as the dial shows it. */
export declare function wrapAngle(value: number): number;

declare global {
  interface HTMLElementTagNameMap {
    "light-dial": LightDial;
  }
}
