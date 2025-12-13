import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvitationLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-foreground/20" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-40 mx-auto bg-primary-foreground/30" />
            <Skeleton className="h-3 w-56 mx-auto bg-primary-foreground/20" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <Skeleton className="h-3 w-40 mx-auto" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-3 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
