'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Category, Difficulty, CourseWithRanking } from '@/lib/types';
import { createCourse, updateCourse } from '@/lib/actions/course.actions';
import { FaPlus } from 'react-icons/fa6';
import { TimerResetIcon } from 'lucide-react';

interface CreateCourseModalProps {
  children: React.ReactNode;
  onCourseCreated?: () => void;
  currentUserId: string;
  editingCourse?: CourseWithRanking;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateCourseModal({ 
  children, 
  onCourseCreated, 
  currentUserId, 
  editingCourse,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: CreateCourseModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    background: '',
    difficulty: '' as Difficulty | '',
    isPublic: true,
    selectedCategories: [] as Category[]
  });

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  // Populate form data when editing course changes
  useEffect(() => {
    if (editingCourse) {
      setFormData({
        name: editingCourse.name,
        description: editingCourse.description || '',
        background: editingCourse.background || '',
        difficulty: editingCourse.difficulty,
        isPublic: editingCourse.isPublic,
        selectedCategories: editingCourse.categories
      });
    } else {
      resetForm();
    }
  }, [editingCourse]);

  const categories: Category[] = ['Web3', 'AI/ML', 'Full Stack Development', 'Marketing', 'Designs'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  const handleCategoryToggle = (category: Category) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      background: '',
      difficulty: '',
      isPublic: true,
      selectedCategories: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.difficulty || formData.selectedCategories.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      let result;
      if (editingCourse) {
        // Update existing course
        result = await updateCourse({
          courseId: editingCourse._id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          background: formData.background.trim() || undefined,
          creator_id: currentUserId,
          isPublic: formData.isPublic,
          categories: formData.selectedCategories,
          difficulty: formData.difficulty as Difficulty,
          isOriginal: editingCourse.isOriginal,
          forkedFrom: editingCourse.forkedFrom
        });
      } else {
        // Create new course
        result = await createCourse({
          name: formData.name.trim(),
          description: formData.description.trim(),
          background: formData.background.trim() || undefined,
          creator_id: currentUserId,
          isPublic: formData.isPublic,
          categories: formData.selectedCategories,
          difficulty: formData.difficulty as Difficulty,
          isOriginal: true
        });
      }

      if (result.success) {
        setOpen(false);
        resetForm();
        onCourseCreated?.();
        alert(`Course ${editingCourse ? 'updated' : 'created'} successfully!`);
      } else {
        alert(result.message || `Failed to ${editingCourse ? 'update' : 'create'} course`);
      }
    } catch (error) {
      console.error(`Failed to ${editingCourse ? 'update' : 'create'} course:`, error);
      alert(`Failed to ${editingCourse ? 'update' : 'create'} course`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: Category) => {
    switch(category) {
      case 'Web3':
        return 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30';
      case 'AI/ML':
        return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30';
      case 'Full Stack Development':
        return 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30';
      case 'Marketing':
        return 'bg-pink-500/20 text-pink-500 hover:bg-pink-500/30';
      case 'Designs':
        return 'bg-teal-500/20 text-teal-500 hover:bg-teal-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-black border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingCourse ? 'Edit Course' : 'Create New Course'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Course Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter course name..."
              className="bg-black/50 border-white/20 text-white"
              maxLength={70}
              required
            />
            <p className="text-xs text-white/60">{formData.name.length}/70 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your course..."
              className="bg-black/50 border-white/20 text-white min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-white/60">{formData.description.length}/500 characters</p>
          </div>

          {/* Background Image URL */}
          <div className="space-y-2">
            <Label htmlFor="background" className="text-white">
              Background Image URL
            </Label>
            <Input
              id="background"
              type="url"
              value={formData.background}
              onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="bg-black/50 border-white/20 text-white"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-white">Categories * (Select at least one)</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  className={`cursor-pointer transition-colors ${
                    formData.selectedCategories.includes(category)
                      ? getCategoryColor(category)
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                  {formData.selectedCategories.includes(category) && (
                    <TimerResetIcon className="ml-2 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-white">Difficulty *</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as Difficulty }))}
            >
              <SelectTrigger className="bg-black/50 border-white/20 text-white">
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {difficulties.map(difficulty => (
                  <SelectItem key={difficulty} value={difficulty} className="text-white">
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-white">Visibility</Label>
            <Select
              value={formData.isPublic ? 'public' : 'private'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isPublic: value === 'public' }))}
            >
              <SelectTrigger className="bg-black/50 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                <SelectItem value="public" className="text-white">
                  Public - Anyone can see this course
                </SelectItem>
                <SelectItem value="private" className="text-white">
                  Private - Only you can see this course
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="flex-1 border-white/20 text-white bg-black"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading 
                ? (editingCourse ? 'Updating...' : 'Creating...') 
                : (editingCourse ? 'Update Course' : 'Create Course')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}