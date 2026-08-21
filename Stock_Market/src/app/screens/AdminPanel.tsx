import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTrading } from '../context/TradingContext';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { currentUser, users, updateUserBalance, deleteUser } = useTrading();
  const [selectedUser, setSelectedUser] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  if (!currentUser?.isAdmin) {
    return null;
  }

  const regularUsers = users.filter(u => !u.isAdmin);

  const handleSetBalance = () => {
    if (selectedUser && newBalance) {
      updateUserBalance(selectedUser, parseFloat(newBalance));
      setIsBalanceDialogOpen(false);
      setSelectedUser('');
      setNewBalance('');
    }
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUser(username);
    }
  };

  const handleInspectUser = (username: string) => {
    const user = users.find(u => u.username === username);
    if (user) {
      const portfolioInfo = user.portfolio.map(p => 
        `${p.symbol}: ${p.quantity} shares @ avg $${p.avgBuyPrice.toFixed(2)}`
      ).join('\n');
      
      alert(
        `User: ${username}\n` +
        `Balance: $${user.balance.toFixed(2)}\n` +
        `Holdings: ${user.portfolio.length} stocks\n` +
        `Total Trades: ${user.trades.length}\n\n` +
        `Portfolio:\n${portfolioInfo || 'No holdings'}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="border-[#2a2a2a]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#2979ff]" />
            <h1 className="text-2xl font-mono text-[#2979ff]">ADMIN CONTROL PANEL</h1>
          </div>
        </div>

        {/* Admin Menu */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-6 mb-6">
          <h2 className="text-lg font-mono text-[#888888] mb-4">ADMIN ACTIONS</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
              <DialogTrigger asChild>
                <button className="p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md hover:border-[#2979ff] transition-colors text-left">
                  <p className="font-mono text-sm">Set User Balance</p>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <DialogHeader>
                  <DialogTitle className="text-[#2979ff] font-mono">Set User Balance</DialogTitle>
                  <DialogDescription className="text-[#888888]">
                    Update account balance for any user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-md px-3 py-2 text-white"
                    >
                      <option value="">Choose user...</option>
                      {regularUsers.map(u => (
                        <option key={u.username} value={u.username}>
                          {u.username} (Current: ${u.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>New Balance ($)</Label>
                    <Input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      placeholder="Enter new balance"
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-white"
                    />
                  </div>
                  <Button
                    onClick={handleSetBalance}
                    className="w-full bg-[#2979ff] hover:bg-[#1e5dd8]"
                    disabled={!selectedUser || !newBalance}
                  >
                    Update Balance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={() => navigate('/companies')}
              className="p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md hover:border-[#2979ff] transition-colors text-left"
            >
              <p className="font-mono text-sm">All Companies + Prices</p>
            </button>

            <button
              onClick={() => navigate('/orderbook')}
              className="p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md hover:border-[#2979ff] transition-colors text-left"
            >
              <p className="font-mono text-sm">View Order Book Stats</p>
            </button>

            <button className="p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md hover:border-[#2979ff] transition-colors text-left">
              <p className="font-mono text-sm">System Stats</p>
            </button>
          </div>
        </div>

        {/* User List Table */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
          <div className="p-4 border-b border-[#2a2a2a]">
            <h2 className="text-lg font-mono text-[#888888]">ALL USERS</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                <TableHead className="text-[#888888]">#</TableHead>
                <TableHead className="text-[#888888]">Username</TableHead>
                <TableHead className="text-[#888888]">Balance $</TableHead>
                <TableHead className="text-[#888888]">Holdings</TableHead>
                <TableHead className="text-[#888888]">Trades</TableHead>
                <TableHead className="text-[#888888]">Admin?</TableHead>
                <TableHead className="text-[#888888]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.username} className="border-[#2a2a2a] hover:bg-[#0d0d0d]">
                  <TableCell className="text-[#888888] font-mono">{index + 1}</TableCell>
                  <TableCell className="text-white font-mono">{user.username}</TableCell>
                  <TableCell className="text-[#00c853] font-mono">
                    ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono">{user.portfolio.length} stocks</TableCell>
                  <TableCell className="font-mono">{user.trades.length} trades</TableCell>
                  <TableCell>
                    {user.isAdmin && (
                      <span className="px-2 py-0.5 bg-[#2979ff] text-xs rounded font-mono">
                        YES
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInspectUser(user.username)}
                        className="border-[#2979ff] text-[#2979ff] hover:bg-[#2979ff] hover:text-white text-xs"
                      >
                        Inspect
                      </Button>
                      {!user.isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.username)}
                          className="border-[#ff1744] text-[#ff1744] hover:bg-[#ff1744] hover:text-white text-xs"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
            <p className="text-[#888888] text-sm mb-1">Total Users</p>
            <p className="text-2xl font-mono text-[#2979ff]">{regularUsers.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
            <p className="text-[#888888] text-sm mb-1">Total Balance</p>
            <p className="text-2xl font-mono text-[#00c853]">
              ${regularUsers.reduce((sum, u) => sum + u.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
            <p className="text-[#888888] text-sm mb-1">Total Trades</p>
            <p className="text-2xl font-mono text-white">
              {regularUsers.reduce((sum, u) => sum + u.trades.length, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}