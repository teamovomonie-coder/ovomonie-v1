"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const firstName = user?.fullName.split(' ')[0] || '';
  const lastName = user?.fullName.split(' ').slice(-1)[0] || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: ''
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.fullName.toLowerCase().replace(/\s+/g, '_'),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || user.phoneNumber || ''
      });
      setAvatarUrl(user.photoUrl || user.avatarUrl || '');
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Error", description: "Please select an image file" });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();
      setAvatarUrl(data.avatarUrl);
      
      // Update auth context immediately
      if (user) {
        user.photoUrl = data.avatarUrl;
        user.avatarUrl = data.avatarUrl;
      }
      
      toast({ title: "Success", description: "Profile photo updated" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload image" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: formData.username,
          avatarUrl: avatarUrl 
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update auth context
      if (user) {
        user.photoUrl = avatarUrl;
        user.avatarUrl = avatarUrl;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      // Refresh the page to update all avatars
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 p-4 sm:p-8 pt-6 bg-slate-50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Icons.ChevronLeft className="h-6 w-6 text-slate-700" />
              </button>
              <h1 className="text-lg font-semibold text-slate-900">Edit Profile</h1>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white">
              {isLoading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={avatarUrl || user?.photoUrl || user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-3xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => fileInputRef[1](el)}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef[0]?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploadingImage ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.Camera className="h-5 w-5" />}
              </button>
            </div>
            <button 
              onClick={() => fileInputRef[0]?.click()}
              disabled={isUploadingImage}
              className="text-slate-500 text-sm font-medium hover:text-slate-700 disabled:opacity-50"
            >
              {isUploadingImage ? "UPLOADING..." : "CHANGE PHOTO"}
            </button>
          </div>

          <div className="space-y-6 bg-white rounded-3xl p-6 shadow-sm">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Username</Label>
              <div className="relative">
                <Icons.AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10 h-12 border-slate-200 focus:border-primary rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Full Name</Label>
              <div className="relative">
                <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  value={formData.fullName}
                  disabled
                  className="pl-10 h-12 border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Email Address</Label>
              <div className="relative">
                <Icons.Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10 h-12 border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Phone Number</Label>
              <div className="relative">
                <Icons.Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  disabled
                  className="pl-10 h-12 border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
