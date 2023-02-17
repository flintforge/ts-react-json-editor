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
 
import {h, Component} from 'preact';
import {useReducer} from "preact/hooks";
import  AutosizeInput from 'react-input-autosize'
import {Theme, UndoStack} from 'App'
import {KnownType, TNode, TreeView} from "./TreeView";
import  'styles/tree.sass'
import {blinkClass} from "lib/classes";

/**
 * for huge trees
 * see
 * react-virtualized
 * react-window
 */

/** View **/

const Expander =(P: { onClick: EventListener, expanded?:boolean })=>
    <Theme.Consumer>
        {
            theme =>
            <div class={"expander "+theme}
                 onClick={P.onClick}>
                {P.expanded ? '—' : '+'}
            </div>
        }
    </Theme.Consumer>



const ACCOLADE = '{}'
const BRACE = '[]'

interface ItemState {
    name	: string,
    expanded?	: boolean,
    editingName	: boolean,
}

interface ObjectState {
}

enum ObjectItemAction {
    expand,
    inputName,
    editName,
    validateName,
    editValue,
    inputValue,
    validateValue,
    cancel
}

const OIA = ObjectItemAction;

type ItemAction = {
    type: ObjectItemAction,
    payload:any
}


interface ItemValueState {
    value: KnownType,
    editingValue: boolean,
}

type ObjectItemValueState = ItemValueState & ObjectState;
type ObjectItemLabelState = ItemState & ObjectState;

/*class TreeItem<P> extends Component<ItemProps,{}> {
    render=(x:ItemProps, {})=><span/>
}

interface ItemProps {}
*/

interface NodeProps {
    _:TNode;
}

interface ObjectItemProps extends NodeProps {
    brace  : string;
    addon? : string;
}

interface LabelState {
    name    : string;
    editing : boolean
}

/*
type Rename<T, K extends keyof T, N extends string>
    = Pick<T, Exclude<keyof T, K>> & Record<N, valueof<Pick<T, K>>>
*/

enum OBJECT_RENAME { OK=0, KEY_ALREADY_EXIST, SAME_NAME}
const renameObjectProperty =(o:object, oldkey:string, newkey:string) => {
    /* giving a new object would break references
    */
    if (oldkey !== newkey) {
        let x = Object.getOwnPropertyDescriptor(o, oldkey)
        let y = Object.getOwnPropertyDescriptor(o, newkey)

        console.log('exist',x!=null,'alreadyexist',y!=null)
        if (y) {
            return OBJECT_RENAME.KEY_ALREADY_EXIST;
        }
        else if (x && !y) {
            Object.defineProperty(o, newkey, x)
            delete o[oldkey];
            return OBJECT_RENAME.OK;
        }
    }
    return OBJECT_RENAME.SAME_NAME
}


class TreeItemLabel extends Component<NodeProps,{}> {

    render = ({_}:NodeProps,{}) => {
        //console.log(_.getId(),brace,addon)
        const initialState = {
            name: _.name,
            editingName: false,
        };

        /**
         * a common reducer holding the reference to the _ node ain't bad
         */
        const reducer = (state: ObjectItemLabelState, action: ObjectItemAction|ItemAction) => {
            let s = state;
            let {name, editingName} = state;
            if(typeof action == 'object') {
                switch (action.type) {
                    case OIA.inputName:
                        return {...s, name: action.payload, editing: true};
                }
            }

            switch (action) {

                case OIA.validateName: /** todo  if it's an array
                 renaming the key can the length of the array
                 > need a way to rename the tree at large, by text
                 as in pyqtilt
                 extra care needed for a TreeArrayItemLabel
                 */
                    if(_.name != name) {
                        if(!_.parent) { // root node, but odd case and won't be savded
                            // in data  todo : declare a RootLabelComponent
                            // and remove this additional label
                            _.name = name;
                            return {...s, name, editingName: false};
                        }else {
                            let o = _.parent.data as object;
                            let r = renameObjectProperty(o, _.name, name)
                            if (!r) {
                                UndoStack.push(()=>{
                                    renameObjectProperty(o,name,_.name);
                                    this.forceUpdate();
                                })
                                _.name = name;
                                console.log(_)
                                return {...s, name, editingName: false};
                            } else {
                                switch(r) {
                                    case OBJECT_RENAME.KEY_ALREADY_EXIST:
                                        let el = TreeView.siblingElement(_,name)
                                        if(el) {
                                            blinkClass(el, "bgflash", 400, 80);
                                        } else {
                                            console.error(`element ${TreeView.getId(_.parent)}.${name} not found`)
                                        }
                                }
                                return {...s, name, editingName: true};
                            }
                        }
                    } else {
                        return {...s, editingName: false};
                    }

                case OIA.editName:
                    //console.log("editing")
                    return {...s, editingName: true};

                case OIA.cancel: // back
                    //return {...s, editing: false};
                    return {...s, name:_.name, editingName: false};

                default:
                    throw new Error('Unexpected action');
            }
        };

        const [{name, editingName}, dispatch] = useReducer(reducer, initialState)

        return (
            <div class={`object-key ${editingName ? 'editing' : ''}`}

                 onClick={() => { // on double click. use click for dnd
                     console.log("editing")
                     dispatch(OIA.editName)
                     UndoStack.push(()=>dispatch(OIA.editName))
                 }}>
                {
                    editingName ? <AutosizeInput
                            spellCheck="false"
                            inputStyle={{
                                fontFamily: 'monospace',
                                border: '1px solid #999',
                                borderRadius: 3
                            }}
                            value={name}
                            ref={r => {r?.focus();}}
                            onBlur={() => dispatch(OIA.validateName) }
                            onKeyDown={evt => {
                                if (evt.which == 13) { // enter
                                    dispatch(OIA.validateName)
                                }
                                else if (evt.which == 27) {
                                    dispatch(OIA.cancel)
                                }}}

                            onChange={evt => {
                                console.log(evt.currentTarget.value)
                                //this.setState({name:e.currentTarget.value})
                                //name = e.target.value;
                                dispatch({type:OIA.inputName,
                                    payload:evt.currentTarget.value})
                            }}/>
                        : <div id={TreeView.getId(_)}>{_.name}</div>
                }
                :
            </div>
        )
    }
}



//const ObjectItem =(_:TNode, brace:string, addon:string='')=> {
class ObjectItem extends Component<ObjectItemProps> {
/**
 * the node could be put into the context
 */
    render = ({_, brace, addon}:ObjectItemProps, {}) => {
        //console.log(_.getId(),brace,addon)
        const initialState = {
            name: _.name,
            expanded: _.view?.expanded,
            editingName: false,
        };

        const expand = ()=>{ // boolean toggle. Invertible
            _.view.expanded = !_.view.expanded;
            console.log(_.view)
            localStorage.setItem("json13view",JSON.stringify(_.root.view));
            //console.log(JSON.stringify(_.root.view))
        }

        const expandAndRender =()=>{
            expand();
            this.forceUpdate();
        }

        const reducer = (state: ObjectItemLabelState, action: ObjectItemAction|ItemAction) => {
            let s = state;
            let {name, expanded, editingName} = state;
            if(typeof action == 'object') {
                switch (action.type) {
                    case OIA.inputName:
                        return {...s, name: action.payload, editing: true};
                }
            }
            switch (action) {
                case OIA.expand:
                    expand();
                    UndoStack.push(expandAndRender)
                    return {...s, expanded: _.view.expanded}
                default:
                    throw new Error('Unexpected action');
            }
        };

        const [{}, dispatch] = useReducer(reducer, initialState)

        return (
            <div draggable class={`tree-item ${_.isRoot ? 'root' : ''}`}>
                <div class="node-item">
                    {/*
                        _.parent
                        && (
                            _.index == _.parent.children.length - 1
                            && "└─"
                            || "├─ "
                        )
                        || null
                    }
                    { _.parent && _.parent.children.length */}
                    {
                        _.children.length
                        && <Expander expanded={_.view.expanded}
                                     onClick={() => dispatch(OIA.expand)}/>
                        || <span class="expand-space"/>
                    }
                    <TreeItemLabel _={_}/>
                    <span>
                        <span class="brace">{brace[0]}</span>
                        {
                            !_.view?.expanded
                            &&
                            <span>
                            {
                                _.children.length
                                && <span class='dots-3'>...</span>
                                || ''
                            }
                            <span class="brace">{brace[1]}</span>
                            </span>
                            }
                        {addon}
                    </span>
                    {
                        _.children.length > 0 &&
                        <span class="children-count">
                        &nbsp;{_.children.length}
                        </span>
                    }
                    {
                        _.view?.expanded && _.children.map(x => SelectItemRenderer(x.data)(x))
                    }
                    {
                        _.view?.expanded && <div class="brace">{brace[1]}</div>
                    }
                </div>

            </div>
        )
    }
}



interface IObjectItem  {
    _: TNode;
    brace: string;
    addon: string
}


interface EditableNode {
    expanded?:boolean,
    editingName:string,

}

interface HasClassName {
    className:string
}

class TreeItemValue extends Component<NodeProps & HasClassName> {

    render = ({_, className}:NodeProps & HasClassName, {}) => {
        //console.log(_.getId(),brace,addon)
        const initialState = {
            value: _.data,
            editingValue: false,
        };

        const reducer = (state: ObjectItemValueState, action: ObjectItemAction|ItemAction) => {
            let s = state;
            let {value, editingValue} = state;
            if(typeof action == 'object') {
                switch (action.type) {
                    case OIA.inputValue:
                        return {...s, value: action.payload, editingValue: true};
                }
            }
            switch (action) {

                case OIA.validateValue:
                    if(_.data != value) {
                        _.data = value;
                    } else {
                        return {...s, editingValue: false}; // ?
                    }
                    return {...s, editingValue: false};

                case OIA.editValue:
                    return {...s, editingValue: true};

                case OIA.cancel: // back
                    //return {...s, editing: false};
                    return {...s, value:_.data, editingValue: false};

                default:
                    throw new Error('Unexpected action ');
            }
        };

        const [{value, editingValue}, dispatch] = useReducer(reducer, initialState)

        return (
            <span
                 onClick={() => { // on double click. use click for dnd
                     dispatch(OIA.editValue)
                     UndoStack.push(()=>dispatch(OIA.editValue))
                 }}>
                {
                    editingValue
                        ? <AutosizeInput
                            spellCheck="false"
                            inputStyle={{
                                fontFamily: 'monospace',
                                border: '1px solid #999',
                                borderRadius: 3
                            }}
                            value={value}
                            ref={r => {r?.focus();}}
                            onBlur={() => dispatch(OIA.validateValue) }
                            onKeyDown={evt => {
                                //console.log(evt.key)
                                if (evt.which == 13) { // enter
                                    dispatch(OIA.validateValue)
                                }
                                else if (evt.which == 27) {
                                    dispatch(OIA.cancel)
                                }}}

                            onChange={evt => {
                                console.log(evt.currentTarget.value)
                                //this.setState({name:e.currentTarget.value})
                                //name = e.target.value;
                                dispatch({type:OIA.inputValue,
                                    payload:evt.currentTarget.value})
                            }}/>

                            : <span class={className}> "{_.data}"</span>
                }
            </span>
        )
    }
}

/*
const NodeItem =(_:TNode) =>
    <div className="tree-item">
        <span className="expand-space"/>
        <TreeItemLabel _={_}/>
        <span className="item-string-value"> "{_.data}"</span>
    </div>
*/

const StringNodeItem =(_:TNode) =>
        <div class="tree-item">
            <span class="expand-space"/>
            <TreeItemLabel _={_}/>
            <TreeItemValue className="item-string-value" _={_}/>
            <span class="item-string-value"> "{_.data}"</span>
        </div>

const NumberNodeItem =(_:TNode) =>
    <div class="tree-item">
        <span className="expand-space"/>
        <TreeItemLabel _={_}/>
        <span class="item-number-value"> {_.data}</span>
    </div>


const BooleanNodeItem =(_:TNode) =>
    <div className="tree-item" onClick={()=>{
        console.log(_)
    }}>
        <span className="expand-space"/>
        <TreeItemLabel _={_}/>
        <span className="item-boolean-value"> {String(_.data)}</span>
    </div>

const UndefinedNodeItem =(_:TNode) =>
    <div className="tree-item" onClick={()=>{
        console.log(_)
    }}>
        <span className="expand-space"/>
        <TreeItemLabel _={_}/>
        <span className="item-undefined-value"> undefined</span>
    </div>

const NullNodeItem =(N:TNode) =>
    <div className="tree-item" onClick={()=>{
        console.log(N)
    }}>
        <span className="expand-space"/>
        <TreeItemLabel _={N}/>
        <span className="item-null-value"> NULL</span>
    </div>

const FunctionNodeItem =(N:TNode) =>
    <div className="tree-item" onClick={()=>{
        console.log(N)
    }}>
        <span className="expand-space"/>
        <TreeItemLabel _={N}/>
        <span className="item-function-value"> ƒ {String(N.data)}</span>
    </div>


export function ObjectNodeItem (_:TNode) {
    return <ObjectItem _={_} brace={ACCOLADE}/>
}
export const ArrayNodeItem =(_:TNode)=> <ObjectItem _={_} brace={BRACE}/>


export function Vec3NodeItem (_:TNode) {
    console.log('VEC!')
    return <ObjectItem _={_} brace={ACCOLADE} addon={'VEC3'}/>
}

export function HSVNodeItem (_:TNode) {
    return <ObjectItem _={_} brace={ACCOLADE} addon={'HSV'}/>
}


const ObjectType =(x:object)=> {
    let k = Object.keys(x)

    if(k.length == 3) {
        if (k.every((v, i) => v == 'xyz'[i])) {
            return Vec3NodeItem
        }else if (k.every((v, i) => v == 'hsv'[i])) {
            return HSVNodeItem
        }
    }
    return ObjectNodeItem

}

/* once determined, set a property on this node
* and selected based on that.
* if the type changed, rerun this below
* */

const ItemRenderer = {
    "boolean"	: BooleanNodeItem,
    "string"	: StringNodeItem,
    "number"	: NumberNodeItem,
    "object"	: ObjectNodeItem,
    "undefined"	: UndefinedNodeItem,
    "function"	: FunctionNodeItem,
}

const SelectItemRenderer =(x:KnownType)=>
    x === null ? NullNodeItem :
    Array.isArray(x) ? ArrayNodeItem :
        typeof x == 'object' ? ObjectType(x) :
        ItemRenderer [String(typeof x)];
