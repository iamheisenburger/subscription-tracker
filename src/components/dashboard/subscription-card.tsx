"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  CreditCard, 
  Edit, 
  Trash2, 
  Pause, 
  Play,
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/currency";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";

interface SubscriptionCardProps {
  subscription: Doc<"subscriptions">;
  showCategory?: boolean;
  currency?: string;
  onSwipeAction?: (action: 'edit' | 'delete' | 'pause' | 'resume') => void;
}

export function SubscriptionCard({ 
  subscription, 
  showCategory = true, 
  currency = 'USD',
  onSwipeAction
}: SubscriptionCardProps) {
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  // Mutations
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const toggleStatus = useMutation(api.subscriptions.toggleSubscriptionStatus);

  // Framer Motion swipe values
  const x = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Swipe thresholds
  const SWIPE_THRESHOLD = 80;
  const ACTION_THRESHOLD = 120;
  
  // Transform values for background colors
  const backgroundOpacityLeft = useTransform(
    x,
    [-ACTION_THRESHOLD, -SWIPE_THRESHOLD, 0],
    [1, 0.7, 0]
  );
  
  const backgroundOpacityRight = useTransform(
    x,
    [0, SWIPE_THRESHOLD, ACTION_THRESHOLD],
    [0, 0.7, 1]
  );

  // Action handlers
  const handleDelete = async () => {
    if (!user?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteSubscription({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
      });
      toast.success("Subscription deleted successfully!");
      onSwipeAction?.('delete');
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePause = async () => {
    if (!user?.id || isToggling) return;
    
    setIsToggling(true);
    try {
      await toggleStatus({
        clerkId: user.id,
        subscriptionId: subscription._id as Id<"subscriptions">,
        isActive: !subscription.isActive,
      });
      toast.success(subscription.isActive ? "Subscription paused" : "Subscription resumed");
      onSwipeAction?.(subscription.isActive ? 'pause' : 'resume');
    } catch (error) {
      console.error("Error toggling subscription:", error);
      toast.error("Failed to update subscription status.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
    onSwipeAction?.('edit');
  };

  // Swipe gesture handlers
  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500;
    
    if (swipe) {
      if (offset.x > 0) {
        // Right swipe - Toggle pause/resume
        handleTogglePause();
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } else if (offset.x < 0) {
        // Left swipe - Edit action (safer than delete)
        handleEdit();
        
        // Haptic feedback  
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      }
    }
    
    // Reset position
    x.set(0);
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Light haptic feedback when reaching thresholds
    if ('vibrate' in navigator) {
      const absOffset = Math.abs(info.offset.x);
      if (absOffset > SWIPE_THRESHOLD && absOffset < SWIPE_THRESHOLD + 5) {
        navigator.vibrate(1);
      }
    }
  };

  // Format cost with user's preferred currency (use subscription's original currency for now)
  const formattedCost = formatCurrency(subscription.cost, subscription.currency);
  
  if (!isMobile) {
    // Desktop version - no swipe gestures, traditional card
    return (
      <>
        <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold font-sans">{subscription.name}</h3>
              <p className="text-sm text-muted-foreground font-sans">
                Next: {format(subscription.nextBillingDate, "MMM dd, yyyy")} • {subscription.billingCycle}
              </p>
              {showCategory && subscription.category && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {subscription.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold font-sans">{formattedCost}</p>
              <p className="text-sm text-muted-foreground font-sans capitalize">
                {subscription.billingCycle}
              </p>
            </div>
            <Badge variant={subscription.isActive ? "default" : "secondary"}>
              {subscription.isActive ? "Active" : "Paused"}
            </Badge>
            
            {/* Desktop actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={isToggling || isDeleting}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePause}
                disabled={isToggling || isDeleting}
              >
                {subscription.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isToggling || isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {showEditDialog && (
          <EditSubscriptionDialog
            subscription={subscription}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
        )}
      </>
    );
  }

  // Mobile version with swipe gestures
  return (
    <>
      <div className="relative overflow-hidden rounded-lg border">
        {/* Background Action Indicators */}
        <motion.div 
          className="absolute inset-0 bg-emerald-500 flex items-center justify-start pl-6"
          style={{ opacity: backgroundOpacityRight }}
        >
          <div className="flex items-center gap-2 text-white">
            {subscription.isActive ? (
              <>
                <Pause className="h-5 w-5" />
                <span className="font-medium">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span className="font-medium">Resume</span>
              </>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 bg-blue-500 flex items-center justify-end pr-6"
          style={{ opacity: backgroundOpacityLeft }}
        >
          <div className="flex items-center gap-2 text-white">
            <Edit className="h-5 w-5" />
            <span className="font-medium">Edit</span>
          </div>
        </motion.div>

        {/* Main Card Content */}
        <motion.div
          ref={cardRef}
          className="relative bg-background p-4 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: -200, right: 200 }}
          dragElastic={0.1}
          style={{ x }}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          whileDrag={{ scale: 1.02 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {subscription.isActive ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold font-sans truncate">{subscription.name}</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {format(subscription.nextBillingDate, "MMM dd")} • {subscription.billingCycle}
                </p>
                {showCategory && subscription.category && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {subscription.category}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold font-sans">{formattedCost}</p>
              <Badge 
                variant={subscription.isActive ? "default" : "secondary"} 
                className="text-xs"
              >
                {subscription.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
          </div>

          {/* Mobile Touch Indicator */}
          <div className="mt-3 flex justify-center">
            <div className="h-1 w-8 bg-muted-foreground/20 rounded-full"></div>
          </div>
        </motion.div>
      </div>

      {/* Swipe Instructions (only show for first few cards) */}
      <div className="text-center mt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          Swipe right to {subscription.isActive ? 'pause' : 'resume'} • Swipe left to edit
        </span>
      </div>

      {showEditDialog && (
        <EditSubscriptionDialog
          subscription={subscription}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}
