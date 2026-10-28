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

## Verificação em produção em 28/10/2026

A nova captura confirma que o envio pelo PC usa a arte quadrada, enquanto
colar o endereço no Android ainda produz título e descrição sem imagem.
A redução de peso não resolveu o sintoma mobile relatado.

Consultas HTTPS com `User-Agent: WhatsApp/2.24.17.79 A` retornaram:

- Página: HTTP 200, HTML de 3.099 bytes, com `og:image` apontando para a v2,
  tipo JPEG e dimensões 600 × 600 presentes sem executar JavaScript.
- Imagem: HTTP 200, `Content-Type: image/jpeg`, 93.964 bytes, sem redirecionamento.
  SHA-256 igual ao arquivo local.

Essas consultas partem da rede de desenvolvimento e não reproduzem o cliente
Android. Não demonstram que o aparelho consegue buscar a imagem nem eliminam
cache ou falhas específicas do aplicativo.

Próximo teste no aparelho: colar `https://baseativa.tanuri.dev/?preview=mobile-2`
e aguardar a prévia. Se funcionar, isso favorece a hipótese de cache associado
ao endereço original. Se falhar, abrir a imagem diretamente no navegador do
mesmo aparelho e repetir a prévia em outra rede ajuda a investigar acesso.
Nenhuma nova alteração na arte ou nos metadados foi feita sem essa evidência.
