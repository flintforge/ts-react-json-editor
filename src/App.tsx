
import {h, render} from 'preact';
import {Provider} from "unistore/preact";
import {store} from 'counter/store';
import {Counter} from 'counter';
import {TreeApp} from 'tree/TreeApp'
import {IDBApp} from 'db/IDBApp'
import test from 'test'
//import {WebApp} from 'MAIN'
//import {Extended} from "./tests/binder";


declare global {
    /* declare things that goes in the global namespace,
     * or augment existing declarations in that global namespace
     */
    type int = number
    type Optional<T> = T | undefined;
}

declare namespace React {
    interface HTMLAttributes<T> {
        // Preact supports using "class" instead of "classname"
        class?: string;
    }
}

render(
    // hot(Application),
    <div>
        {/*WebApp/>*/}
        <IDBApp dbname="dialoguea"/>
        <hr/>
        <TreeApp/>
        <Provider store={store}>
            <Counter/>
            {/*<Extended someProperty="boo"/>*/}
        </Provider>
    </div>,
    document.getElementById('app') as Element);

/** --------------------------------------------------- **/