# Prévia de compartilhamento

A configuração global em `nuxt.config.ts` inclui Open Graph no HTML estático,
sem depender de JavaScript executado pelo aplicativo de mensagens.

A prévia anterior era um PNG horizontal de 2.670.598 bytes. A captura relatada
mostra corte lateral no cartão quadrado do WhatsApp Desktop e ausência de imagem
no celular. Não foi possível reproduzir o WhatsApp mobile neste ambiente nem
consultar a resposta pública do domínio; o peso é uma hipótese para a ausência,
não uma causa confirmada.

`public/share/base-ativa-social-v2.jpg` adapta o cartaz para 600 × 600 px e
93.964 bytes. O nome novo distingue o recurso anterior; os metadados declaram
tipo e dimensões. O arquivo antigo permanece disponível para links existentes.

`tests/social-preview.spec.js` verifica o HTML sem executar JavaScript, a resposta
da imagem, o limite de peso e as dimensões decodificadas no navegador. Isso não
emula o crawler nem o cache do WhatsApp. Após publicar, conferir uma nova mensagem
no WhatsApp do aparelho; mensagens já enviadas não servem como validação da versão
nova.
