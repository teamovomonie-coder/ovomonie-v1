import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorMetric {
  error: string;
  endpoint: string;
  userId?: string;
  timestamp: number;
  stack?: string;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private readonly maxMetrics = 1000;

  // Track API response times
  trackApiPerformance(endpoint: string, duration: number, userId?: string) {
    const metric: PerformanceMetric = {
      name: 'api_response_time',
      value: duration,
      timestamp: Date.now(),
      tags: {
        endpoint,
        userId: userId || 'anonymous'
      }
    };

    this.metrics.push(metric);
    this.trimMetrics();

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        endpoint,
        duration,
        userId
      });
    }
  }

  // Track business metrics
  trackBusinessMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
    this.trimMetrics();

    logger.info('Business metric tracked', { name, value, tags });
  }

  // Track errors
  trackError(error: Error, endpoint: string, userId?: string) {
    const errorMetric: ErrorMetric = {
      error: error.message,
      endpoint,
      userId,
      timestamp: Date.now(),
      stack: error.stack
    };

    this.errors.push(errorMetric);
    this.trimErrors();

    logger.error('Error tracked', errorMetric);
  }

  // Get performance summary
  getPerformanceSummary(timeWindow = 3600000) { // 1 hour default
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const apiMetrics = recentMetrics.filter(m => m.name === 'api_response_time');
    const businessMetrics = recentMetrics.filter(m => m.name !== 'api_response_time');

    return {
      apiPerformance: {
        totalRequests: apiMetrics.length,
        averageResponseTime: apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length || 0,
        slowRequests: apiMetrics.filter(m => m.value > 1000).length,
        endpointBreakdown: this.groupByEndpoint(apiMetrics)
      },
      businessMetrics: this.groupBusinessMetrics(businessMetrics),
      errorRate: this.errors.filter(e => e.timestamp > cutoff).length / Math.max(apiMetrics.length, 1)
    };
  }

  // Get error summary
  getErrorSummary(timeWindow = 3600000) {
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff);

    return {
      totalErrors: recentErrors.length,
      errorsByEndpoint: this.groupErrorsByEndpoint(recentErrors),
      topErrors: this.getTopErrors(recentErrors)
    };
  }

  private trimMetrics() {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private trimErrors() {
    if (this.errors.length > this.maxMetrics) {
      this.errors = this.errors.slice(-this.maxMetrics);
    }
  }

  private groupByEndpoint(metrics: PerformanceMetric[]) {
    const grouped: Record<string, { count: number; avgTime: number }> = {};
    
    metrics.forEach(metric => {
      const endpoint = metric.tags?.endpoint || 'unknown';
      if (!grouped[endpoint]) {
        grouped[endpoint] = { count: 0, avgTime: 0 };
      }
      grouped[endpoint].count++;
      grouped[endpoint].avgTime = (grouped[endpoint].avgTime + metric.value) / 2;
    });

    return grouped;
  }

  private groupBusinessMetrics(metrics: PerformanceMetric[]) {
    const grouped: Record<string, { count: number; totalValue: number; avgValue: number }> = {};
    
    metrics.forEach(metric => {
      if (!grouped[metric.name]) {
        grouped[metric.name] = { count: 0, totalValue: 0, avgValue: 0 };
      }
      grouped[metric.name].count++;
      grouped[metric.name].totalValue += metric.value;
      grouped[metric.name].avgValue = grouped[metric.name].totalValue / grouped[metric.name].count;
    });

    return grouped;
  }

  private groupErrorsByEndpoint(errors: ErrorMetric[]) {
    const grouped: Record<string, number> = {};
    errors.forEach(error => {
      grouped[error.endpoint] = (grouped[error.endpoint] || 0) + 1;
    });
    return grouped;
  }

  private getTopErrors(errors: ErrorMetric[]) {
    const errorCounts: Record<string, number> = {};
    errors.forEach(error => {
      errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }
}

export const monitoring = new MonitoringService();

// Middleware for automatic API monitoring
export function withMonitoring(handler: Function, endpoint: string) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    
    try {
      const result = await handler(req, res);
      const duration = Date.now() - startTime;
      
      // Extract user ID from request if available
      const userId = req.headers.authorization ? 'authenticated' : 'anonymous';
      
      monitoring.trackApiPerformance(endpoint, duration, userId);
      
      // Track business metrics based on endpoint
      if (endpoint.includes('/transfers/')) {
        monitoring.trackBusinessMetric('transfer_requests', 1, { endpoint });
      } else if (endpoint.includes('/bills/')) {
        monitoring.trackBusinessMetric('bill_payment_requests', 1, { endpoint });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const userId = req.headers.authorization ? 'authenticated' : 'anonymous';
      
      monitoring.trackApiPerformance(endpoint, duration, userId);
      monitoring.trackError(error as Error, endpoint, userId);
      
      throw error;
    }
  };
}