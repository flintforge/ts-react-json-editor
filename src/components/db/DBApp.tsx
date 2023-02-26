
import {h,Component,Fragment} from 'preact';
import MongoStorage from "db/MongoStorageFunc";
import {useState} from "preact/hooks";


export class DBApp extends Component<{}, {}> {
    private queryField: HTMLTextAreaElement|null;

    constructor() {
        super({});
        //this.queryField = HTMLTextAreaElement

        // Schema-less model
        // const Book = useLocalMongo('books')
        // Providing schema and options
        const schema = {
            name: { type: 'String', required: true },
            age:  { type: 'Number', default: 18 },
            hobbies: { type: 'Array', default: ['foot', 'tennis'] },
        }

        const options = {
            timestamps: true // allows the creation of createdAt and updatedAt fields.
        }

        const User = MongoStorage('users', schema, options)
        console.log(User.documents)

        let lastid:IDBCursor
        User.insert({name: 'Bob',age:27, hobbies:['tennis', 'foot']})
            .then((id) => console.log(id))
        const id = 'bca4ed840c2c2bf674eccc3c'
        User.updateOne(id, {name: 'New Name'})
            .then((user:object) => console.log(user))

        console.log(User.documents)
    }

    render=({},{query}:{query:string})=>(
        <>
        <textarea
            ref={r=>this.queryField=r}
            onKeyPress={e=> {
           if (e.key=="Enter") {
               console.log("ok", this.queryField?.value)
           }
       }}/>
       </>
    )
}

export const Counter2 = () => {
    let ls=""
    const [count, setCount] = useState(ls);
    const increment = () => setCount(count + "1");
    // You can also pass a callback to the setter
    const decrement = () => setCount((currentCount) => currentCount + "a");

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={increment}>Increment</button>
            <button onClick={decrement}>Decrement</button>
        </div>
    )
}
