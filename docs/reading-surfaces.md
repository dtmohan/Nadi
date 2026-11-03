# Reading surfaces

Use the shared reading-surface template for information presented alongside a chart. It keeps the main sections aligned and lets the light and dark themes supply the palette.

- Use `InfoBox` for a full-width section, `InfoBoxTitle` for its heading, and `InfoBoxDescription` for its introduction. The styles and exported constants live in `client/src/components/info-box.tsx` and `client/src/index.css`.
- Use `InfoBoxDisclosure` for an expandable supporting section, or `INFO_BOX_INSET` with `INFO_BOX_ROW_SUMMARY` when a disclosure has its own layout. Keep native `details` and `summary` controls, visible keyboard focus, and any existing test identifiers.
- Use `INFO_BOX_ROWS` and `INFO_BOX_ROW` for labelled explanatory rows. They stack on narrow screens and align labels on wider screens.
- For smaller surfaces, use `nadi-info-card` for a standalone card, `nadi-info-inset` for nested information, `nadi-info-note` for subdued notes, and `nadi-info-warning` for cautions.

Use the existing semantic verdict colours for actual findings and statuses; a neutral information container should not imply a favourable or unfavourable result. Controls, tables, charts, and citation chips may need their own layouts. Avoid restricting the width of a section just to limit the length of its prose: constrain the text instead when necessary.
