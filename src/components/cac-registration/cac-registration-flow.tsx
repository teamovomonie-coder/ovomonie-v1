
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, CheckCircle, Loader2, Upload, Handshake, Users as UsersIcon } from "lucide-react";

const proprietorSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  bvn: z.string().length(11, "BVN must be 11 digits.").optional().or(z.literal('')),
  phone: z.string().length(11, "A valid 11-digit phone number is required."),
  email: z.string().email("Invalid email address."),
  idType: z.string().min(1, "Please select an ID type."),
  idFile: z.any().optional(), // In a real app, you'd want more specific validation
});

const cacSchema = z.object({
  businessType: z.enum(["bn", "ltd", "llp", "ngo"], {
    required_error: "You must select a business type.",
  }),
  businessName1: z.string().min(3, "Proposed name is required."),
  businessName2: z.string().min(3, "A second name option is required."),
  businessDescription: z.string().min(20, "Please provide a detailed business description."),
  businessAddress: z.string().min(10, "Business address is required."),
  businessState: z.string().min(1, "Please select a state."),
  proprietors: z.array(proprietorSchema).min(1, "At least one proprietor/director/trustee is required."),
});

type CacFormData = z.infer<typeof cacSchema>;

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const steps = [
  { id: 1, name: "Business Type", fields: ["businessType"] },
  { id: 2, name: "Business Details", fields: ["businessName1", "businessName2", "businessDescription", "businessAddress", "businessState"] },
  { id: 3, name: "Participant Details", fields: ["proprietors"] },
  { id: 4, name: "Review & Pay" },
  { id: 5, name: "Confirmation" },
];

const participantLabels = {
    bn: { singular: 'Proprietor', plural: 'Proprietors' },
    ltd: { singular: 'Director', plural: 'Directors' },
    llp: { singular: 'Partner', plural: 'Partners' },
    ngo: { singular: 'Trustee', plural: 'Trustees' },
};

const defaultFormValues: CacFormData = {
  businessType: "bn",
  businessName1: "",
  businessName2: "",
  businessDescription: "",
  businessAddress: "",
  businessState: "",
  proprietors: [{ fullName: "", bvn: "", email: "", phone: "", idType: "" }],
};

export function CacRegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CacFormData>({
    resolver: zodResolver(cacSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "proprietors",
  });

  const businessType = form.watch("businessType");
  const currentLabels = participantLabels[businessType];

  const resetFlow = () => {
    form.reset(defaultFormValues);
    setCurrentStep(0);
  };

  const processForm = async () => {
    setIsLoading(true);
    // Simulate API call to submit registration
    await new Promise(res => setTimeout(res, 2000));
    setIsLoading(false);
    setCurrentStep(prev => prev + 1);
  };

  const handleNext = async () => {
    const fieldsToValidate = steps[currentStep].fields;
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep === steps.length - 2) {
        await processForm();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const fees = {
    bn: { cac: 10000, legal: 5000, convenience: 500 },
    ltd: { cac: 50000, legal: 20000, convenience: 1000 },
    llp: { cac: 25000, legal: 15000, convenience: 750 },
    ngo: { cac: 30000, legal: 20000, convenience: 750 },
  };
  const currentFees = fees[businessType];
  const totalFee = currentFees.cac + currentFees.legal + currentFees.convenience;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>CAC Business Registration</CardTitle>
        <CardDescription>Follow the steps to register your business name or company.</CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <Form {...form}>
        <form>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-lg font-semibold">Choose your Registration Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <FormItem>
                              <FormControl><RadioGroupItem value="bn" id="bn" className="sr-only" /></FormControl>
                              <FormLabel htmlFor="bn" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <Building2 className="mb-3 h-6 w-6" />
                                Business Name
                                <span className="text-xs text-muted-foreground mt-1 text-center">For sole proprietors & partnerships</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl><RadioGroupItem value="ltd" id="ltd" className="sr-only" /></FormControl>
                              <FormLabel htmlFor="ltd" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <Building2 className="mb-3 h-6 w-6" />
                                Limited Liability Company (LTD)
                                <span className="text-xs text-muted-foreground mt-1 text-center">For incorporated companies with shares</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormControl><RadioGroupItem value="llp" id="llp" className="sr-only" /></FormControl>
                              <FormLabel htmlFor="llp" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <Handshake className="mb-3 h-6 w-6" />
                                Limited Liability Partnership (LLP)
                                <span className="text-xs text-muted-foreground mt-1 text-center">For professional service firms (e.g., law, accounting)</span>
                              </FormLabel>
                            </FormItem>
                             <FormItem>
                              <FormControl><RadioGroupItem value="ngo" id="ngo" className="sr-only" /></FormControl>
                              <FormLabel htmlFor="ngo" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <UsersIcon className="mb-3 h-6 w-6" />
                                Incorporated Trustees (NGO)
                                <span className="text-xs text-muted-foreground mt-1 text-center">For NGOs, charities, religious bodies, associations</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Details</h3>
                    <FormField control={form.control} name="businessName1" render={({ field }) => <FormItem><FormLabel>Proposed Name 1</FormLabel><FormControl><Input placeholder="Your first choice of business name" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="businessName2" render={({ field }) => <FormItem><FormLabel>Proposed Name 2</FormLabel><FormControl><Input placeholder="Your second choice of business name" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="businessDescription" render={({ field }) => <FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea placeholder="Describe the nature of your business..." {...field} /></FormControl><FormMessage /></FormItem>} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="businessAddress" render={({ field }) => <FormItem><FormLabel>Business Address</FormLabel><FormControl><Input placeholder="Street, City" {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name="businessState" render={({ field }) => <FormItem><FormLabel>State</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl><SelectContent>{nigerianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">{currentLabels.plural} Details</h3>
                    {fields.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg space-y-4 relative">
                        <FormField control={form.control} name={`proprietors.${index}.fullName`} render={({ field }) => <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`proprietors.${index}.bvn`} render={({ field }) => <FormItem><FormLabel>BVN</FormLabel><FormControl><Input {...field} type="tel" maxLength={11} /></FormControl><FormMessage /></FormItem>} />
                            <FormField control={form.control} name={`proprietors.${index}.phone`} render={({ field }) => <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} type="tel" maxLength={11} /></FormControl><FormMessage /></FormItem>} />
                        </div>
                        <FormField control={form.control} name={`proprietors.${index}.email`} render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`proprietors.${index}.idType`} render={({ field }) => <FormItem><FormLabel>ID Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select ID" /></SelectTrigger></FormControl><SelectContent><SelectItem value="nin">NIN Slip</SelectItem><SelectItem value="passport">Int'l Passport</SelectItem><SelectItem value="drivers_license">Driver's License</SelectItem><SelectItem value="voters_card">Voter's Card</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                            <FormField control={form.control} name={`proprietors.${index}.idFile`} render={({ field }) => <FormItem><FormLabel>Upload ID</FormLabel><FormControl><Input type="file" /></FormControl><FormMessage /></FormItem>} />
                        </div>
                         {index > 0 && <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>}
                      </div>
                    ))}
                    {businessType !== 'bn' && <Button type="button" variant="outline" size="sm" onClick={() => append({ fullName: "", bvn: "", email: "", phone: "", idType: "" })}>Add {currentLabels.singular}</Button>}
                  </div>
                )}

                 {currentStep === 3 && (
                   <div className="space-y-6">
                     <h3 className="text-lg font-semibold text-center">Review & Pay</h3>
                     <Card className="bg-muted/50">
                       <CardHeader><CardTitle className="text-base">Business Details</CardTitle></CardHeader>
                       <CardContent className="space-y-2 text-sm">
                         <div className="flex justify-between"><span className="text-muted-foreground">Name Option 1:</span><span className="font-medium">{form.getValues("businessName1")}</span></div>
                         <div className="flex justify-between"><span className="text-muted-foreground">Name Option 2:</span><span className="font-medium">{form.getValues("businessName2")}</span></div>
                         <div className="flex justify-between"><span className="text-muted-foreground">Address:</span><span className="font-medium">{form.getValues("businessAddress")}</span></div>
                       </CardContent>
                     </Card>
                     <Card className="bg-muted/50">
                        <CardHeader><CardTitle className="text-base">Payment Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="text-xs text-muted-foreground pb-2">This is a summary of all fees required for your registration type. Note: Name Search and Stamp Duty fees will be charged separately in a future version.</p>
                            <div className="flex justify-between"><span className="text-muted-foreground">CAC Fee:</span><span>₦{currentFees.cac.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Accredited Agent Fee:</span><span>₦{currentFees.legal.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Service Charge:</span><span>₦{currentFees.convenience.toLocaleString()}</span></div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span className="">Total:</span><span>₦{totalFee.toLocaleString()}</span></div>
                        </CardContent>
                     </Card>
                   </div>
                 )}

                {currentStep === 4 && (
                    <div className="text-center p-8 flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
                        <p className="text-muted-foreground max-w-md">Your application is being processed. Our system is assigning an accredited agent to handle your registration. You will be notified via email within 24-72 hours once your business name is approved and your certificate is ready.</p>
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentStep > 0 && currentStep < 4 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {currentStep < 3 && (
              <Button type="button" onClick={handleNext} className="ml-auto">
                Next
              </Button>
            )}
            {currentStep === 3 && (
                <Button type="button" onClick={handleNext} className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay ₦{totalFee.toLocaleString()} & Submit
                </Button>
            )}
            {currentStep === 4 && (
                 <Button type="button" onClick={resetFlow} className="w-full">
                    Register Another Business
                </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
