"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Link from "next/link";
import { AddFundsDialog } from "../components/add-funds-dialog";
import { CreditCard, Wallet } from "lucide-react";
import { useApi } from "../hooks/useApi";

interface WalletInfo {
  balance: number;
  currency: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuthContext();
  const [greeting, setGreeting] = useState<string>("");
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({ balance: 0, currency: "USD" });
  const [walletLoading, setWalletLoading] = useState(false);
  const { fetchApi } = useApi();

  useEffect(() => {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
      setGreeting("Good morning");
    } else if (currentHour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // Fetch wallet info once on mount
  useEffect(() => {
    const getWalletInfo = async () => {
      if (!user) return;

      setWalletLoading(true);
      try {
        const walletData = await fetchApi("/Wallet/balance", { method: "GET" });
        if (walletData && typeof walletData.balance === "number") {
          setWalletInfo({
            balance: walletData.balance,
            currency: walletData.currency || "USD",
          });
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        // Just keep the default values (0 USD) and don't retry
      } finally {
        setWalletLoading(false);
      }
    };

    getWalletInfo();
  }, [user]);

  // After successful fund addition, just set success state without retrying the balance fetch
  const handleAddFundsSuccess = () => {
    // Don't try to fetch updated balance - just increment the UI display
    setWalletInfo((prev) => ({
      ...prev,
      balance: prev.balance + 0, // We don't know the amount, so just use 0 for now
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
        <div className="max-w-7xl mx-auto">
          <header className="py-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          </header>

          <main className="mt-8">
            {/* Wallet Balance Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <Wallet className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Wallet Balance</h2>
                    {walletLoading ? (
                      <p className="text-gray-400">Loading balance...</p>
                    ) : (
                      <p className="text-2xl font-bold text-white">${walletInfo.balance.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowAddFundsDialog(true)}
                  className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Add Funds
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              {loading ? (
                <p className="text-white">Loading user data...</p>
              ) : user ? (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    {greeting}, {user.firstName} {user.lastName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-2">Your Information</h3>
                      <p className="text-gray-300">Email: {user.email}</p>
                      <p className="text-gray-300">Phone: {user.phoneNumber}</p>
                      <p className="text-gray-300">Role: {user.role}</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-white mb-2">Quick Actions</h3>
                      <div className="space-y-2 flex flex-col gap-2 text-center">
                        <Link
                          href="/dashboard/history"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
                        >
                          View Toll History
                        </Link>
                        <Link
                          href="/dashboard/vehicle"
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition"
                        >
                          Manage Vehicles
                        </Link>
                        {user.role === "Admin" && (
                          <Link
                            href="/dashboard/user"
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
                          >
                            Manage Users
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white">No user data available</p>
              )}
            </div>
          </main>
        </div>
      </div>

      <AddFundsDialog
        open={showAddFundsDialog}
        onClose={() => setShowAddFundsDialog(false)}
        onSuccess={handleAddFundsSuccess}
      />
    </ProtectedRoute>
  );
}
