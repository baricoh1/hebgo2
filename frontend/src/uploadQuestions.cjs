// scripts/uploadQuestions.js
const fs   = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. bootstrap admin with service-account creds
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve(__dirname, '../key.json'))
  ),
});

const db = admin.firestore();

// 2. load questions.json (adapt path/shape as needed)
const questions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../src/components/Questions.json'), 'utf8')
);

// 3. batch-write every question → /questions/{docId}
const batch = db.batch();

questions.forEach((q, idx) => {
  // if your JSON already has unique ids, use those instead of idx
  const docRef = db.collection('questions').doc(String(idx));
  batch.set(docRef, q);
});

batch
  .commit()
  .then(() => console.log('✅  All questions uploaded'))
  .catch(console.error);
