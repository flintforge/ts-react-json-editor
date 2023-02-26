import { IDBPDatabase, openDB } from 'idb';

type ID = number

class IndexedDb {
    private readonly database: string;
    db:  IDBPDatabase;

    constructor(database: string) {
        this.database = database;
    }

    public async createObjectStore(collections: string[]) {
        try {
            this.db = await openDB(this.database, 1, {
                upgrade(db: IDBPDatabase) {
                    for (const collection of collections) {
                        if (db.objectStoreNames.contains(collection)) {
                            continue;
                        }
                        db.createObjectStore(collection, { autoIncrement: true, keyPath: 'id' });
                    }
                },
            });
        } catch (error) {
            return false;
        }
    }

    public async get(collection: string, id: number):Promise<object> {
        const tx = this.db.transaction(collection, 'readonly');
        const store = tx.objectStore(collection);
        const result = await store.get(id);
        console.log('Get Data ', JSON.stringify(result));
        return result;
    }

    public async getAll(collection: string):Promise<object[]> {
        const tx = this.db.transaction(collection, 'readonly');
        const store = tx.objectStore(collection);
        const result = await store.getAll();
        console.log('Get All Data', JSON.stringify(result));
        return result;
    }

    public async insert(collection: string, value: object) {
        const tx = this.db.transaction(collection, 'readwrite');
        const store = tx.objectStore(collection);
        const result = await store.put(value);
        console.log('Put Data ', JSON.stringify(result));
        return result;
    }

    public async insertMany(collection: string, values: object[]) {
        const tx = this.db.transaction(collection, 'readwrite');
        const store = tx.objectStore(collection);
        for (const value of values) {
            const result = await store.put(value);
            console.log('Put Bulk Data ', JSON.stringify(result));
        }
        return this.getAll(collection);
    }

    public async delete(collection: string, id: number):Promise<ID> {
        const tx = this.db.transaction(collection, 'readwrite');
        const store = tx.objectStore(collection);
        const result = await store.get(id);
        if (!result) {
            console.log('Id not found', id);
            return result;
        }
        await store.delete(id);
        console.log('Deleted Data', id);
        return id;
    }

    public async clear(collection:string) {
        await this.db.clear(collection)
    }
}

export default IndexedDb;