# Arte do story

O modelo usa `public/share/story-background.png`, derivado da proposta visual
aprovada na conversa. A edição foi feita com a ferramenta integrada `image_gen`,
sem uso de API ou CLI externo. Números, marca e textos são desenhados localmente
por `app/utils/story.js`; a imagem de fundo não contém métricas de exemplo.

A fonte Barlow Condensed ExtraBold está em `public/fonts/`, acompanhada da
licença OFL obtida do repositório oficial `google/fonts`. Fonte e arte entram
no precache do PWA. A arte ocupa aproximadamente 2,2 MB; o limite por arquivo
do precache foi ajustado para 3 MB.

## Prompt da edição

```text
Edit target: the supplied Rotina de Base poster. Produce a reusable blank background template for runtime composition of this exact story design. Preserve the portrait 9:16 composition, ivory paper grain, red textured circular medallion, yellow sun on the right, civic crowd silhouettes, red flags, congress architectural silhouette, textured torn-paper lower panel with a simple red calendar icon. REMOVE ALL TEXT, ALL LETTERS, ALL NUMBERS, ALL LOGOS from the entire image and inpaint cleanly with the corresponding original underlying texture and color. This includes the top logo and name, headline, number 6, words in the circle, 42,8, labels, date,12, closing slogan, bottom footer: no glyphs anywhere at all. In the red circle remove the white decorative rays too so it is entirely an empty solid textured red surface, ample clean room for several lines of dynamic text. Retain yellow sun and flag outside the circle. Retain the bottom calendar icon but no numbers on it. Preserve the original positions and scales faithfully: empty top header and headline region from 0 to 28% image height, empty red circle centered about x50% y45% with radius30% image width, crowd across middle-bottom roughly 36% to 67% image height; blank two-stat area roughly 68%-77% image height, blank beige torn-paper panel 79%-89%, blank footer 90%-100%. Output full-bleed 1080x1920 portrait artwork, no frame or mockup. Do not introduce new elements. No text whatsoever.
```
