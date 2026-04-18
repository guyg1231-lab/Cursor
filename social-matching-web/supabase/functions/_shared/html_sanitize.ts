import sanitizeHtml from 'npm:sanitize-html@2.12.1'

export function sanitizeEmailHtml(html: string): string {
  if (!html) return html

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']).filter((tag) =>
      !['svg', 'script', 'iframe', 'object', 'embed', 'base', 'meta'].includes(tag)
    ),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style', 'class', 'id', 'dir'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowProtocolRelative: false,
  })
}
