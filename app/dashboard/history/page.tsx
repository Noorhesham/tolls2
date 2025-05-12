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
import { MoreHorizontal, ArrowUpDown, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/app/components/payment-dialog";
import { useAuthContext } from "@/app/hooks/AuthContext";
import { useApi } from "@/app/hooks/useApi";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useRouter } from "next/navigation";

type Toll = {
  id: string;
  date: string;
  amount: number;
  status: string;
  location: string;
  tollDate: string;
  vehiclePlateNumber: string;
  tollAmount: number;
  isPaid: boolean;
  tollGateName: string;
};

export default function HistoryPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    toll?: Toll;
  }>({ open: false });

  const [tolls, setTolls] = useState<Toll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const { isAuthenticated, token, getCurrentUser } = useAuthContext();
  const { fetchApi } = useApi();
  const router = useRouter();

  const fetchTolls = async () => {
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
      const response = await fetchApi("/Tolls/my", {
        method: "GET",
        // Explicitly set the token to ensure it's included
        token: token,
      });

      // Check if response exists and is an array
      if (Array.isArray(response)) {
        // Transform API response to match our table structure
        const formattedTolls = response.map((toll: any) => ({
          id: toll.id || toll.tollId || String(Math.random()),
          date: new Date(toll.tollDate).toLocaleDateString(),
          amount: toll.tollAmount,
          status: toll.isPaid ? "paid" : "pending",
          location: toll.tollGateName,
          tollDate: toll.tollDate,
          vehiclePlateNumber: toll.vehiclePlateNumber,
          tollAmount: toll.tollAmount,
          isPaid: toll.isPaid,
          tollGateName: toll.tollGateName,
        }));

        setTolls(formattedTolls);
      } else {
        // If not an array, handle as an error
        setTolls([]);
        setError("Failed to load toll history. Unexpected data format.");
      }
    } catch (err: any) {
      console.error("Failed to fetch toll history:", err);

      if (err.status === 401) {
        setAuthError(true);
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load toll history. Please try again later.");
      }

      setTolls([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on mount, but only after auth status is confirmed
  useEffect(() => {
    // Only attempt to fetch if we have authentication
    if (isAuthenticated && token) {
      fetchTolls();
    }
  }, [isAuthenticated, token]);

  const handleRefresh = async () => {
    // Try to refresh the user data first (which may refresh the token)
    if (authError) {
      try {
        await getCurrentUser();
        // If getCurrentUser succeeds, try fetching tolls again
        fetchTolls();
      } catch (error) {
        // If refresh fails, redirect to login
        router.push("/login");
      }
    } else {
      // Just refresh the toll data
      fetchTolls();
    }
  };

  const columns: ColumnDef<Toll>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "vehiclePlateNumber",
      header: "Vehicle",
    },
    {
      accessorKey: "location",
      header: "Toll Gate",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return formatted;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className={status === "paid" ? "text-green-500" : "text-red-500"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const toll = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!toll.isPaid && (
                <DropdownMenuItem onClick={() => setPaymentDialog({ open: true, toll })}>Pay</DropdownMenuItem>
              )}
              <DropdownMenuItem>View Details</DropdownMenuItem>
              {toll.isPaid && <DropdownMenuItem>Download Receipt</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tolls,
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
            <h2 className="text-2xl font-bold text-white">Toll History</h2>
            <p className="text-gray-400">View and manage your toll transactions</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Input
              placeholder="Filter toll gates..."
              value={(table.getColumn("location")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("location")?.setFilterValue(event.target.value)}
              className="max-w-sm bg-gray-800 border-gray-700"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="border-gray-700 bg-gray-800 hover:bg-gray-700"
            >
              <RefreshCcw className="h-4 w-4" />
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
                        {error ? "Error loading data" : "No toll history found."}
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

        {paymentDialog.toll && (
          <PaymentDialog
            open={paymentDialog.open}
            transaction={paymentDialog.toll}
            onClose={() => setPaymentDialog({ open: false })}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
