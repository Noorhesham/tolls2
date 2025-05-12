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
import { AlertCircle, Car } from "lucide-react";

const formSchema = z.object({
  vehicleType: z.string(),
  plateNumber: z.string().min(1, "License plate number is required"),
  type: z.string().min(1, "Vehicle type is required"),
});

interface RegisterVehicleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegisterVehicleDialog({ open, onClose, onSuccess }: RegisterVehicleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { fetchApi, token } = useApi();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleType: "0",
      plateNumber: "",
      type: "",
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
      // Call the API to register vehicle
      await fetchApi("/Vehicle/Register", {
        method: "POST",
        data: {
          vehicleType: parseInt(values.vehicleType, 10),
          plateNumber: values.plateNumber,
          type: values.type,
        },
        token: token || "",
      });

      setSuccess(true);
      // Close after showing success for 2 seconds
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error("Vehicle registration failed:", err);
      setError(err.message || "Failed to register vehicle. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Car className="mr-2 h-5 w-5" />
            Register New Vehicle
          </DialogTitle>
          <DialogDescription className="text-gray-400">Add a new vehicle to your account</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/20 border border-green-500 text-white p-4 rounded-md text-center">
            Vehicle registered successfully!
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">License Plate Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter license plate" {...field} className="bg-gray-700 border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Vehicle Make/Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Toyota Camry" {...field} className="bg-gray-700 border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Select a vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="0">Motorcycle</SelectItem>
                        <SelectItem value="1">Car</SelectItem>
                        <SelectItem value="2">SUV</SelectItem>
                        <SelectItem value="3">Bus</SelectItem>
                        <SelectItem value="4">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isLoading ? "Registering..." : "Register Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
