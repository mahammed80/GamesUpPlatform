import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  body: string;
  updated_at: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('registration');

  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templates.length > 0) {
      const current = templates.find(t => t.type === activeTab);
      if (current) {
        setSubject(current.subject);
        setBody(current.body);
      }
    }
  }, [activeTab, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.get('/email-templates');
      setTemplates(data);
      if (data.length > 0) {
        // Initialize with first template if activeTab not in list (shouldn't happen with seeded data but good safety)
        const current = data.find((t: any) => t.type === activeTab) || data[0];
        setSubject(current.subject);
        setBody(current.body);
      }
    } catch (error) {
      toast.error('Failed to load email templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/email-templates/${activeTab}`, {
        subject,
        body
      });
      toast.success('Template updated successfully');
      // Update local state to reflect changes
      setTemplates(prev => prev.map(t => 
        t.type === activeTab ? { ...t, subject, body } : t
      ));
    } catch (error) {
      toast.error('Failed to update template');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Email Templates</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage automated email content</p>
        </div>
      </div>

      <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <TabsTrigger 
              value="registration" 
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm data-[state=active]:font-bold transition-all"
            >
              Registration
            </TabsTrigger>
            <TabsTrigger 
              value="order"
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm data-[state=active]:font-bold transition-all"
            >
              Order Confirmation
            </TabsTrigger>
            <TabsTrigger 
              value="reset_password"
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm data-[state=active]:font-bold transition-all"
            >
              Reset Password
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject"
                className="max-w-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Content (HTML)
              </label>
              <Textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<html>...</html>"
                className="min-h-[400px] font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md border border-blue-100 dark:border-blue-800">
                <span className="font-semibold">Available placeholders:</span>
                <code className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                  {activeTab === 'registration' && ' {{name}}'}
                  {activeTab === 'order' && ' {{name}}, {{orderId}}'}
                  {activeTab === 'reset_password' && ' {{link}}'}
                </code>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100 dark:border-gray-700">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
