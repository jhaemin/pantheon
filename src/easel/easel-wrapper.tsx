import {
  $designMode,
  $hoveredNode,
  $interactiveMode,
  $isDraggingNode,
  $isResizingIframe,
  $massMode,
} from '@/atoms'
import { keepNodeSelectionAttribute, makeNodeAttrs } from '@/data-attributes'
import { onMouseDownIframe } from '@/events'
import { Ground } from '@/ground'
import { PageNode } from '@/node-class/page'
import { getClosestSelectableNodeFromElm } from '@/node-lib'
import { useStore } from '@nanostores/react'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import styles from './easel-wrapper.module.scss'
import { PageTitle } from './page-title'
import { Resizer } from './resizer'

export const EASEL_WRAPPER_CLASS_NAME = 'studio-easel-wrapper'

export function getEaselIframeId(pageId: string) {
  return `easel-iframe-${pageId}`
}

/**
 * Previously hovered element used for simulating mouseover with mousemove.
 */
let previousMouseOverElement: Element | null = null

// Clear previously remembered hovered node.
// When node reverts back by history undo at where the cursor is by, it doesn't trigger simulated mouseover event.
// Because previousMouseOverElement is not cleared.
$hoveredNode.listen(() => {
  previousMouseOverElement = null
})

export function EaselWrapper({ page }: { page: PageNode }) {
  const interactiveMode = useStore($interactiveMode)
  const iframeRef = useRef<HTMLIFrameElement>(null!)
  const coordinates = useStore(page.$coordinates)

  useEffect(() => {
    if (!iframeRef.current) return

    PageNode.attachIframeElement(page, iframeRef.current)

    const iframeWindow = iframeRef.current?.contentWindow!

    // Inject global references to iframe's window object.
    iframeWindow.parentFrame = iframeRef.current
    iframeWindow.ownerApp = page.ownerApp
    iframeWindow.pageNode = page

    // Inject shared data
    iframeWindow.shared = { $designMode, $massMode, $scale: Ground.$scale }

    iframeWindow.addEventListener('DOMContentLoaded', () => {
      const attributes = makeNodeAttrs(page)

      Object.entries(attributes).forEach(([key, value]) => {
        if (value) {
          iframeWindow.document.body.setAttribute(key, value)
        }
      })
    })

    return () => {
      PageNode.detachIframeElement(page)
    }
  }, [page])

  useEffect(() => {
    const unsubscribe = page.$dimensions.subscribe((dimensions) => {
      if (iframeRef.current) {
        iframeRef.current.style.width = `${dimensions.width}px`
        iframeRef.current.style.height = `${dimensions.height}px`
      }
    })

    return () => {
      unsubscribe()
    }
  }, [page.$dimensions])

  if (!page) {
    return null
  }

  return (
    <div
      className={clsx(EASEL_WRAPPER_CLASS_NAME, styles.easelWrapper)}
      {...keepNodeSelectionAttribute}
      style={{
        translate: `${coordinates.x}px ${coordinates.y}px`,
      }}
      onMouseLeave={() => {
        previousMouseOverElement = null
        $hoveredNode.set(null)
      }}
      onMouseMove={(e) => {
        // Hover node while moving mouse on the iframe

        if ($isDraggingNode.get() || $isResizingIframe.get()) {
          return
        }

        const rect = iframeRef.current.getBoundingClientRect()
        const pointScale = 1 / Ground.scale
        const elementAtCursor =
          iframeRef.current?.contentDocument?.elementFromPoint(
            (e.clientX - rect.left) * pointScale,
            (e.clientY - rect.top) * pointScale,
          )

        // Simulate mouseover with mousemove
        if (
          elementAtCursor &&
          !elementAtCursor.isSameNode(previousMouseOverElement)
        ) {
          previousMouseOverElement = elementAtCursor

          const hoveredNode = getClosestSelectableNodeFromElm(elementAtCursor)

          if (hoveredNode) {
            $hoveredNode.set(hoveredNode)
          }
        }
      }}
      onMouseDown={(e) => onMouseDownIframe(e, page, false)}
    >
      <iframe
        tabIndex={-1}
        id={getEaselIframeId(page.id)}
        className="easel-iframe"
        ref={iframeRef}
        src="/easel"
        style={{
          pointerEvents: interactiveMode ? 'auto' : 'none',
          width: page.dimensions.width,
          height: page.dimensions.height,
          backgroundColor: 'white',
        }}
      />

      <PageTitle page={page} />
      <Resizer page={page} />
    </div>
  )
}
