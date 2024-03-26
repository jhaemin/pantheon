import { Node } from './node-class/node'

export type PropFormat =
  | {
      type: 'string' | 'number' | 'boolean' | 'object'
    }
  | {
      type: 'options'
      options: (
        | {
            value: string
            label: string
          }
        | string
      )[]
    }

export type Prop = {
  key: string
  label?: string
  // TODO: union
  format: PropFormat
  required?: boolean
  default?: any
  props?: Prop[]
}

/**
 * TODO: ReactNode as a prop is not supported yet.
 */
export type NodeDefinition = {
  /**
   * Component signature.
   *
   * `import { mod } from 'lib'`
   */
  mod: string
  /**
   * Sub component signature.
   *
   * @example lib.mod = 'Dialog', componentName = 'Dialog.Root'
   */
  sub?: string
  /**
   * Unique identifier for the node.
   *
   * Reserved node names are not allowed.
   */
  nodeName: string
  /**
   * Display name for the node.
   */
  displayName?: string
  fragment?: boolean
  unselectable?: boolean
  /**
   * If true, it is not droppable which means it can't have children.
   */
  leaf?: boolean
  portal?: boolean
  /**
   * If true, it should be rendered inside parent directly instead of passing through renderChildren function.
   */
  directChild?: boolean
  /**
   * If true, every child should be rendered directly inside parent.
   */
  allChildrenDirect?: boolean
  gapless?: boolean
  props?: Prop[]
  generateCode?: (node: Node) => string
}
