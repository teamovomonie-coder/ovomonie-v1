import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { logger } from '@/lib/logger';


export async function GET() {
    try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const locations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(locations);
    } catch (error) {
        logger.error("Error fetching locations: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const docRef = await addDoc(collection(db, "locations"), {
            ...body,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return NextResponse.json({ id: docRef.id, ...body }, { status: 201 });
    } catch (error) {
        logger.error("Error creating location: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
