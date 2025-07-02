
"use client";

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LogoutDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you'd call an API to invalidate the session token.
    // For this demo, we'll simulate the logout process.
    
    // 1. Show a success toast
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });

    // 2. Clear local storage/session tokens (simulated)
    // localStorage.removeItem('authToken');
    
    // 3. Redirect to the login page (homepage for this demo)
    // A full page reload is good practice after logout to clear any in-memory state.
    window.location.href = '/';
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be returned to the login screen and will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>
            Yes, Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
