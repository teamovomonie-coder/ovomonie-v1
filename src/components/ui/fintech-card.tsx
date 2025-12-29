import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    TrendingUp, 
    TrendingDown, 
    Shield, 
    AlertTriangle, 
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    EyeOff
} from "lucide-react";

interface FintechCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'balance' | 'transaction' | 'metric' | 'alert';
    secure?: boolean;
    trend?: 'up' | 'down' | 'neutral';
    status?: 'success' | 'warning' | 'error' | 'pending';
}

const FintechCard = React.forwardRef<HTMLDivElement, FintechCardProps>(
    ({ className, variant = 'default', secure, trend, status, children, ...props }, ref) => {
        const [isVisible, setIsVisible] = React.useState(!secure);

        const getVariantStyles = () => {
            switch (variant) {
                case 'balance':
                    return "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg";
                case 'transaction':
                    return "hover:shadow-md transition-all duration-200 border-border/50";
                case 'metric':
                    return "bg-card/50 backdrop-blur-sm border-border/30";
                case 'alert':
                    return status === 'error' 
                        ? "border-destructive/50 bg-destructive/5" 
                        : status === 'warning'
                        ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
                        : "border-green-500/50 bg-green-50 dark:bg-green-950/20";
                default:
                    return "";
            }
        };

        const getTrendIcon = () => {
            switch (trend) {
                case 'up':
                    return <TrendingUp className="h-4 w-4 text-green-600" />;
                case 'down':
                    return <TrendingDown className="h-4 w-4 text-red-600" />;
                default:
                    return null;
            }
        };

        const getStatusIcon = () => {
            switch (status) {
                case 'success':
                    return <CheckCircle className="h-4 w-4 text-green-600" />;
                case 'warning':
                    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                case 'error':
                    return <AlertTriangle className="h-4 w-4 text-red-600" />;
                case 'pending':
                    return <Clock className="h-4 w-4 text-blue-600" />;
                default:
                    return null;
            }
        };

        return (
            <Card
                ref={ref}
                className={cn(
                    "relative overflow-hidden",
                    getVariantStyles(),
                    className
                )}
                {...props}
            >
                {variant === 'balance' && (
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
                        <div className="absolute right-4 bottom-6 h-32 w-32 rounded-full bg-primary-foreground/15 blur-3xl" />
                    </div>
                )}
                
                <div className="relative">
                    {(trend || status) && (
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            {getTrendIcon()}
                            {getStatusIcon()}
                        </div>
                    )}
                    
                    {secure && (
                        <div className="absolute top-4 right-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-current hover:bg-current/10"
                                onClick={() => setIsVisible(!isVisible)}
                            >
                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                    
                    <div className={cn(secure && !isVisible && "blur-sm select-none")}>
                        {children}
                    </div>
                </div>
            </Card>
        );
    }
);

FintechCard.displayName = "FintechCard";

// Specialized components
const BalanceCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { 
        balance: number; 
        currency?: string; 
        accountNumber?: string;
        secure?: boolean;
    }
>(({ className, balance, currency = 'NGN', accountNumber, secure = true, ...props }, ref) => {
    return (
        <FintechCard
            ref={ref}
            variant="balance"
            secure={secure}
            className={cn("", className)}
            {...props}
        >
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-primary-foreground/80 uppercase tracking-wider">
                            Available Balance
                        </span>
                        {accountNumber && (
                            <span className="text-xs text-primary-foreground/60">
                                {accountNumber}
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-bold tabular-nums">
                        {new Intl.NumberFormat('en-NG', { 
                            style: 'currency', 
                            currency 
                        }).format(balance / 100)}
                    </div>
                </div>
            </CardContent>
        </FintechCard>
    );
});

BalanceCard.displayName = "BalanceCard";

const MetricCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        title: string;
        value: string | number;
        change?: number;
        icon?: React.ReactNode;
        trend?: 'up' | 'down' | 'neutral';
    }
>(({ className, title, value, change, icon, trend, ...props }, ref) => {
    return (
        <FintechCard
            ref={ref}
            variant="metric"
            trend={trend}
            className={cn("", className)}
            {...props}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    {icon && <div className="text-muted-foreground">{icon}</div>}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">
                        {typeof value === 'number' 
                            ? value.toLocaleString() 
                            : value
                        }
                    </div>
                    {change !== undefined && (
                        <Badge 
                            variant="secondary" 
                            className={cn(
                                "text-xs",
                                change > 0 
                                    ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900" 
                                    : change < 0 
                                    ? "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900"
                                    : "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800"
                            )}
                        >
                            {change > 0 ? '+' : ''}{change}%
                        </Badge>
                    )}
                </div>
            </CardContent>
        </FintechCard>
    );
});

MetricCard.displayName = "MetricCard";

const TransactionCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        title: string;
        amount: number;
        type: 'credit' | 'debit';
        timestamp: string;
        status?: 'success' | 'pending' | 'failed';
        description?: string;
    }
>(({ className, title, amount, type, timestamp, status = 'success', description, ...props }, ref) => {
    return (
        <FintechCard
            ref={ref}
            variant="transaction"
            status={status}
            className={cn("", className)}
            {...props}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{title}</h4>
                        {description && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                                {description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(timestamp).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={cn(
                            "font-semibold tabular-nums",
                            type === 'credit' ? "text-green-600" : "text-red-600"
                        )}>
                            {type === 'credit' ? '+' : '-'}
                            {new Intl.NumberFormat('en-NG', { 
                                style: 'currency', 
                                currency: 'NGN' 
                            }).format(Math.abs(amount) / 100)}
                        </div>
                        {status !== 'success' && (
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-xs mt-1",
                                    status === 'pending' && "text-blue-600 border-blue-200",
                                    status === 'failed' && "text-red-600 border-red-200"
                                )}
                            >
                                {status}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </FintechCard>
    );
});

TransactionCard.displayName = "TransactionCard";

export { 
    FintechCard, 
    BalanceCard, 
    MetricCard, 
    TransactionCard 
};