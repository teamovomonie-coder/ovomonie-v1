import { VirtualAccountFunding } from '@/components/add-money/virtual-account-funding';

export default function VirtualAccountPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fund Your Wallet</h1>
        <p className="text-gray-600">Generate a virtual account number for bank transfers</p>
      </div>
      
      <VirtualAccountFunding />
    </div>
  );
}