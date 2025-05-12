"use client";

import { useState, useEffect } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, AlertCircle, RefreshCcw, Plus, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/app/hooks/AuthContext";
import { useApi } from "@/app/hooks/useApi";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { RegisterVehicleDialog } from "@/app/components/register-vehicle-dialog";

// Map numeric vehicle types to readable strings
const vehicleTypeMap: Record<number, string> = {
  0: "Motorcycle",
  1: "Car",
  2: "SUV",
  3: "Bus",
  4: "Truck",
};

type Vehicle = {
  id: string;
  plateNumber: string;
  type: string;
  vehicleType: number;
  registrationDate: string;
  isActive: boolean;
};

export default function VehiclePage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const { isAuthenticated, token, getCurrentUser, user } = useAuthContext();
  const { fetchApi } = useApi();
  const router = useRouter();

  const fetchVehicles = async () => {
    if (!isAuthenticated || !token) {
      setAuthError(true);
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      console.log(user);
      const response = await fetchApi(`/Vehicle/user/${user?.id}/vehicles`, {
        method: "GET",
        token: token,
      });

      // Check if response exists and is an array
      if (Array.isArray(response)) {
        console.log(response);
        setVehicles(response);
      } else {
        // If not an array, handle as an error
        setVehicles([]);
        setError("Failed to load vehicles. Unexpected data format.");
      }
    } catch (err: any) {
      console.error("Failed to fetch vehicles:", err);

      if (err.status === 401) {
        setAuthError(true);
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load vehicles. Please try again later.");
      }

      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on mount, but only after auth status is confirmed
  useEffect(() => {
    // Only attempt to fetch if we have authentication
    if (isAuthenticated && token && user) {
      fetchVehicles();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = async () => {
    // Try to refresh the user data first (which may refresh the token)
    if (authError) {
      try {
        await getCurrentUser();
        // If getCurrentUser succeeds, try fetching vehicles again
        fetchVehicles();
      } catch (error) {
        // If refresh fails, redirect to login
        router.push("/login");
      }
    } else {
      // Just refresh the vehicle data
      fetchVehicles();
    }
  };

  const handleRegisterSuccess = () => {
    // Refresh the vehicle list after successful registration
    fetchVehicles();
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "plateNumber",
      header: "License Plate",
    },
    {
      accessorKey: "type",
      header: "Make/Model",
    },
    {
      accessorKey: "vehicleType",
      header: "Vehicle Type",
      cell: ({ row }) => {
        const vehicleType = row.getValue("vehicleType") as number;
        return vehicleTypeMap[vehicleType] || `Type ${vehicleType}`;
      },
    },
    {
      accessorKey: "registrationDate",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Registration Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateValue = row.getValue("registrationDate");
        if (!dateValue) return "N/A";

        try {
          const date = new Date(dateValue as string);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } catch (e) {
          return "Invalid date";
        }
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return <div className={isActive ? "text-green-500" : "text-red-500"}>{isActive ? "Active" : "Inactive"}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const vehicle = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Vehicle</DropdownMenuItem>
              <DropdownMenuItem className={vehicle.isActive ? "text-red-500" : "text-green-500"}>
                {vehicle.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: vehicles,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <ProtectedRoute>
      <div className="h-full py-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Car className="mr-2 h-6 w-6" />
              My Vehicles
            </h2>
            <p className="text-gray-400">Manage your registered vehicles</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Input
              placeholder="Filter by plate number..."
              value={(table.getColumn("plateNumber")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("plateNumber")?.setFilterValue(event.target.value)}
              className="max-w-sm bg-gray-800 border-gray-700"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="border-gray-700 bg-gray-800 hover:bg-gray-700"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowRegisterDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Register Vehicle
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-md mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
            {authError && (
              <Button onClick={() => router.push("/login")} variant="destructive" size="sm">
                Log In Again
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="rounded-md border border-gray-700 bg-gray-800/50">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-gray-800/80 border-gray-700">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="text-gray-300">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-800/80 border-gray-700">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-gray-800/80 border-gray-700">
                      <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400">
                        {error ? (
                          "Error loading data"
                        ) : (
                          <div className="flex flex-col items-center">
                            <p className="mb-4">No vehicles found.</p>
                            <Button
                              onClick={() => setShowRegisterDialog(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Register Your First Vehicle
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="border-gray-700 bg-gray-800 hover:bg-gray-700"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="border-gray-700 bg-gray-800 hover:bg-gray-700"
              >
                Next
              </Button>
            </div>
          </>
        )}

        <RegisterVehicleDialog
          open={showRegisterDialog}
          onClose={() => setShowRegisterDialog(false)}
          onSuccess={handleRegisterSuccess}
        />
      </div>
    </ProtectedRoute>
  );
}
