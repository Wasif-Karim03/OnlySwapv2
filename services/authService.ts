import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserData {
  firstName: string;
  lastName: string;
  university: string;
  email: string;
  createdAt: Timestamp;
}

/**
 * Create a new user account with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  university: string
): Promise<{ user: User }> => {
  try {
    // Normalize email and university to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUniversity = university.trim();

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    const user = userCredential.user;

    // Create user data object
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      university: normalizedUniversity,
      email: normalizedEmail,
      createdAt: serverTimestamp(),
    };

    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    return { user };
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User; userData: UserData | null }> => {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    const user = userCredential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? (userDoc.data() as UserData) : null;

    return { user, userData };
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to sign in. Please try again.');
    }
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out. Please try again.');
  }
};

/**
 * Get the current authenticated user's data
 */
export const getCurrentUserData = async (): Promise<UserData | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() ? (userDoc.data() as UserData) : null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user data.');
  }
};

