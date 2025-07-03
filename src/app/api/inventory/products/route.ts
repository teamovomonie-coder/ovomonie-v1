import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export async function GET() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Firestore will automatically generate an ID
        const docRef = await addDoc(collection(db, "products"), {
            ...body,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return NextResponse.json({ id: docRef.id, ...body }, { status: 201 });
    } catch (error) {
        console.error("Error creating product: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
