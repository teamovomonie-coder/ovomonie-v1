
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { nigerianStates } from "@/lib/inec-data"; // Re-using for states
import { frscTestCenters } from "@/lib/frsc-data";
import Image from "next/image";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Icons
import { ArrowLeft, CheckCircle, Fingerprint, Camera, Upload, CalendarIcon, Loader2, VideoOff, Wallet, Car, RefreshCw, FileQuestion } from "lucide-react";

// Schemas
const applicationTypeSchema = z.object({
  type: z.enum(["new", "renewal", "reissue"], { required_error: "Please select an application type." }),
});

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
  stateOfResidence: z.string().min(1, "Please select your state of residence."),
  bloodGroup: z.string().min(1, "Please select your blood group."),
  phone: z.string().length(11, "A valid 11-digit phone number is required."),
});

const documentSchema = z.object({
  passportPhoto: z.any().optional(),
  medicalCertificate: z.any().optional(),
});

const testCenterSchema = z.object({
  center: z.string().min(1, "Please select a test center."),
  date: z.date({ required_error: "Please select a test date." }),
});

type ApplicationTypeData = z.infer<typeof applicationTypeSchema>;
type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;
type DocumentData = z.infer<typeof documentSchema>;
type TestCenterData = z.infer<typeof testCenterSchema>;
type FullApplicationData = ApplicationTypeData & PersonalDetailsData & DocumentData & TestCenterData & { selfie?: string };

const steps = [
  { id: 1, name: "Application Type" },
  { id: 2, name: "Personal Details" },
  { id: 3, name: "Biometric Capture" },
  { id: 4, name: "Document Upload" },
  { id: 5, name: "Book Driving Test" },
  { id: 6, name: "Payment" },
  { id: 7, name: "Confirmation" },
];

export function FrscLicenseFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FullApplicationData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const handleNext = (data: any) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    // Skip test booking for renewals/re-issues
    if (currentStep === 3 && (updatedData.type === 'renewal' || updatedData.type === 'reissue')) {
        setCurrentStep(5); // Skip to payment
    } else {
        setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
     // Skip back over test booking for renewals/re-issues
     if (currentStep === 5 && (formData.type === 'renewal' || formData.type === 'reissue')) {
        setCurrentStep(3);
    } else {
        setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 2000));
    setIsSubmitting(false);
    toast({ title: "Application Submitted!", description: "Your details have been sent to FRSC for verification." });
    setCurrentStep(prev => prev + 1);
  };
  
  const resetFlow = () => {
    setFormData({});
    setCurrentStep(0);
  }

  const renderContent = () => {
    switch(currentStep) {
        case 0: return <ApplicationTypeStep onNext={handleNext} initialData={formData} />;
        case 1: return <PersonalDetailsStep onNext={handleNext} onBack={handleBack} initialData={formData} />;
        case 2: return <BiometricStep onNext={handleNext} onBack={handleBack} />;
        case 3: return <DocumentUploadStep onNext={handleNext} onBack={handleBack} />;
        case 4: return <TestCenterStep onNext={handleNext} onBack={handleBack} stateOfResidence={formData.stateOfResidence} initialData={formData} />;
        case 5: return <PaymentStep onNext={handleFinalSubmit} onBack={handleBack} applicationType={formData.type} isSubmitting={isSubmitting} />;
        case 6: return <ConfirmationStep onDone={resetFlow} data={formData} />;
        default: return null;
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>FRSC Driver's License</CardTitle>
        <CardDescription>Apply for or renew your Nigerian Driver's License.</CardDescription>
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

function ApplicationTypeStep({ onNext, initialData }: { onNext: (data: ApplicationTypeData) => void; initialData: Partial<ApplicationTypeData> }) {
  const form = useForm<ApplicationTypeData>({
    resolver: zodResolver(applicationTypeSchema),
    defaultValues: { type: initialData.type || 'new' }
  });

  const appTypes = [
      { id: 'new', label: 'New License Application', icon: Car },
      { id: 'renewal', label: 'License Renewal', icon: RefreshCw },
      { id: 'reissue', label: 'License Re-issue (Lost/Damaged)', icon: FileQuestion },
  ]
  
  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
             <h3 className="text-lg font-semibold">Step 1: What would you like to do?</h3>
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                         <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {appTypes.map(type => (
                                <FormItem key={type.id}>
                                    <FormControl><RadioGroupItem value={type.id} id={type.id} className="sr-only" /></FormControl>
                                    <FormLabel htmlFor={type.id} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary h-full">
                                        <type.icon className="mb-3 h-8 w-8 text-primary" />
                                        {type.label}
                                    </FormLabel>
                                </FormItem>
                            ))}
                         </RadioGroup>
                    </FormItem>
                )}
            />
            <div className="flex justify-end pt-4">
                <Button type="submit">Next</Button>
            </div>
        </form>
    </Form>
  )
}

function PersonalDetailsStep({ onNext, onBack, initialData }: { onNext: (data: PersonalDetailsData) => void; onBack: () => void; initialData: Partial<PersonalDetailsData> }) {
  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
        fullName: '',
        gender: '',
        stateOfResidence: '',
        bloodGroup: '',
        phone: '',
        ...initialData
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 2: Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name (as on NIN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1940} toYear={new Date().getFullYear() - 18} selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="stateOfResidence" render={({ field }) => ( <FormItem><FormLabel>State of Residence</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl><SelectContent>{nigerianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="bloodGroup" render={({ field }) => ( <FormItem><FormLabel>Blood Group</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger></FormControl><SelectContent>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} type="tel" /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>Back</Button>
            <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}

function BiometricStep({ onNext, onBack }: { onNext: (data: { selfie: string }) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [captureStage, setCaptureStage] = useState<'selfie_countdown' | 'selfie_captured' | 'fingerprint_prompt' | 'fingerprint_scanning' | 'fingerprint_done'>('selfie_countdown');
  const [countdown, setCountdown] = useState(3);
  const { toast } = useToast();

  useEffect(() => {
    const getCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            setHasCameraPermission(false);
            toast({ variant: 'destructive', title: 'Camera Access Denied' });
        }
    };
    getCamera();
    return () => { if (videoRef.current && videoRef.current.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop()); } }
  }, [toast]);
  
  useEffect(() => {
    if (captureStage === 'selfie_countdown' && hasCameraPermission && countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    } else if (captureStage === 'selfie_countdown' && countdown === 0) {
        const selfie = 'https://placehold.co/400x400.png';
        setSelfieData(selfie);
        setCaptureStage('selfie_captured');
        if (videoRef.current && videoRef.current.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        const nextStageTimer = setTimeout(() => setCaptureStage('fingerprint_prompt'), 1000);
        return () => clearTimeout(nextStageTimer);
    }
  }, [captureStage, countdown, hasCameraPermission]);

  useEffect(() => {
      if (captureStage === 'fingerprint_scanning') {
          const timer = setTimeout(() => {
              setCaptureStage('fingerprint_done');
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [captureStage, toast]);
  
  return (
     <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 3: Biometric Capture</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <CardHeader><CardTitle>Facial Capture</CardTitle></CardHeader>
            <CardContent>
                <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted data-ai-hint="person face" />
                    {hasCameraPermission === false && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4"><VideoOff className="w-12 h-12 mb-2" /><p>Camera access denied</p></div>}
                    {captureStage === 'selfie_countdown' && countdown > 0 && hasCameraPermission && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-8xl font-bold text-white">{countdown}</p></div>
                    )}
                    {captureStage === 'selfie_captured' && (
                         <div className="absolute inset-0 flex items-center justify-center bg-green-900/80"><CheckCircle className="w-16 h-16 text-white" /></div>
                    )}
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle>Fingerprint Capture</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center h-48">
                {captureStage === 'fingerprint_prompt' && (<Button onClick={() => setCaptureStage('fingerprint_scanning')}>Start Fingerprint Scan</Button>)}
                {captureStage === 'fingerprint_scanning' && (<div className="text-center text-muted-foreground"><Fingerprint className="w-16 h-16 mx-auto text-primary animate-pulse" /><p className="mt-2 font-semibold">Scanning...</p></div>)}
                {captureStage === 'fingerprint_done' && (<div className="text-center text-green-600"><CheckCircle className="w-16 h-16 mx-auto" /><p className="mt-2 font-semibold">Fingerprint Captured</p></div>)}
                {(captureStage === 'selfie_countdown' || captureStage === 'selfie_captured') && (<div className="text-center text-muted-foreground"><p>Waiting for facial capture...</p></div>)}
            </CardContent>
        </Card>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={() => onNext({ selfie: selfieData! })} disabled={captureStage !== 'fingerprint_done'}>Next</Button>
      </div>
    </div>
  )
}

function DocumentUploadStep({ onNext, onBack }: { onNext: (data: DocumentData) => void; onBack: () => void }) {
  const form = useForm<DocumentData>({ resolver: zodResolver(documentSchema) });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <h3 className="text-lg font-semibold">Step 4: Document Upload</h3>
        <FormField control={form.control} name="passportPhoto" render={({ field }) => ( <FormItem><FormLabel>Passport Photograph (white background)</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="medicalCertificate" render={({ field }) => ( <FormItem><FormLabel>Medical Certificate of Fitness</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg, application/pdf" onChange={e => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>Back</Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}

function TestCenterStep({ onNext, onBack, stateOfResidence, initialData }: { onNext: (data: TestCenterData) => void; onBack: () => void; stateOfResidence?: string, initialData?: Partial<TestCenterData> }) {
    const form = useForm<TestCenterData>({ 
        resolver: zodResolver(testCenterSchema), 
        defaultValues: {
            center: '',
            date: addDays(new Date(), 7),
            ...initialData
        } 
    });
    const availableCenters = stateOfResidence ? frscTestCenters[stateOfResidence as keyof typeof frscTestCenters] || [] : [];
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
                 <h3 className="text-lg font-semibold">Step 5: Book Your Driving Test</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="center" render={({ field }) => ( <FormItem><FormLabel>FRSC Test Center</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!stateOfResidence}>
                        <FormControl><SelectTrigger><SelectValue placeholder={stateOfResidence ? "Select a center" : "Select state first"} /></SelectTrigger></FormControl>
                        <SelectContent>{availableCenters.map(center => <SelectItem key={center} value={center}>{center}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Preferred Test Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < addDays(new Date(), 1)} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                 </div>
                 {!stateOfResidence && <Alert variant="destructive"><AlertTitle>No State Selected</AlertTitle><AlertDescription>Please go back to Step 2 and select your state of residence.</AlertDescription></Alert>}
                 <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                    <Button type="submit" disabled={!stateOfResidence}>Next</Button>
                </div>
            </form>
        </Form>
    )
}

function PaymentStep({ onNext, onBack, applicationType, isSubmitting }: { onNext: () => void, onBack: () => void, applicationType?: string, isSubmitting: boolean }) {
    const fee = applicationType === 'new' ? 15000 : 10000;
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-semibold">Step 6: Payment</h3>
             <Card>
                <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span>License Fee:</span>
                        <span className="font-bold">₦{fee.toLocaleString()}</span>
                    </div>
                    <Alert><Wallet className="h-4 w-4" /><AlertTitle>Pay from Ovomonie Wallet</AlertTitle><AlertDescription>The fee will be deducted directly from your account balance.</AlertDescription></Alert>
                </CardContent>
             </Card>
             <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
                <Button onClick={onNext} disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay & Submit Application
                </Button>
            </div>
        </div>
    );
}

function ConfirmationStep({ onDone, data }: { onDone: () => void, data: Partial<FullApplicationData> }) {
    return (
        <div className="text-center p-8 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground max-w-md mb-6">Your application has been sent to FRSC. You will be notified of any updates.</p>
            <div className="w-full max-w-sm">
                <Card className="text-left shadow-lg">
                     <CardHeader className="p-3 bg-blue-800 text-white flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image src="https://placehold.co/40x40.png" alt="Nigeria Coat of Arms" width={40} height={40} data-ai-hint="nigeria coat arms" />
                            <div>
                                <p className="font-bold text-sm">FEDERAL REPUBLIC OF NIGERIA</p>
                                <p className="text-xs">DRIVER'S LICENSE</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 flex gap-3">
                        <div className="w-24 h-32 bg-gray-300 border-2 border-white flex items-center justify-center">
                           <Image src={data.selfie || 'https://placehold.co/100x120.png'} alt="Driver's photo" width={96} height={128} objectFit="cover" data-ai-hint="person passport" />
                        </div>
                        <div className="text-xs space-y-1">
                            <p className="text-muted-foreground">Name: {data.fullName?.toUpperCase()}</p>
                            <p className="text-muted-foreground">Issued: {format(new Date(), 'dd-MM-yyyy')}</p>
                            <p className="text-muted-foreground">Expires: {format(addDays(new Date(), 365 * 5), 'dd-MM-yyyy')}</p>
                            <p className="font-bold text-sm font-mono text-blue-800 mt-1">Status: PENDING</p>
                        </div>
                    </CardContent>
                </Card>
                 <Button onClick={onDone} className="w-full mt-6">Back to Dashboard</Button>
            </div>
        </div>
    )
}

    