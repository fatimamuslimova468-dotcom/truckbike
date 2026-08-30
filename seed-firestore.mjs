import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath) {
  throw new Error('Укажи GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json');
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const products = JSON.parse(fs.readFileSync(new URL('../products.seed.json', import.meta.url), 'utf8'));
const categories = JSON.parse(fs.readFileSync(new URL('../categories.seed.json', import.meta.url), 'utf8'));

async function seedCollection(name, items, idFactory) {
  const batch = db.batch();
  items.forEach((item, index) => {
    const id = idFactory(item, index);
    batch.set(db.collection(name).doc(id), item, { merge: true });
  });
  await batch.commit();
  console.log(`${name}: ${items.length} документов готовы`);
}

await seedCollection('categories', categories, (item) => item.key);
await seedCollection('products', products, (item, index) => item.slug || `${String(index + 1).padStart(3, '0')}-${item.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '')}`);

console.log('Firestore инициализирован. Коллекции: categories, products. Пользовательские документы users/{uid} и orders создаются приложением автоматически.');
