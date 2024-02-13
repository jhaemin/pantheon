import { RemoveNodeAction } from '@/action'
import { studioApp } from '@/studio-app'
import { useStore } from '@nanostores/react'
import { Flex, Text, TextField } from '@radix-ui/themes'
import { atom, map } from 'nanostores'
import { renderChildren } from '../node-component'
import { Node } from './node'

export const DEFAULT_PAGE_LABEL = 'New Page'

export class PageNode extends Node {
  readonly nodeName = 'Page'

  public $pageLabel = atom(DEFAULT_PAGE_LABEL)
  public $unselectableNodes = atom<Node[]>([])

  public refreshUnselectableNodes() {
    this.$unselectableNodes.set(
      this.children.filter((child) => child.isUnselectable),
    )
  }

  private _iframeElement: HTMLIFrameElement | null = null

  get iframeElement() {
    return this._iframeElement
  }

  get element() {
    return this.wrapperElement
  }

  private onIframeMountCallbacks: ((
    iframeElement: HTMLIFrameElement,
  ) => void)[] = []

  onIframeMount(callback: (iframeElement: HTMLIFrameElement) => void) {
    this.onIframeMountCallbacks.push(callback)

    // Return a function to unsubscribe
    return () => {
      this.onIframeMountCallbacks = this.onIframeMountCallbacks.filter(
        (cb) => cb !== callback,
      )
    }
  }

  get isDraggable(): boolean {
    return false
  }

  static attachIframeElement(
    pageNode: PageNode,
    iframeElement: HTMLIFrameElement,
  ) {
    pageNode._iframeElement = iframeElement
    pageNode.onIframeMountCallbacks.forEach((callback) =>
      callback(iframeElement),
    )
  }

  static detachIframeElement(pageNode: PageNode) {
    pageNode._iframeElement = null
  }

  readonly $dimensions = map<{ width: number; height: number }>({
    width: 720,
    height: 640,
  })
  readonly $coordinates = map<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  readonly $info = map<{ label: string }>({
    label: 'New Page',
  })

  get dimensions() {
    return this.$dimensions.get()
  }

  set dimensions(value: { width: number; height: number }) {
    this.$dimensions.set(value)
  }

  get coordinates() {
    return this.$coordinates.get()
  }

  set coordinates(value: { x: number; y: number }) {
    this.$coordinates.set(value)
  }

  get ownerPage(): PageNode {
    return this
  }

  remove(): RemoveNodeAction {
    studioApp.removePage(this)
    return new RemoveNodeAction({
      removedNode: this,
      oldParent: null,
      oldNextSibling: null,
    })
  }

  public generateCode(): string {
    const openTag = this.children.length === 0 ? '' : '<>'
    const closeTag = this.children.length === 0 ? '' : '</>'

    return `${openTag}${this.children.map((child) => child.generateCode()).join('')}${closeTag}`
  }
}

export function PageNodeComponent({ node }: { node: PageNode }) {
  const children = useStore(node.$children)

  return <>{renderChildren(children)}</>
}

const MAX_PAGE_LABEL_LENGTH = 20

export function PageNodeControls({ nodes }: { nodes: PageNode[] }) {
  const firstPageLabel = useStore(nodes[0].$pageLabel)
  const allSame = nodes.every(
    (node) => node.$pageLabel.get() === firstPageLabel,
  )

  return (
    <>
      <Flex direction="row" align="center" justify="between">
        <Text size="2">Label</Text>
        <TextField.Input
          maxLength={MAX_PAGE_LABEL_LENGTH}
          autoComplete="off"
          value={allSame ? firstPageLabel : ''}
          placeholder={allSame ? undefined : 'Multiple values'}
          onChange={(e) => {
            nodes.forEach((node) => {
              node.$pageLabel.set(e.target.value)
            })
          }}
        />
      </Flex>
    </>
  )
}
