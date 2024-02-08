import { $selectedNodes } from '@/atoms'
import { commandInsertNodes } from '@/command'
import { dataAttributes } from '@/constants'
import { onMouseDownForDragAndDropNode } from '@/events'
import { Node } from '@/node-class/node'
import { ReactNode, useRef } from 'react'
import styles from './drawer-item-wrapper.module.scss'

export function DrawerItemWrapper({
  children,
  createNode,
}: {
  children: ReactNode
  createNode: () => Node
}) {
  const ref = useRef<HTMLDivElement>(null!)

  return (
    <div
      {...{
        [dataAttributes.keepNodeSelection]: true,
      }}
      className={styles.drawerItemWrapper}
    >
      <div
        ref={ref}
        className={styles.drawerItemComponentWrapper}
        onMouseDown={(e) => {
          const cloneTargetElm = e.currentTarget
          const rect = cloneTargetElm.getBoundingClientRect()

          onMouseDownForDragAndDropNode(e, {
            cloneTargetElm: ref.current.firstElementChild!,
            elmX: e.clientX - rect.left,
            elmY: e.clientY - rect.top,
            elementScale: 1,
            draggingNode: createNode(),
          })
        }}
        onClick={() => {
          const selectedNodes = $selectedNodes.get()
          if (selectedNodes.length !== 1) return
          if (selectedNodes[0].isDroppable) {
            commandInsertNodes(selectedNodes[0], [createNode()], null)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
