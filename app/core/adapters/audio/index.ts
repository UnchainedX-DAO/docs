// Audio was intentionally dropped from the docs site (see project memory:
// scaffold pruned sanity/audio/i18n/scroll). These are no-op stand-ins so the
// portfolio UI/hooks ported verbatim from unchainedx.io keep the same import
// surface without shipping an audio engine.
export function playClick(): void {}
export function playHover(): void {}
export function playSwipe(): void {}
export function playTone(): void {}
export function playTransition(): void {}
export function setAmbientProfile(_profile: string): void {}
export function startAmbientIfNeeded(): void {}
