import {h, Component, Fragment} from 'preact';
import idb from "db/idb"
import {useState} from "preact/hooks";


import React, {useEffect} from 'react';
import IndexedDb from './idb'

const Test = ({dbname="dialoguea", collection}:{dbname?:string, collection:string}) => {
    useEffect(() => {
        const testIndexDb = async () => {
            const idxdb = new IndexedDb(dbname);
            await idxdb.createObjectStore([collection]);
            await idxdb.insert(collection, {name: 'x'});
            await idxdb.insertMany(collection, [
                {name: 'y'},
                {name: 'z'}]);
            await idxdb.get(collection, 1);
            await idxdb.getAll(collection);
            //await idxdb.delete(collection, 1);
        }
        testIndexDb();
    }, []);
    return <></>
}


export const IDBApp = ({dbname}: { dbname: string }) => {

    const [collection, setCollection] = useState("books");
    const idxdb = new IndexedDb(dbname);
    idxdb.createObjectStore([collection]);

    return (
        <>
            <Test collection="books"/>
            Collection: {collection}
            <input
                value={collection}
                onKeyPress={async e => {
                    if (e.key == "Enter") {
                        setCollection((e.target as HTMLInputElement).value)
                        await idxdb.createObjectStore([collection]);
                    }
                }}/>
            Insert:
            <textarea
                onKeyPress={async e => {
                    if (e.key == "Enter") {
                        console.log(JSON.parse(JSON.stringify(
                            (e.target as HTMLTextAreaElement).value)))
                        await idxdb.insert(
                            collection,
                            JSON.parse(JSON.stringify(
                                (e.target as HTMLTextAreaElement).value)))
                    }
                }}/>
            Query:
            <input
                onKeyPress={e => {
                    if (e.key == "Enter") {
                        let id = (e.target as HTMLInputElement).value
                        idxdb.get(collection, Number(id))
                    }
                }}/>
            Delete:
            <input
                onKeyPress={e => {
                    if (e.key == "Enter") {
                        let id = (e.target as HTMLInputElement).value
                        idxdb.delete(collection, Number(id))
                        //console.log("ok", queryField?.value)
                    }
                }}/>

            <button
                value="clear"
                onClick={async () => {
                    await idxdb.clear(collection)
                }}>Clear
            </button>
        </>
    )
}



export class IDBApp0 extends Component<{}, {}> {
    private queryField: HTMLTextAreaElement | null;
    private insertField: HTMLTextAreaElement | null;
    private deleteField: HTMLTextAreaElement | null;
    private updateField: HTMLTextAreaElement | null;
    private collectionField: HTMLInputElement| null;
    collection: string

    constructor() {
        super({});

    }

    render = ({}, {query}: { query: string }) => (
        <>
            <Test collection="books"/>
            <input
                ref={r => this.collectionField = r}
                onKeyPress={e => {
                    if (e.key == "Enter") {
                        this.collection = this.collectionField!.value
                    }
                }}/>
            Query:
            <textarea
                ref={r => this.insertField = r}
                onKeyPress={e => {
                    if (e.key == "Enter") {
                        //idxdb.insert(this.collection, {name: 'A Game of Thrones'});
                        console.log("ok", this.queryField?.value)
                    }
                }}/>
            Insert:
            <textarea
                ref={r => this.queryField = r}
                onKeyPress={e => {
                    if (e.key == "Enter") {
                        console.log("ok", this.queryField?.value)
                    }
                }}/>
            Delete:
            <textarea
                ref={r => this.queryField = r}
                onKeyPress={e => {
                    if (e.key == "Enter") {
                        console.log("ok", this.queryField?.value)
                    }
                }}/>
        </>
    )
}
