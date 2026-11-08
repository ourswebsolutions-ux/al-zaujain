// Dashboards only. The public website always stays light.
// Dark mode replaces the design tokens on the dashboard wrapper, and hard-coded
// colours read `--d-*` with their light value as the fallback, so light mode is unchanged.
export const THEME_COOKIE = 'az_theme';

export const DARK_THEME = '[color-scheme:dark] [--color-white:#14243a] [--color-navy:#e9eef4] [--color-ink:#dbe3ec] [--color-muted:#9aa9b8] [--color-line:#2a3d55] [--color-cream:#1e3048] [--color-paper:#0f1d2f] [--color-mist:#18293f] [--field-bg:#101f32] [--field-line:#2a3d55] [--d-overlay:#14243aed] [--d-bg:#0b1726] [--d-hover:#1c2e45] [--d-line:#263a52] [--d-text:#b5c2cf] [--d-gold:#e4b653] [--d-green:#63d384] [--d-red:#ff9a91] [--d-blue:#7cc4f5] [--d-gold-bg:#30280f] [--d-red-bg:#3b1f22] [--d-green-bg:#16321f] [--d-tint:#ffffff0d] [--d-tint-strong:#ffffff1f]';

// For panels that are always navy, such as the sidebar and the welcome banner.
export const KEEP_LIGHT = '[--color-white:#fff] [--color-navy:#062b4e] [--color-ink:#092a49] [--color-muted:#66717d] [--color-line:#ddd1b8] [--color-cream:#f7f2e8]';
