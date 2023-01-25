/*
 * ts-react-json-tree
 * Tree view structure
 * and json editor
 *
 * author: Phil Estival
 * https://github.com/flintforge/ts-react-json-editor
 *
 * inspired by QT TreeView 
 */

export interface State {
    expanded?: boolean
}

export interface Actions {
    toggleExpand (): void
}

export interface Node {
    expanded?: boolean
    action (): void
}

export type TreeViewProps = {
    expanded?:boolean;
}

export interface INode extends Actions, State {}
