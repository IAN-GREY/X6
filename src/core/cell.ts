import * as util from '../util'
import { Disposable } from '../common'
import { Geometry } from './geometry'
import { Overlay } from '../struct'
import { Style } from '../types'

export class Cell extends Disposable {
  public id?: string | null
  public data: any
  public style: Style
  public visible: boolean
  public geometry: Geometry | null

  public parent: Cell | null
  public children: Cell[] | null
  public edges: Cell[] | null
  public collapsed: boolean
  public connectable: boolean

  public source: Cell | null
  public target: Cell | null

  public overlays: Overlay[] | null

  private node?: boolean
  private edge?: boolean

  constructor(
    data?: any,
    geometry?: Geometry,
    style: Style = {},
  ) {
    super()
    this.data = data || null
    this.style = style
    this.geometry = geometry || null
    this.visible = true
  }

  // #region edge

  isEdge() {
    return this.edge === true
  }

  asEdge(v: boolean) {
    this.edge = v
  }

  getTerminal(isSource?: boolean) {
    return isSource ? this.source : this.target
  }

  setTerminal(terminal: Cell | null, isSource?: boolean) {
    if (isSource) {
      this.source = terminal
    } else {
      this.target = terminal
    }

    return terminal
  }

  removeFromTerminal(isSource?: boolean) {
    const terminal = this.getTerminal(isSource)
    if (terminal != null) {
      terminal.removeEdge(this, isSource)
    }
  }

  // #endregion

  // #region node

  isNode() {
    return this.node != null
  }

  asNode(v: boolean) {
    this.node = v
  }

  isConnectable() {
    return !!this.connectable
  }

  setConnectable(connectable: boolean) {
    this.connectable = connectable
  }

  getEdgeCount() {
    return this.edges == null ? 0 : this.edges.length
  }

  getEdgeIndex(edge: Cell) {
    return util.indexOf<Cell>(this.edges, edge)
  }

  getEdgeAt(index: number) {
    return this.edges == null ? null : this.edges[index]
  }

  insertEdge(edge: Cell, isOutgoing?: boolean) {
    if (edge != null) {
      edge.removeFromTerminal(isOutgoing)
      edge.setTerminal(this, isOutgoing)

      if (
        this.edges == null ||
        edge.getTerminal(!isOutgoing) !== this ||
        util.indexOf(this.edges, edge) < 0
      ) {
        if (this.edges == null) {
          this.edges = []
        }

        this.edges.push(edge)
      }
    }

    return edge
  }

  removeEdge(edge: Cell, isOutgoing?: boolean) {
    if (edge != null) {
      if (
        edge.getTerminal(!isOutgoing) !== this &&
        this.edges != null
      ) {
        const index = this.getEdgeIndex(edge)
        if (index >= 0) {
          this.edges.splice(index, 1)
        }
      }

      edge.setTerminal(null, isOutgoing)
    }

    return edge
  }

  getEdges() {
    return this.edges
  }

  eachEdge(
    iterator: (edge: Cell, index: number, edges: Cell[]) => void,
    context?: any,
  ) {
    return util.forEach(this.edges, iterator, context)
  }

  isCollapsed() {
    return !!this.collapsed
  }

  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed
  }

  collapse() {
    return this.setCollapsed(true)
  }

  expand() {
    return this.setCollapsed(false)
  }

  toggleCollapse() {
    return this.collapsed ? this.expand() : this.collapse()
  }

  // #endregion

  // #region parent

  getParent() {
    return this.parent
  }

  setParent(parent: Cell | null) {
    this.parent = parent
  }

  removeFromParent() {
    if (this.parent != null) {
      const index = this.parent.getChildIndex(this)
      this.parent.removeChildAt(index)
    }
  }

  isOrphan() {
    return this.parent == null
  }

  isAncestor(descendant: Cell | null) {
    if (descendant == null) {
      return false
    }

    let des: Cell | null = descendant
    while (des && des !== this) {
      des = des.parent
    }

    return des === this
  }

  getAncestors() {
    const result: Cell[] = []
    let parent = this.parent

    while (parent) {
      result.push(parent)
      parent = parent.parent
    }

    return result
  }

  getDescendants() {
    let result: Cell[] = []
    if (this.children) {
      this.eachChild((child) => {
        result.push(child)
        result = result.concat(child.getDescendants())
      })
    }
    return result
  }

  // #endregion

  // #region children

  getChildren() {
    return this.children
  }

  getChildCount() {
    return this.children == null ? 0 : this.children.length
  }

  getChildIndex(child: Cell) {
    return util.indexOf<Cell>(this.children, child)
  }

  getChildAt(index: number) {
    return this.children == null ? null : this.children[index]
  }

  insertChild(child: Cell, index?: number) {
    if (child != null) {
      let pos = index
      if (pos == null) {
        pos = this.getChildCount()
        if (child.getParent() === this) {
          pos -= 1
        }
      }

      child.removeFromParent()
      child.setParent(this)

      if (this.children == null) {
        this.children = []
        this.children.push(child)
      } else {
        this.children.splice(pos, 0, child)
      }
    }

    return child
  }

  removeChild(child: Cell) {
    const index = this.getChildIndex(child)
    return this.removeChildAt(index)
  }

  removeChildAt(index: number) {
    let child = null

    if (this.children != null && index >= 0) {
      child = this.getChildAt(index)
      if (child != null) {
        this.children.splice(index, 1)
        child.setParent(null)
      }
    }

    return child
  }

  eachChild(
    iterator: (child: Cell, index: number, children: Cell[]) => void,
    context?: any,
  ) {
    return util.forEach(this.children, iterator, context)
  }

  // #endregion

  getId() {
    return this.id
  }

  setId(id?: string | null) {
    this.id = id
  }

  getData() {
    return this.data
  }

  setData(value: any) {
    this.data = value
  }

  /**
   * Return style as a string of the form `[(stylename|key=value);]`.
   */
  getStyle() {
    return this.style || null
  }

  setStyle(style: Style) {
    this.style = style
  }

  getGeometry() {
    return this.geometry
  }

  setGeometry(geometry: Geometry) {
    this.geometry = geometry
  }

  getOverlays() {
    return this.overlays
  }

  setOverlays(overlays: Overlay[] | null) {
    this.overlays = overlays
  }

  // #region visible

  isVisible() {
    return this.visible
  }

  setVisible(visible: boolean) {
    this.visible = visible
  }

  show() {
    return this.setVisible(true)
  }

  hide() {
    return this.setVisible(false)
  }

  toggleVisible() {
    return this.isVisible() ? this.hide() : this.show()
  }

  clone() {
    const clone = util.clone<Cell>(this, Cell.ignoredKeysWhenClone)!
    clone.setData(this.cloneValue())
    return clone
  }

  protected cloneValue() {
    let value = this.getData()
    if (value != null) {
      if (util.isFunction(value.clone)) {
        value = value.clone()
      } else if (!isNaN(value.nodeType)) {
        value = value.cloneNode(true)
      }
    }

    return value
  }

  // #region IDisposable

  @Disposable.aop()
  dispose() {
    // node
    this.eachChild(child => child.dispose())
    this.eachEdge(edge => edge.dispose())
    this.removeFromParent()

    // edge
    this.removeFromTerminal(true)
    this.removeFromTerminal(false)
  }

  // #endregion
}

export namespace Cell {
  export const ignoredKeysWhenClone = [
    'id', 'data', 'parent', 'source',
    'target', 'children', 'edges',
  ]
}
