"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/app/hooks/useApi";
import { AlertCircle, Wallet } from "lucide-react";

// Simplified schema that only requires amount
const formSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than 0"),
  // Keep these fields for UI but make them optional
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  paymentMethod: z.string().optional(),
});

interface AddFundsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddFundsDialog({ open, onClose, onSuccess }: AddFundsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { fetchApi } = useApi();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      paymentMethod: "",
    },
  });

  const handleClose = () => {
    // Reset form and states when closing
    form.reset();
    setError(null);
    setSuccess(false);
    onClose();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      // Only send the amount to match API requirements
      await fetchApi("/Wallet/add-funds", {
        method: "POST",
        data: {
          amount: parseFloat(values.amount),
        },
      });

      setSuccess(true);
      // Close after showing success for 2 seconds
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error("Add funds failed:", err);
      setError(err.message || "Failed to add funds. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription className="text-gray-400">Add money to your wallet to pay for tolls</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/20 border border-green-500 text-white p-4 rounded-md text-center">
            Funds added successfully! Refreshing...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Amount (USD)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter amount"
                        {...field}
                        className="bg-gray-700 border-gray-600"
                        type="number"
                        step="0.01"
                        min="0.01"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keep payment method UI for better user experience */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Select a payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Card details UI section kept for user experience */}
              <div className="border border-gray-700 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Card Details (Demo Only)</h3>

                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1234 5678 9012 3456" {...field} className="bg-gray-700 border-gray-600" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" {...field} className="bg-gray-700 border-gray-600" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">CVV</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="123" {...field} className="bg-gray-700 border-gray-600" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Note: This is a demo. No actual payment processing will occur.
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isLoading ? "Processing..." : "Add Funds"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
