"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  recipient: z.string().min(2, 'Recipient name is too short.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  message: z.string().max(150, 'Message is too long.').optional(),
  photo: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

function MemoReceipt({ data, onReset }: { data: FormData; onReset: () => void }) {
    const { toast } = useToast();
    const handleShare = () => {
        toast({
            title: "Shared!",
            description: "Your memorable receipt has been shared.",
        });
    }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg">
      <CardHeader className="text-center bg-primary text-primary-foreground p-4 rounded-t-lg">
        <CardTitle>Transfer Successful!</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {data.photo && (
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
            <Image src={data.photo} alt="Recipient" layout="fill" objectFit="cover" data-ai-hint="person" />
          </div>
        )}
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">You sent</p>
          <p className="text-4xl font-bold text-primary">
            ₦{data.amount.toLocaleString()}
          </p>
          <p className="text-muted-foreground">to</p>
          <p className="text-xl font-semibold">{data.recipient}</p>
        </div>
        {data.message && (
          <blockquote className="mt-4 border-l-2 pl-4 italic text-center">
            "{data.message}"
          </blockquote>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-6 pt-0">
        <Button className="w-full" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share Receipt
        </Button>
        <Button variant="outline" className="w-full" onClick={onReset}>
          Make Another Transfer
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TransferForm() {
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { recipient: '', amount: undefined, message: '' },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      form.setValue('photo', file);
    }
  };

  function onSubmit(data: FormData) {
    const dataWithPhoto = { ...data, photo: photoPreview };
    setSubmittedData(dataWithPhoto);
  }

  const resetForm = () => {
    setSubmittedData(null);
    setPhotoPreview(null);
    form.reset();
  }

  if (submittedData) {
    return <MemoReceipt data={submittedData} onReset={resetForm} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient's Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₦)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="photo"
          render={() => (
            <FormItem>
              <FormLabel>Add a Photo</FormLabel>
              <FormControl>
                <div className="relative">
                    <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="absolute h-full w-full opacity-0 cursor-pointer" />
                    <label htmlFor="photo-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        {photoPreview ? (
                            <Image src={photoPreview} alt="Preview" width={100} height={100} className="object-contain h-full" data-ai-hint="person" />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <Upload className="mx-auto h-8 w-8" />
                                <p>Click to upload</p>
                            </div>
                        )}
                    </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Message</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Happy Birthday!" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Send Money
        </Button>
      </form>
    </Form>
  );
}
