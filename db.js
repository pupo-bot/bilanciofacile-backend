import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const defaultData = {
  users: [],
  transactions: [],
  clients: [],
  promemoria: [],
  automaticTransactions: []
};

const adapter = new JSONFile('db.json');
export const db = new Low(adapter, defaultData);

await db.read();
if (db.data === null) {
  db.data = defaultData;
  await db.write();
}
