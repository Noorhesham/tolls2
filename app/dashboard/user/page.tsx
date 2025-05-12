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
import { MoreHorizontal, ArrowUpDown, AlertCircle, UserCog } from "lucide-react";
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
import MaxWidthWrapper from "@/app/components/MaxWidthWrapper";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  phoneNumber: string;
  createdAt: string;
  name?: string;
};

export default function UserManagementPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuthContext();
  const { fetchApi } = useApi();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchApi("/Admin/users", { method: "GET" });

        // Transform API response to match our table structure
        const formattedUsers = response.map((user: any) => ({
          id: user.id || String(Math.random()),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.email || "",
          role: user.role || "User",
          status: user.isActive ? "active" : "inactive",
          phoneNumber: user.phoneNumber || "",
          createdAt: user.createdAt || new Date().toISOString(),
        }));

        setUsers(formattedUsers);
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const firstName = row.original.firstName;
        const lastName = row.original.lastName;
        return <div>{`${firstName} ${lastName}`.trim() || "N/A"}</div>;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return <div className="capitalize">{role}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className={status === "active" ? "text-green-500" : "text-red-500"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Registered On
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dateValue = row.getValue("createdAt");
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
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem className="hover:bg-gray-700">Edit User</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700">Change Role</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700">
                {user.status === "active" ? "Deactivate User" : "Activate User"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
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
  console.log(users);
  return (
    <MaxWidthWrapper>
      <ProtectedRoute>
        <div className="h-full py-8 px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <UserCog className="mr-2 h-6 w-6" />
                User Management
              </h2>
              <p className="text-gray-400">Manage all system users</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Input
                placeholder="Filter by email..."
                value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
                className="max-w-sm bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-md mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
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
                          {error ? "Error loading data" : "No users found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-sm text-gray-400 mr-2">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
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
        </div>
      </ProtectedRoute>
    </MaxWidthWrapper>
  );
}
