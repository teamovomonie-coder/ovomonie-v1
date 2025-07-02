
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { inecCenters, nigerianStates } from "@/lib/inec-data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { ArrowLeft, CheckCircle, Fingerprint, Camera, Upload, CalendarIcon, Loader2, VideoOff } from "lucide-react";

const personalDetailsSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  dob: z.date({ required_error: "Date of birth is required." }).refine(date => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        return age - 1 >= 18;
    }
    return age >= 18;
  }, "You must be at least 18 years old."),
  gender: z.string().min(1, "Please select a gender."),
  state: z.string().min(1, "Please select your state of residence."),
  phone: z.string().length(11, "A valid 11-digit phone number is required."),
  email: z.string().email("Invalid email address."),
});

const documentSchema = z.object({
  passport: z.any().optional(),
  addressProof: z.any().optional(),
  ageProof: z.any().optional(),
});

const centerSchema = z.object({
  collectionCenter: z.string().min(1, "Please select a collection center."),
});

type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;
type DocumentData = z.infer<typeof documentSchema>;
type CenterData = z.infer<typeof centerSchema>;
type FullRegistrationData = PersonalDetailsData & DocumentData & CenterData & { selfie?: string };


const steps = [
  { id: 1, name: "Personal Details" },
  { id: 2, name: "Biometric Capture" },
  { id: 3, name: "Document Upload" },
  { id: 4, name: "Center Selection" },
  { id: 5, name: "Review & Submit" },
  { id: 6, name: "Confirmation" },
];

export function VoterRegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FullRegistrationData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const handleNext = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
  };
  
  const handleBack = () => setCurrentStep(prev => prev - 1);
  
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 2000));
    setIsSubmitting(false);
    toast({ title: "Registration Submitted!", description: "Your details have been sent to INEC for verification." });
    setCurrentStep(prev => prev + 1);
  };
  
  const resetFlow = () => {
    setFormData({});
    setCurrentStep(0);
  }

  const renderContent = () => {
    switch(currentStep) {
        case 0: return <PersonalDetailsForm onNext={handleNext} initialData={formData} />;
        case 1: return <BiometricStep onNext={handleNext} onBack={handleBack} />;
        case 2: return <DocumentUploadStep onNext={handleNext} onBack={handleBack} />;
        case 3: return <CenterSelectionStep onNext={handleNext} onBack={handleBack} stateOfResidence={formData.state} />;
        case 4: return <ReviewStep data={formData} onBack={handleBack} onSubmit={handleFinalSubmit} isSubmitting={isSubmitting} />;
        case 5: return <ConfirmationStep onDone={resetFlow} />;
        default: return null;
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Voter's Card Registration (CVR)</CardTitle>
        <CardDescription>Follow the steps to register for your Permanent Voter's Card (PVC).</CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
         <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                  {renderContent()}
              </motion.div>
         </AnimatePresence>
      </CardContent>
    </Card>
  );
}


function PersonalDetailsForm({ onNext, initialData }: { onNext: (data: PersonalDetailsData) => void; initialData: Partial<PersonalDetailsData> }) {
  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      fullName: initialData.fullName || '',
      dob: initialData.dob,
      gender: initialData.gender || '',
      state: initialData.state || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
    },
  });

  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 1: Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name (as on NIN/BVN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1940} toYear={2006} selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State of Residence</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl><SelectContent>{nigerianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} type="tel" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
        </div>
         <div className="flex justify-end">
            <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}

function BiometricStep({ onNext, onBack }: { onNext: (data: { selfie: string }) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
      }
    };
    getCameraPermission();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);
  
  const handleCapture = () => {
    // In a real app, you'd capture a frame and convert to data URI
    onNext({ selfie: 'data:image/jpeg;base64,...' });
  };

  return (
     <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 2: Biometric Capture</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader><CardTitle>Facial Capture</CardTitle><CardDescription>Position your face in the center of the frame.</CardDescription></CardHeader>
            <CardContent>
                <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    {hasCameraPermission === false && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4"><VideoOff className="w-12 h-12 mb-2" /><p>Camera access denied</p></div>}
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle>Fingerprint Capture</CardTitle><CardDescription>This will be done at the collection center.</CardDescription></CardHeader>
            <CardContent className="flex items-center justify-center h-48">
                <div className="text-center text-muted-foreground">
                    <Fingerprint className="w-16 h-16 mx-auto" />
                    <p className="mt-2">Fingerprint capture is not required online.</p>
                </div>
            </CardContent>
        </Card>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="button" onClick={handleCapture} disabled={!hasCameraPermission}>Capture & Continue</Button>
      </div>
    </div>
  )
}

function DocumentUploadStep({ onNext, onBack }: { onNext: (data: DocumentData) => void; onBack: () => void }) {
  const form = useForm<DocumentData>({ resolver: zodResolver(documentSchema) });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 3: Document Upload</h3>
        <FormField control={form.control} name="passport" render={({ field }) => ( <FormItem><FormLabel>Passport Photograph (white background)</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="addressProof" render={({ field }) => ( <FormItem><FormLabel>Proof of Address (Utility Bill)</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg, application/pdf" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="ageProof" render={({ field }) => ( <FormItem><FormLabel>Proof of Age (Birth Certificate/Affidavit)</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg, application/pdf" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>Back</Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}

function CenterSelectionStep({ onNext, onBack, stateOfResidence }: { onNext: (data: CenterData) => void; onBack: () => void, stateOfResidence?: string }) {
    const form = useForm<CenterData>({ resolver: zodResolver(centerSchema) });
    const availableCenters = stateOfResidence ? inecCenters[stateOfResidence as keyof typeof inecCenters] || [] : [];
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
                 <h3 className="text-lg font-semibold">Step 4: Select Collection Center</h3>
                 <FormField control={form.control} name="collectionCenter" render={({ field }) => ( <FormItem><FormLabel>PVC Collection Center</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!stateOfResidence}>
                    <FormControl><SelectTrigger><SelectValue placeholder={stateOfResidence ? "Select a center" : "Select state first"} /></SelectTrigger></FormControl>
                    <SelectContent>{availableCenters.map(center => <SelectItem key={center} value={center}>{center}</SelectItem>)}</SelectContent>
                 </Select><FormMessage /></FormItem>)} />
                {!stateOfResidence && <Alert variant="destructive"><AlertTitle>No State Selected</AlertTitle><AlertDescription>Please go back to Step 1 and select your state of residence to see available centers.</AlertDescription></Alert>}
                 <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                    <Button type="submit" disabled={!stateOfResidence}>Next</Button>
                </div>
            </form>
        </Form>
    )
}

function ReviewStep({ data, onBack, onSubmit, isSubmitting }: { data: Partial<FullRegistrationData>, onBack: () => void, onSubmit: () => void, isSubmitting: boolean }) {
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-semibold">Step 5: Review Your Details</h3>
             <Card>
                <CardContent className="pt-6 space-y-4">
                    <p className="font-semibold">Personal Details</p>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-muted-foreground">Full Name:</span><span>{data.fullName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth:</span><span>{data.dob ? format(data.dob, 'PPP') : ''}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">State of Residence:</span><span>{data.state}</span></div>
                    </div>
                     <p className="font-semibold">Documents</p>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-muted-foreground">Biometrics:</span><span className="text-green-600">Captured</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Documents:</span><span className="text-green-600">Uploaded</span></div>
                    </div>
                     <p className="font-semibold">Collection Center</p>
                    <p className="text-sm">{data.collectionCenter}</p>
                </CardContent>
             </Card>
             <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Declaration</AlertTitle>
                <AlertDescription>I hereby declare that all the information I have provided is true and correct to the best of my knowledge.</AlertDescription>
            </Alert>
             <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
                <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Submit
                </Button>
            </div>
        </div>
    )
}

function ConfirmationStep({ onDone }: { onDone: () => void }) {
    return (
        <div className="text-center p-8 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
            <p className="text-muted-foreground max-w-md mb-6">Your registration has been successfully submitted to INEC. You will receive an email confirmation shortly. You can track the status of your PVC from your profile.</p>
            <div className="w-full max-w-sm">
                <Card className="text-left">
                    <CardHeader><CardTitle>What's Next?</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>1. INEC will verify your details.</p>
                        <p>2. You will be notified when your PVC is ready for collection.</p>
                        <p>3. Visit your selected center with your NIN slip to collect your card.</p>
                    </CardContent>
                </Card>
                 <Button onClick={onDone} className="w-full mt-6">Back to Dashboard</Button>
            </div>
        </div>
    )
}
