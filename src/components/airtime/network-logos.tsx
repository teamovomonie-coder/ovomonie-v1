import { cn } from '@/lib/utils';

const MtnLogo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/mtn.jpg" alt="MTN" className="w-full h-full object-contain" />
  </div>
);

const AirtelLogo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/airtel.png" alt="Airtel" className="w-full h-full object-contain" />
  </div>
);

const GloLogo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/glo.png" alt="Glo" className="w-full h-full object-contain" />
  </div>
);

const T2Logo = ({ className }: { className?: string }) => (
  <div className={cn("w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5", className)}>
    <img src="/t2.png" alt="9mobile" className="w-full h-full object-contain" />
  </div>
);

const networks: Record<string, { name: string; Logo: React.ComponentType<{ className?: string }> }> = {
  mtn: { name: 'MTN', Logo: MtnLogo },
  airtel: { name: 'Airtel', Logo: AirtelLogo },
  glo: { name: 'Glo', Logo: GloLogo },
  '9mobile': { name: '9mobile', Logo: T2Logo },
};

export default networks;