

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
