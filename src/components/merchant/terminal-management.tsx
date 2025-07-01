
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Terminal {
  id: string;
  serialNumber: string;
  status: 'Online' | 'Offline' | 'In Repair';
  location: string;
  assignedTo: string;
  lastActivity: string;
}

const mockTerminals: Terminal[] = [
  { id: 'POS-001', serialNumber: 'SN-A987B1', status: 'Online', location: 'Lekki Phase 1', assignedTo: 'John Doe', lastActivity: '2 minutes ago' },
  { id: 'POS-002', serialNumber: 'SN-C345D2', status: 'Offline', location: 'Ikeja City Mall', assignedTo: 'Jane Smith', lastActivity: '3 hours ago' },
  { id: 'POS-003', serialNumber: 'SN-E678F3', status: 'Online', location: 'Lekki Phase 1', assignedTo: 'Femi Adebola', lastActivity: 'now' },
  { id: 'POS-004', serialNumber: 'SN-G901H4', status: 'In Repair', location: 'Victoria Island', assignedTo: 'Unassigned', lastActivity: '2 days ago' },
  { id: 'POS-005', serialNumber: 'SN-J234K5', status: 'Offline', location: 'Ikeja City Mall', assignedTo: 'Chioma Okoye', lastActivity: 'yesterday' },
];

export function TerminalManagement() {
    const { toast } = useToast();

    const handleAction = (action: string, terminalId: string) => {
        toast({
            title: `Action: ${action}`,
            description: `Performed ${action} on terminal ${terminalId}. (This is a demo)`,
        });
    }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <CardTitle>All Terminals</CardTitle>
            <CardDescription>A list of all POS devices assigned to your business.</CardDescription>
        </div>
        <Button onClick={() => toast({ title: "Coming Soon!", description: "The terminal request feature is under development." })} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Request New Terminal
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Terminal ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location / Branch</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mockTerminals.map((terminal) => (
                <TableRow key={terminal.id}>
                    <TableCell className="font-medium">
                        <div>{terminal.id}</div>
                        <div className="text-xs text-muted-foreground">{terminal.serialNumber}</div>
                    </TableCell>
                    <TableCell>
                        <Badge
                            className={cn(
                                "capitalize",
                                terminal.status === 'Online' && 'bg-green-100 text-green-800',
                                terminal.status === 'Offline' && 'bg-gray-100 text-gray-800',
                                terminal.status === 'In Repair' && 'bg-yellow-100 text-yellow-800'
                            )}
                            variant={terminal.status === 'Online' ? 'default' : 'secondary'}
                        >
                            {terminal.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {terminal.location}
                        </div>
                    </TableCell>
                    <TableCell>{terminal.assignedTo}</TableCell>
                    <TableCell>{terminal.lastActivity}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleAction('View History', terminal.id)}>View History</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('Reassign', terminal.id)}>Reassign Staff</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('Sync', terminal.id)}>Sync Device</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Deactivate', terminal.id)}>Deactivate</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
