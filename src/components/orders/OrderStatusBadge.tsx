import type { OrderStatus } from '../../types';
import Badge, { type BadgeVariant } from '../common/Badge';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending:           { label: 'Pending',           variant: 'warning'  },
  confirmed:         { label: 'Confirmed',          variant: 'info'     },
  processing:        { label: 'Processing',         variant: 'info'     },
  packed:            { label: 'Packed',             variant: 'info'     },
  shipped:           { label: 'Shipped',            variant: 'brand'    },
  'out-for-delivery':{ label: 'Out for Delivery',   variant: 'brand'    },
  delivered:         { label: 'Delivered',          variant: 'success'  },
  cancelled:         { label: 'Cancelled',          variant: 'danger'   },
  returned:          { label: 'Returned',           variant: 'neutral'  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderStatusBadgeProps {
  status:     OrderStatus;
  size?:      'small' | 'medium';
  dot?:       boolean;
  className?: string;
}

const OrderStatusBadge = ({
  status,
  size      = 'medium',
  dot       = true,
  className = '',
}: OrderStatusBadgeProps) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} size={size} dot={dot} className={className}>
      {cfg.label}
    </Badge>
  );
};

export default OrderStatusBadge;
