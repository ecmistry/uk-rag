import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from 'streamdown';

export default function Commentary() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const utils = trpc.useUtils();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    period: '',
    status: 'draft' as 'draft' | 'published',
  });

  // Fetch commentaries
  const { data: commentaries, isLoading } = isAdmin
    ? trpc.commentary.listAll.useQuery()
    : trpc.commentary.listPublished.useQuery();

  // Create mutation
  const createMutation = trpc.commentary.create.useMutation({
    onSuccess: () => {
      toast.success('Commentary created successfully');
      utils.commentary.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create commentary: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = trpc.commentary.update.useMutation({
    onSuccess: () => {
      toast.success('Commentary updated successfully');
      utils.commentary.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update commentary: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.commentary.delete.useMutation({
    onSuccess: () => {
      toast.success('Commentary deleted successfully');
      utils.commentary.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete commentary: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      period: '',
      status: 'draft',
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (commentary: any) => {
    setEditingId(commentary.id);
    setFormData({
      title: commentary.title,
      content: commentary.content,
      period: commentary.period,
      status: commentary.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this commentary?')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="w-full">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Quarterly Commentary</h1>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? 'Manage board-style analysis and insights' : 'Published analysis and insights'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Commentary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Commentary' : 'New Commentary'}</DialogTitle>
                  <DialogDescription>
                    Create or edit quarterly analysis and policy recommendations
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Q1 2025 Economic Review"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="period">Period</Label>
                      <Input
                        id="period"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        placeholder="Q1 2025"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content (Markdown supported)</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="## Overview&#10;&#10;The UK economy showed..."
                        rows={12}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'draft' | 'published') =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Commentary List */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : commentaries && commentaries.length > 0 ? (
          <div className="space-y-6">
            {commentaries.map((commentary) => (
              <Card key={commentary.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{commentary.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {commentary.period}
                        {commentary.publishedAt && (
                          <> • Published {new Date(commentary.publishedAt).toLocaleDateString()}</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={commentary.status === 'published' ? 'default' : 'secondary'}>
                        {commentary.status}
                      </Badge>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(commentary)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => commentary.id && handleDelete(commentary.id)}
                            disabled={deleteMutation.isPending || !commentary.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{commentary.content}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No commentary available</p>
              {isAdmin && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Commentary
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
