// TEMPORARY FIX: Add successUrl={null} to the card order PinModal
// Location: src/components/custom-card/card-customizer.tsx
// Lines ~840-850

// BEFORE:
/*
     <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleConfirmOrder}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Confirm Card Order"
        description="A fee of ₦1,500 will be deducted from your wallet for the custom card."
      />
*/

// AFTER:
/*
     <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        successUrl={null}
        onConfirm={handleConfirmOrder}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Confirm Card Order"
        description="A fee of ₦1,500 will be deducted from your wallet for the custom card."
      />
*/
