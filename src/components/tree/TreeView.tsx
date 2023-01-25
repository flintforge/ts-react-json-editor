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
 
import {TreeViewProps} from "./types";
export { TreeView, KnownType, TNode };

// Known type to a Json Tree with their representation,
// these are the javascript ones + Function
type KnownType = string|number|boolean|object|{}|null|undefined // [] ??
    |Array<KnownType>;

enum SortOrder { ASCENDING, DESCENDING }

type TNodes = Array<TNode>;
type NodePath = Array<number>;

interface TNode {

    data   : KnownType;
    name   : string;
    parent : TNode;
    root   : TNode;
    view   : TreeViewProps;
    isRoot : boolean;
    index  : number;  // its index in the parent children array
    level  : number;
    id     : string; // literal flattening of the object accessor eg key1.ch2.0
    
    children   : TNodes;
    //expanded : boolean;
    // moved into treeviewprops as we are likely to save that tree
    // and put into a store
    editing: number;

    addChild	(node: TNode): void;
    addChildren	(nodes: TNodes): void;
    child	(index: number): TNode;
    
    // data(column: number): unknown;
    insertChild		(index: number, node: TNode): boolean;
    insertChildren	(index: number, nodes: TNodes): boolean;
    takeChildren	(index: number, count: number): TNodes;
    takeChild		(index: number): TNode;
    
    // See getter and setters
    isEnabled	(): boolean;
    isSelected	(): boolean;
    isHidden	(): boolean;
    setEnabled	(b: boolean): void;
    setSelected	(b: boolean): void;
    setHidden	(b: boolean): void;
    //sortChildren(s: SortOrder): void;
}


/*interface Tree
    extends Component<{ parent?: TNode | null, data?: unknown }, {}> {
}*/

type TreeDumpedProps = {
    children?: TreeDumpedProps[]
}|null

export function dumpExpansion(n:TNode):TreeDumpedProps {
    /**
     * return a structure representing tree expansion
     */
    return n.view.expanded ? // only expandable have children
        {
            children : n.children.map(c => dumpExpansion(c))
        }
        :  null
}

type TreeModel = {
    parent?	: TNode | null,
    name	: string,  // should be key //todo
    data?	: KnownType, // should be value
    level?	: Number,
    root?	: TNode,
    expanded?	: boolean // debug purpose
}

class TreeView implements TNode
{
    public static defaultProps = {
        parent: null,
        name: null
    }

    name                : string;
    isRoot              : boolean;
    editing             : 0|1|2;
    private _selected   : boolean;
    private _hidden     : boolean;
    parent              : TNode;
    root                : TNode;
    data                : KnownType;
    view                : TreeViewProps; // extra props relative to the view can  be saved
    //private _data     : KnownType;
    index               : number = 0;
    level               : number = 0;
    //expanded          : boolean;

    id: string;
    static getId(n:TNode):string {
        return (n.parent? TreeView.getId(n.parent) + "." : '')
            + n.name
    }

    static siblingElement =(_:TNode, name:string) =>
        document.getElementById(`${TreeView.getId(_.parent)}.${name}`);

    children: Array<TNode> = []; // or TNodes
    addChild(node: TNode): void {
        this.children.push(node);
        node.level = this.level + 1;
        node.index = this.children.length - 1;
    }

    addChildren(nodes: TNodes): void {
        this.insertChildren(0, nodes);
    }

    child(index: number): TNode {
        return this.children[index];
    }

    insertChild(index: number, node: TNode): boolean {
        if (index > 0 && index < this.children.length) {
            this.children.splice(index, 0, node);
            return true;
        }
        return false;
    }

    insertChildren(index: number, nodes: TNodes): boolean {
        if (index > 0 && index < this.children.length) {
            this.children.splice(index, 0, ...nodes);
            return true;
        }
        return false;
    }

    takeChild(index: number): TNode {
        return this.children.splice(index, 1)[0];
    }

    takeChildren(index: number, count: number): TNodes {
        return this.children.splice(index, count);
    }

    private _enabled: boolean;
    get enabled	(): boolean { return this._enabled; }
    set enabled	(e: boolean) { this._enabled = e; }
    isEnabled	(): boolean { return this._enabled; }
    isSelected	(): boolean { return this._selected; }
    isHidden	(): boolean { return this._hidden; }
    hasChildren	(): boolean {return this.children && this.children.length > 0 }

    setEnabled	(b: boolean): void {  this._enabled = b; }
    setSelected	(b: boolean): void { this._selected = b; }
    setHidden	(b: boolean): void { this._hidden = b; }

    sortChildren(
        fn: ((a: TNode, b: TNode) => number),
        s: SortOrder): void {
        this.children.sort(fn);
    }

    moveNode(node: TNode, path: NodePath): boolean {
        let [r, n, index] = descent(this.root, path);
        if (r) {
            return n.insertChild(index, node.parent.takeChild(node.index));
        } else {
            return false;
        }
    }

    called() {
        console.log("external call")
    }

    static num = 0;
    static id =()=> ++TreeView.num;


    constructor(P: TreeModel) {
        if (P.parent) { this.parent = P.parent; }
        this.view = {}

        this.data = P.data;
        this.name = P.name;
        this.root = P.root||this as TNode;

        // props relative to the display
        // {expanded:false}; // nested as data into the parent item
    }


    loadJSON(json: KnownType, level: number = 0): void {
        //console.log(json)
        if(json==null) { return }

        // todo : remove the name that enclose the tree (the root)

        Object.keys(json).map(name => {
            let data = json[name];
            let n = new TreeView({parent: this, name, data, level, root:this.root});
            this.addChild(n);
            if (Array.isArray(data) || typeof data=="object") {
                console.log(name)
                // [] and {} both are 'objects'
                n.loadJSON(data, level + 1);
                this.view[name] = n.view;
                // this cost again (namespace + empty object)
                //this.props.expanded = n.expanded = n.children.length > 0;
            }
        });
        //console.log("dumped", dumpExpansion(this))
    }

    static reaffectViewProps =(tree:TNode, viewProps:object)=> {
        // Each node has a reference to it's named key
        // in the view property tree
        tree.children.map( (n:TNode) =>{
            n.view = viewProps[n.name];
            TreeView.reaffectViewProps(n, tree.view[n.name])
        })
    }
}


function descent(node: TNode, n: NodePath): [boolean, TNode, number] {
    /**
     given a node and an array of indexes
     go through every nth child in the array
     */
    if (n.length == 1) { // last
        return [true, node.parent as TNode, n.pop() || 0];
    } else {
        let next = n.pop() || 0;
        if (next < node.child.length) {
            return descent(node.child(next), n);
        } else {
            return [false, {} as TNode, 0];
        }
    }
}

