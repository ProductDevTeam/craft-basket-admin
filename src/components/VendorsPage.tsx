import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  UserPlus,
  User,
  Loader2,
  Package,
  RefreshCw,
  MoreHorizontal,
  Plus,
  Eye,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Vendor } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence, PageTransition } from '@/lib/motion';
import { TableSkeleton } from '@/components/ui/skeletons';

export function VendorsPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getVendors();
      if (response.success && response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const response = await apiClient.inviteVendor(inviteEmail);
      if (response.success) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setDialogOpen(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      toast.error(errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchQuery.toLowerCase();
    const businessName = vendor.vendorInfo?.businessName?.toLowerCase() || '';
    const fullName = `${vendor.firstName} ${vendor.lastName}`.toLowerCase();
    const email = vendor.email.toLowerCase();

    return (
      businessName.includes(searchLower) ||
      fullName.includes(searchLower) ||
      email.includes(searchLower)
    );
  });

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">
            Manage marketplace vendors and send invitations
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="text-white"
                style={{ backgroundColor: '#F6511E' }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Vendor
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Vendor</DialogTitle>
              <DialogDescription>
                Send an invitation email to a new vendor to join the marketplace.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteVendor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-email">Vendor Email</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={isInviting}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting}
                  className="text-white"
                  style={{ backgroundColor: '#F6511E' }}
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search & Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, business name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchVendors}
          disabled={isLoading}
          className="shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Vendors Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 text-sm text-gray-600"
      >
        <Badge variant="secondary">
          {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
        </Badge>
        {searchQuery && (
          <span>matching "{searchQuery}"</span>
        )}
      </motion.div>

      {/* Vendors Table */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TableSkeleton rows={6} columns={5} />
          </motion.div>
        ) : filteredVendors.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#FEF3F0' }}
                >
                  <User className="w-8 h-8" style={{ color: '#F6511E' }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No vendors found' : 'No vendors yet'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? `No vendors match your search "${searchQuery}". Try a different search term.`
                    : 'Get started by inviting vendors to join your marketplace.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="text-white"
                    style={{ backgroundColor: '#F6511E' }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Your First Vendor
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">Business Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor, index) => (
                    <motion.tr
                      key={vendor._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-medium text-sm"
                            style={{ backgroundColor: '#F6511E' }}
                          >
                            {vendor.firstName.charAt(0)}
                            {vendor.lastName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {vendor.firstName} {vendor.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {vendor.vendorInfo?.businessName || '—'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {vendor.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/products?vendor=${vendor._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Products
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/create-product?vendor=${vendor._id}`)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
