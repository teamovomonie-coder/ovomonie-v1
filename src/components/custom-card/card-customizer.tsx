"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, ArrowLeft, CheckCircle, Truck, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

// --- Card Preview Component ---
const CardPreview = ({ image, name }: { image: string | null, name: string }) => (
  <div className="w-full max-w-sm aspect-[1.586] rounded-xl shadow-lg overflow-hidden bg-gray-200">
    <div className="relative w-full h-full">
      {image ? (
        <Image src={image} alt="Custom card preview" layout="fill" objectFit="cover" data-ai-hint="background pattern" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-blue-500" />
      )}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 bg-black/25">
        <div>
          <h3 className="text-white font-bold text-lg sm:text-xl">OVO Thrive</h3>
        </div>
        <div>
          <p className="text-white font-mono text-lg sm:text-xl tracking-widest text-shadow">
            4000 1234 5678 9010
          </p>
          <div className="flex justify-between items-end mt-1">
            <p className="text-white font-semibold uppercase text-sm sm:text-base text-shadow">
              {name || 'JOHN APPLESEED'}
            </p>
            <p className="text-white font-bold text-lg sm:text-xl italic text-shadow">VISA</p>
          </div>
        </div>
      </div>
    </div>
    <style jsx>{`
      .text-shadow {
        text-shadow: 0px 1px 3px rgba(0,0,0,0.5);
      }
    `}</style>
  </div>
);

// --- Zod Schemas for Validation ---
const cardDetailsSchema = z.object({
  nameOnCard: z.string().min(3, "Name is too short").max(22, "Name is too long"),
  image: z.any().optional(),
});

const shippingSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  address: z.string().min(10, "Please enter a full address."),
  city: z.string().min(3, "City is required."),
  state: z.string().min(2, "State is required."),
});

type CardDetailsForm = z.infer<typeof cardDetailsSchema>;
type ShippingForm = z.infer<typeof shippingSchema>;

type View = 'customize' | 'review' | 'success';

// --- Main Customizer Component ---
export function CardCustomizer() {
  const [view, setView] = useState<View>('customize');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const cardDetailsForm = useForm<CardDetailsForm>({
    resolver: zodResolver(cardDetailsSchema),
    defaultValues: { nameOnCard: "", image: null },
  });
  
  const shippingForm = useForm<ShippingForm>({
      resolver: zodResolver(shippingSchema),
      defaultValues: { fullName: "", address: "", city: "", state: "" },
  });

  const nameOnCard = cardDetailsForm.watch('nameOnCard');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: "destructive", title: "Image Too Large", description: "Please upload an image smaller than 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCardImage(result);
        cardDetailsForm.setValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomizationSubmit = () => {
    setView('review');
  };

  const handleOrderSubmit = async () => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 2000));
    setIsLoading(false);
    setView('success');
    toast({
        title: "Card Ordered!",
        description: "Your custom card design has been submitted.",
    });
  };

  const resetFlow = () => {
      cardDetailsForm.reset();
      shippingForm.reset();
      setCardImage(null);
      setView('customize');
  }

  const renderContent = () => {
    switch (view) {
      case 'review':
        return (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('customize')}><ArrowLeft/></Button>
                <div>
                  <CardTitle>Review Your Custom Card</CardTitle>
                  <CardDescription>Confirm your design and provide shipping details.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col items-center gap-2">
                <CardPreview image={cardImage} name={nameOnCard} />
                <p className="text-sm text-muted-foreground">Final Preview</p>
              </div>
              <div className="space-y-4">
                 <h3 className="text-lg font-semibold">Shipping Information</h3>
                 <Form {...shippingForm}>
                    <form id="shipping-form" onSubmit={shippingForm.handleSubmit(handleOrderSubmit)} className="space-y-3">
                         <FormField control={shippingForm.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={shippingForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Delivery Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={shippingForm.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={shippingForm.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         </div>
                    </form>
                 </Form>
              </div>
            </CardContent>
            <CardFooter>
                 <Button form="shipping-form" type="submit" className="w-full md:w-auto ml-auto" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Pay ₦1,500
                 </Button>
            </CardFooter>
          </motion.div>
        );
      case 'success':
        return (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <CardHeader className="items-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <CardTitle>Order Placed Successfully!</CardTitle>
              <CardDescription>Your custom card is being printed and will be shipped soon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
                <Truck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Estimated Delivery: Dec 15, 2024</p>
                  <p className="text-sm text-muted-foreground">You will be notified once it's shipped.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={resetFlow} className="w-full">Order Another Card</Button>
            </CardFooter>
          </motion.div>
        );
      case 'customize':
      default:
        return (
          <motion.div key="customize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CardHeader>
              <CardTitle>Customize Your ATM Card</CardTitle>
              <CardDescription>Express yourself! Personalize your card with a photo or logo.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <CardPreview image={cardImage} name={nameOnCard} />
                <p className="text-sm text-muted-foreground mt-2">Card Preview</p>
              </div>
              <div className="space-y-6">
                <Form {...cardDetailsForm}>
                    <form id="customize-form" onSubmit={cardDetailsForm.handleSubmit(handleCustomizationSubmit)} className="space-y-6">
                         <FormField control={cardDetailsForm.control} name="nameOnCard" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name on Card</FormLabel>
                                <FormControl><Input placeholder="JOHN APPLESEED" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />
                         <FormField control={cardDetailsForm.control} name="image" render={() => (
                            <FormItem>
                                <Label>Upload your design</Label>
                                <div className="relative">
                                  <Input id="image-upload" type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} className="absolute h-full w-full opacity-0 cursor-pointer" />
                                  <label htmlFor="image-upload" className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                    <div className="text-center">
                                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                      <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
                                    </div>
                                  </label>
                                </div>
                             </FormItem>
                         )} />
                    </form>
                </Form>
                <Alert variant="default" className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Copyright Warning</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Please ensure you own the rights to the image you are uploading. We moderate all submissions.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="customize-form" className="w-full md:w-auto ml-auto">Proceed to Review</Button>
            </CardFooter>
          </motion.div>
        );
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </Card>
  );
}
