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
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be 16 digits"),
  expiryDate: z.string().min(5, "Invalid expiry date"),
  cvv: z.string().min(3, "Invalid CVV"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

interface TollTransaction {
  id: string;
  amount: number;
  tollAmount?: number;
  isPaid?: boolean;
  vehiclePlateNumber?: string;
  tollGateName?: string;
}

interface PaymentDialogProps {
  open: boolean;
  transaction?: TollTransaction;
  onClose: () => void;
}

export function PaymentDialog({ open, transaction, onClose }: PaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { fetchApi } = useApi();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    if (!transaction) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call the API to process payment
      await fetchApi(`/Tolls/pay/${transaction.id}`, {
        method: "POST",
        data: {
          paymentMethod: values.paymentMethod,
          cardDetails: {
            cardNumber: values.cardNumber,
            expiryDate: values.expiryDate,
            cvv: values.cvv,
          },
        },
      });

      setSuccess(true);
      // Close after showing success for 2 seconds
      setTimeout(() => {
        handleClose();
        // Refresh page to show updated status
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription className="text-gray-400">
            Make payment for toll #{transaction?.id} - {transaction?.tollGateName}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/20 border border-green-500 text-white p-4 rounded-md text-center">
            Payment successful! Redirecting...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="p-3 bg-gray-700 rounded-md mb-4">
                <p className="font-medium">Payment Summary</p>
                <p className="text-sm text-gray-300">Vehicle: {transaction?.vehiclePlateNumber}</p>
                <p className="text-sm text-gray-300">Toll Gate: {transaction?.tollGateName}</p>
                <p className="text-sm font-bold mt-2">
                  Amount: ${(transaction?.amount || transaction?.tollAmount || 0).toFixed(2)}
                </p>
              </div>

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
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Card Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234 5678 9012 3456" {...field} className="bg-gray-700 border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Expiry Date</FormLabel>
                      <FormControl>
                        <Input placeholder="MM/YY" {...field} className="bg-gray-700 border-gray-600" />
                      </FormControl>
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isLoading
                    ? "Processing..."
                    : `Pay $${(transaction?.amount || transaction?.tollAmount || 0).toFixed(2)}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
