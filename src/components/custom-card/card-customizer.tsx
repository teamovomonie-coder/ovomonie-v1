"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CardCustomizer() {
  const [cardImage, setCardImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    toast({
        title: "Card Ordered!",
        description: "Your custom card design has been submitted and will be delivered soon.",
    })
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Customize Your ATM Card</CardTitle>
        <CardDescription>Express yourself! Personalize your card with a photo or logo.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-sm aspect-[1.586] rounded-xl shadow-lg overflow-hidden bg-gray-200">
            {cardImage ? (
              <Image src={cardImage} alt="Custom card preview" layout="fill" objectFit="cover" data-ai-hint="background pattern" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-400 to-blue-500" />
            )}
            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-black/20">
                <div>
                    <h3 className="text-white font-bold text-xl">OVO Thrive</h3>
                </div>
                <div>
                    <p className="text-white font-mono text-xl tracking-widest">
                        4000 1234 5678 9010
                    </p>
                    <div className="flex justify-between items-end">
                        <p className="text-white font-semibold">JOHN APPLESEED</p>
                        <p className="text-white font-bold text-lg">VISA</p>
                    </div>
                </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Card Preview</p>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Upload your design</h3>
            <p className="text-sm text-muted-foreground">
              Choose a high-quality image. JPG, PNG, or GIF accepted.
            </p>
          </div>
          <div className="relative">
            <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="absolute h-full w-full opacity-0 cursor-pointer" />
            <label htmlFor="image-upload" className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
              </div>
            </label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full md:w-auto ml-auto">Order My Custom Card</Button>
      </CardFooter>
    </Card>
  );
}
