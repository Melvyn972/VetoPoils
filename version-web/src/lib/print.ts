export function printHtmlDocument(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Impression du dossier')
  iframe.style.position = 'fixed'
  iframe.style.inlineSize = '0'
  iframe.style.blockSize = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDocument = frameWindow?.document
  if (!frameWindow || !frameDocument) {
    iframe.remove()
    throw new Error('L’impression n’est pas disponible dans ce navigateur.')
  }

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()

  window.setTimeout(() => {
    frameWindow.focus()
    frameWindow.print()
    window.setTimeout(() => iframe.remove(), 1200)
  }, 80)
}
