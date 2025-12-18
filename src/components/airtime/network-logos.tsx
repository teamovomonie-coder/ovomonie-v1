import React from 'react';

export const MtnLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MTN logo">
    <rect width="100%" height="100%" rx="12" fill="#FFCC00" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight={700} fontSize={36} fill="#004A99">MTN</text>
  </svg>
);

export const AirtelLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Airtel logo">
    <rect width="100%" height="100%" rx="12" fill="#E40000" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight={700} fontSize={20} fill="#fff">Airtel</text>
  </svg>
);

export const GloLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Glo logo">
    <circle cx="60" cy="60" r="54" fill="#8CC63F" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight={800} fontSize={20} fill="#fff">GLO</text>
  </svg>
);

export const T2Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="T2 logo">
    <rect width="100%" height="100%" rx="12" fill="#461d6a" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight={800} fontSize={26} fill="#fff">T2</text>
  </svg>
);

export const SmileLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Smile logo">
    <rect width="100%" height="100%" rx="12" fill="#00AEEF" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight={700} fontSize={16} fill="#fff">Smile</text>
  </svg>
);

export const NtelLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NTel logo">
    <rect width="100%" height="100%" rx="12" fill="#1E90FF" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight={700} fontSize={18} fill="#fff">NTEL</text>
  </svg>
);

export const networks: Record<string, { name: string; Logo: React.FC<{ className?: string }> }> = {
  mtn: { name: 'MTN', Logo: MtnLogo },
  airtel: { name: 'Airtel', Logo: AirtelLogo },
  glo: { name: 'Glo', Logo: GloLogo },
  '9mobile': { name: '9mobile', Logo: T2Logo },
  t2: { name: 'T2', Logo: T2Logo },
  smile: { name: 'Smile', Logo: SmileLogo },
  ntel: { name: 'NTEL', Logo: NtelLogo },
};

export default networks;
