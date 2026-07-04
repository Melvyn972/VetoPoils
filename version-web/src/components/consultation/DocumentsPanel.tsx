import { useEffect, useState } from 'react'

import {
  formatDocumentDate,
  getDocumentSignedUrl,
  isImageMimeType,
  isPdfMimeType,
} from '../../lib/documents'
import type { VetDocumentSummary } from '../../types/vet'

function DocumentIcon({ mimeType }: { mimeType: string }) {
  if (isImageMimeType(mimeType)) {
    return (
      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function DocumentPreviewModal({
  document,
  url,
  onClose,
}: {
  document: VetDocumentSummary
  url: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-14 bg-surface shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-fg-tertiary/20 px-5 py-4">
          <div>
            <h4 className="font-title text-base font-semibold text-fg-primary">{document.file_name}</h4>
            <p className="font-body text-xs text-fg-tertiary">{formatDocumentDate(document.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-12 bg-primary-15 px-3 py-1.5 font-body text-xs font-medium text-primary hover:bg-primary/20"
            >
              Ouvrir
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-12 px-3 py-1.5 font-body text-xs text-fg-secondary hover:bg-surface-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-surface-secondary p-4">
          {isImageMimeType(document.mime_type) ? (
            <img src={url} alt={document.file_name} className="mx-auto max-h-[70vh] rounded-12 object-contain" />
          ) : isPdfMimeType(document.mime_type) ? (
            <iframe title={document.file_name} src={url} className="h-[70vh] w-full rounded-12 bg-white" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="font-body text-sm text-fg-secondary">Aperçu non disponible pour ce type de fichier.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-12 bg-primary px-4 py-2 font-body text-sm font-medium text-white"
              >
                Télécharger le document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DocumentsPanel({ documents }: { documents: VetDocumentSummary[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<{ document: VetDocumentSummary; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUrls() {
      const entries = await Promise.all(
        documents.map(async (doc) => {
          const url = await getDocumentSignedUrl(doc.file_path)
          return [doc.id, url] as const
        }),
      )

      if (cancelled) return
      const nextUrls: Record<string, string> = {}
      for (const [id, url] of entries) {
        if (url) nextUrls[id] = url
      }
      setUrls(nextUrls)
    }

    if (documents.length > 0) {
      void loadUrls()
    } else {
      setUrls({})
    }

    return () => {
      cancelled = true
    }
  }, [documents])

  if (documents.length === 0) {
    return (
      <section className="flex flex-col gap-3 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
        <h3 className="font-title text-base font-semibold text-fg-primary">Documents & images</h3>
        <p className="font-body text-sm text-fg-secondary">Aucun document disponible pour cet animal.</p>
      </section>
    )
  }

  return (
    <>
      <section className="flex flex-col gap-4 rounded-14 border border-fg-tertiary/20 bg-surface-secondary p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-title text-base font-semibold text-fg-primary">Documents & images</h3>
          <span className="rounded-10 bg-primary-15 px-2.5 py-1 font-body text-xs font-medium text-primary">
            {documents.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((document) => {
            const url = urls[document.id]
            const isImage = isImageMimeType(document.mime_type)

            return (
              <article
                key={document.id}
                className="flex flex-col overflow-hidden rounded-12 border border-fg-tertiary/15 bg-surface"
              >
                {isImage && url ? (
                  <button
                    type="button"
                    onClick={() => setPreview({ document, url })}
                    className="group relative aspect-video w-full overflow-hidden bg-surface-secondary"
                  >
                    <img
                      src={url}
                      alt={document.file_name}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                    <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                  </button>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-primary-15">
                    <DocumentIcon mimeType={document.mime_type} />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 font-body text-sm font-semibold text-fg-primary">{document.file_name}</p>
                  <p className="font-body text-xs text-fg-tertiary">{formatDocumentDate(document.created_at)}</p>
                  {document.category_ocr ? (
                    <span className="w-fit rounded-10 bg-accent-blue-15 px-2 py-0.5 font-body text-[11px] font-medium text-accent-blue">
                      {document.category_ocr.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                  {url ? (
                    <div className="mt-auto flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreview({ document, url })}
                        className="rounded-10 bg-primary-15 px-3 py-1.5 font-body text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        Voir
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-10 border border-fg-tertiary/25 px-3 py-1.5 font-body text-xs font-medium text-fg-secondary hover:bg-surface-secondary"
                      >
                        Télécharger
                      </a>
                    </div>
                  ) : (
                    <p className="font-body text-xs text-fg-tertiary">Chargement...</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {preview ? (
        <DocumentPreviewModal document={preview.document} url={preview.url} onClose={() => setPreview(null)} />
      ) : null}
    </>
  )
}
