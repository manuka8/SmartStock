import { useState, useEffect } from "react";
import { Bell, Shield, Store, User, CreditCard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export default function Settings() {
  const { user, updateUser } = useAuth();
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  const [storeData, setStoreData] = useState({
    agencyName: '',
    agencyId: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    postalCode: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [storeSaveMessage, setStoreSaveMessage] = useState('');
  
  const [notifications, setNotifications] = useState({
    lowStock: true,
    orders: true,
    marketing: false,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
      });
      
      // Fetch agency details
      fetchAgencyDetails();
    }
  }, [user]);

  const fetchAgencyDetails = async () => {
    try {
      const response = await apiFetch(`/api/agencies/getAgency/${user?.agency_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.agency) {
        const agency = data.agency;
        setStoreData({
          agencyName: agency.agency_name || '',
          agencyId: agency.id || '',
          email: agency.email || '',
          phoneNumber: agency.phone_number || '',
          addressLine1: agency.address_line1 || '',
          addressLine2: agency.address_line2 || '',
          city: agency.city || '',
          district: agency.district || '',
          postalCode: agency.postal_code || '',
        });
      }
    } catch (error) {
      console.error('Error fetching agency details:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const response = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local user context
      if (user) {
        updateUser({
          ...user,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
        });
      }

      setSaveMessage('Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStore = async () => {
    setIsSaving(true);
    setStoreSaveMessage('');
    try {
      const response = await apiFetch(`/api/agencies/updateAgency/${storeData.agencyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: storeData.agencyName,
          email: storeData.email,
          phone_number: storeData.phoneNumber,
          address_line1: storeData.addressLine1,
          address_line2: storeData.addressLine2,
          city: storeData.city,
          district: storeData.district,
          postal_code: storeData.postalCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update store information');
      }

      setStoreSaveMessage('Store information updated successfully!');
      setTimeout(() => setStoreSaveMessage(''), 3000);
    } catch (error) {
      setStoreSaveMessage(error instanceof Error ? error.message : 'Failed to update store information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <Input 
                  value={profileData.firstName} 
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <Input 
                  value={profileData.lastName} 
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="Enter your last name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={profileData.email} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input 
                  value={profileData.phone} 
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Input value={profileData.role} disabled />
              </div>
            </div>
            {saveMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${saveMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {saveMessage}
              </div>
            )}
            <Button className="mt-4" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <Input type="password" placeholder="Enter new password" />
              </div>
            </div>
            <Button variant="outline" className="mt-4">Update Password</Button>
          </div>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Store Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Store Name</label>
                <Input 
                  value={storeData.agencyName}
                  onChange={(e) => setStoreData({ ...storeData, agencyName: e.target.value })}
                  placeholder="Enter store name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Store ID</label>
                <Input value={storeData.agencyId} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input 
                  value={storeData.email}
                  onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
                  placeholder="Enter store email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input 
                  value={storeData.phoneNumber}
                  onChange={(e) => setStoreData({ ...storeData, phoneNumber: e.target.value })}
                  placeholder="Enter store phone"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Address Line 1</label>
                <Input 
                  value={storeData.addressLine1}
                  onChange={(e) => setStoreData({ ...storeData, addressLine1: e.target.value })}
                  placeholder="Enter street address"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Address Line 2</label>
                <Input 
                  value={storeData.addressLine2}
                  onChange={(e) => setStoreData({ ...storeData, addressLine2: e.target.value })}
                  placeholder="Enter apartment, suite, etc. (optional)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <Input 
                  value={storeData.city}
                  onChange={(e) => setStoreData({ ...storeData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">District</label>
                <Input 
                  value={storeData.district}
                  onChange={(e) => setStoreData({ ...storeData, district: e.target.value })}
                  placeholder="Enter district"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Postal Code</label>
                <Input 
                  value={storeData.postalCode}
                  onChange={(e) => setStoreData({ ...storeData, postalCode: e.target.value })}
                  placeholder="Enter postal code"
                />
              </div>
            </div>
            {storeSaveMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${storeSaveMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {storeSaveMessage}
              </div>
            )}
            <Button className="mt-4" onClick={handleSaveStore} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Stock Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Low Stock Threshold</p>
                  <p className="text-sm text-muted-foreground">Default minimum stock level</p>
                </div>
                <Input className="w-24" defaultValue="50" type="number" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto-reorder</p>
                  <p className="text-sm text-muted-foreground">Automatically create purchase orders</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when items are running low</p>
                </div>
                <Switch checked={notifications.lowStock} onCheckedChange={(v) => setNotifications({ ...notifications, lowStock: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Order Updates</p>
                  <p className="text-sm text-muted-foreground">Receive updates on purchase orders</p>
                </div>
                <Switch checked={notifications.orders} onCheckedChange={(v) => setNotifications({ ...notifications, orders: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive tips and product updates</p>
                </div>
                <Switch checked={notifications.marketing} onCheckedChange={(v) => setNotifications({ ...notifications, marketing: v })} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Current Plan</h3>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Premium</span>
            </div>
            <p className="text-muted-foreground mb-4">Your plan renews on January 1, 2026</p>
            <div className="flex gap-3">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline">View Invoice History</Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6">
            <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background">
              <div className="w-12 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">VISA</div>
              <div>
                <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/26</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4">Update Payment Method</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
