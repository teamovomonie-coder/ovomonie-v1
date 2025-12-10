
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';


// GET all posts
export async function GET() {
    try {
        const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const posts = await Promise.all(querySnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();
            
            // Fetch author details
            const userRef = doc(db, 'users', postData.userId);
            const userSnap = await getDoc(userRef);
            const authorName = userSnap.exists() ? userSnap.data().fullName : 'Anonymous';
            const authorAvatarUrl = 'https://placehold.co/40x40.png'; // Placeholder

            return {
                id: postDoc.id,
                ...postData,
                createdAt: postData.createdAt.toDate().toISOString(),
                authorName,
                authorAvatarUrl,
                likes: postData.likes || 0,
                comments: postData.comments || 0,
            };
        }));

        return NextResponse.json(posts);
    } catch (error) {
        logger.error("Error fetching community posts:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST a new post
export async function POST(request: Request) {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, content, imageUrl } = body;

        if (!title || !content) {
            return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
        }

        const newPost = {
            userId,
            title,
            content,
            imageUrl: imageUrl || null,
            likes: 0,
            comments: 0,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "communityPosts"), newPost);
        
        return NextResponse.json({ message: 'Post created successfully!', postId: docRef.id }, { status: 201 });
    } catch (error) {
        logger.error("Error creating post:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
