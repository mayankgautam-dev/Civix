// Firebase Authentication Service
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    updateProfile
} from 'firebase/auth';
import { auth } from './firebaseConfig';

const googleProvider = new GoogleAuthProvider();

// Google Sign-In
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        console.error('Google Sign-In Error:', error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }
};

// Email/Password Sign-In
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        console.error('Email Sign-In Error:', error);
        let message = 'Failed to sign in';
        if (error.code === 'auth/user-not-found') {
            message = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address';
        } else if (error.code === 'auth/invalid-credential') {
            message = 'Invalid email or password';
        }
        throw new Error(message);
    }
};

// Email/Password Sign-Up
export const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
): Promise<User> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Update user profile with display name
        await updateProfile(result.user, { displayName });
        return result.user;
    } catch (error: any) {
        console.error('Email Sign-Up Error:', error);
        let message = 'Failed to create account';
        if (error.code === 'auth/email-already-in-use') {
            message = 'An account with this email already exists';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password should be at least 6 characters';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address';
        }
        throw new Error(message);
    }
};

// Sign Out
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        console.error('Sign Out Error:', error);
        throw new Error('Failed to sign out');
    }
};

// Auth State Listener
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, callback);
};

// Get Current User
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

export type { User };
