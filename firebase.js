import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  onAuthStateChanged,
  multiFactor,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { getAnalytics, isSupported as analyticsSupported } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCn5xqiGIdjAcmpn-wI3KU1JL03MLiRxas',
  authDomain: 'nexora-28ce9.firebaseapp.com',
  projectId: 'nexora-28ce9',
  storageBucket: 'nexora-28ce9.firebasestorage.app',
  messagingSenderId: '519608324015',
  appId: '1:519608324015:web:7abddbaf489068d7e3695a',
  measurementId: 'G-Q52XXZBLFK'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

analyticsSupported().then((supported) => {
  if (supported) getAnalytics(app);
}).catch(() => {});

export { auth, db };

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signUp(email, password, name) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name?.trim()) await updateProfile(credential.user, { displayName: name.trim() });
  await ensureUserDocument(credential.user);
  try { await sendEmailVerification(credential.user); } catch (_) {}
  return credential.user;
}

export async function signIn(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDocument(credential.user);
    return credential.user;
  } catch (error) {
    if (error.code === 'auth/multi-factor-auth-required') {
      error.mfaResolver = getMultiFactorResolver(auth, error);
    }
    throw error;
  }
}

export async function resolveTotpSignIn(resolver, code) {
  const hint = resolver.hints.find((item) => item.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) throw new Error('Для аккаунта не найден TOTP-фактор.');
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
  const credential = await resolver.resolveSignIn(assertion);
  await ensureUserDocument(credential.user);
  return credential.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerification() {
  if (!auth.currentUser) throw new Error('Пользователь не авторизован');
  await sendEmailVerification(auth.currentUser);
}

export async function signOutCurrentUser() {
  await signOut(auth);
}

export async function updateAuthDisplayName(name) {
  if (!auth.currentUser) throw new Error('Пользователь не авторизован');
  await updateProfile(auth.currentUser, { displayName: name.trim() });
}

export async function ensureUserDocument(user) {
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      email: user.email || '',
      role: 'user',
      blocked: false,
      profile: {
        name: user.displayName || '',
        phone: '',
        city: '',
        preferredPayment: 'card',
        email: user.email || '',
        settings: { push: true, promo: true, theme: 'light', totpEnabled: false }
      },
      favorites: [],
      cart: [],
      addresses: [],
      cards: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    const current = existing.data() || {};
    const profile = current.profile || {};
    const patch = {};
    if (!profile.name && user.displayName) patch['profile.name'] = user.displayName;
    if (!profile.email && user.email) patch['profile.email'] = user.email;
    if (profile.city === undefined) patch['profile.city'] = '';
    if (profile.preferredPayment === undefined) patch['profile.preferredPayment'] = 'card';
    if (profile.settings?.theme === undefined) patch['profile.settings.theme'] = profile.settings?.dark ? 'dark' : 'light';
    if (Object.keys(patch).length) await updateDoc(ref, patch);
  }
}

export async function loadProducts() {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function loadCategories() {
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function loadUserState(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : {};
}

export async function saveUserState(uid, data) {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function loadOrders(uid) {
  const ordersQuery = query(collection(db, 'users', uid, 'orders'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function createOrder(uid, data) {
  const ref = await addDoc(collection(db, 'users', uid, 'orders'), { ...data, createdAt: serverTimestamp() });
  return { id: ref.id, ...data, createdAt: null };
}

export async function createSupportTicket(uid, data) {
  const ref = await addDoc(collection(db, 'supportTickets'), {
    userId: uid,
    email: auth.currentUser?.email || '',
    ...data,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: ref.id, uid, ...data, status: 'open', createdAt: null };
}

export async function loadSupportTickets(uid) {
  const q = query(collection(db, 'supportTickets'), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function beginTotpEnrollment(password) {
  const user = auth.currentUser;
  if (!user) throw new Error('Войди в аккаунт');
  if (!user.emailVerified) throw new Error('Сначала подтверди email. MFA требует подтверждённый адрес.');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const uri = secret.generateQrCodeUrl(user.email, 'Truck Bike');
  return { secret, secretKey: secret.secretKey, uri };
}

export async function finishTotpEnrollment(secret, code, displayName = 'Truck Bike Authenticator') {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
  await multiFactor(auth.currentUser).enroll(assertion, displayName);
  await saveUserState(auth.currentUser.uid, { 'profile.settings.totpEnabled': true });
}

export async function disableTotpEnrollment(factorUid, password) {
  const user = auth.currentUser;
  if (!user) throw new Error('Войди в аккаунт');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await multiFactor(user).unenroll(factorUid);
  await saveUserState(user.uid, { 'profile.settings.totpEnabled': false });
}

export function getEnrolledTotpFactors() {
  return (auth.currentUser ? multiFactor(auth.currentUser).enrolledFactors : [])
    .filter((factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}
