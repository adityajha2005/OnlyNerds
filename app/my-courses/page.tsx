'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourseWithRanking, Category, Difficulty } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaThumbsUp, FaThumbsDown, FaMagnifyingGlass, FaPlus, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import { Edit3, TimerResetIcon } from 'lucide-react';
import Image from 'next/image';
import {deleteCourse, updateCourse, createCourse, getCourseByCreatorId } from '@/lib/actions/course.actions';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';

type SortOption = 'popular' | 'newest' | 'ranking';
type ViewMode = 'all' | 'public' | 'private' | 'original' | 'forked';

interface CreateCourseModalProps {
  children: React.ReactNode;
  onCourseCreated?: () => void;
  currentUserId: string;
  editingCourse?: CourseWithRanking; // Add this prop for editing
  open?: boolean; // Add this for external control
  onOpenChange?: (open: boolean) => void; // Add this for external control
}

function CreateCourseModal({ 
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

  const categories: Category[] = ['Web3', 'AI/ML', 'Full Stack Development', 'Marketing', 'Designs'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

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

  const generateCourseId = () => {
    return `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

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
        const courseId = generateCourseId();
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
              className="flex-1 border-white/20 bg-black text-white"
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

export default function MyCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithRanking | null>(null);

  // Get wallet address from localStorage
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserId(walletAddress);
    }
  }, []);

  const categories: Category[] = ['Web3', 'AI/ML', 'Full Stack Development', 'Marketing', 'Designs'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  const fetchUserCourses = useCallback(async () => {
    try {
      setLoading(true);
      const userCourses = await getCourseByCreatorId(currentUserId);
      if(userCourses){
        setCourses(userCourses);
      }
    } catch (error) {
      console.error('Failed to fetch user courses:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchUserCourses();
    }
  }, [currentUserId, fetchUserCourses]);

  const handleEditCourse = (course: CourseWithRanking) => {
    setEditingCourse(course);
    setEditModalOpen(true);
  };

  const handleEditModalClose = (open: boolean) => {
    setEditModalOpen(open);
    if (!open) {
      setEditingCourse(null);
    }
  };

  // ...existing code for filtering, sorting, etc...

  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.categories.includes(selectedCategory as Category);
      const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
      
      // Filter by view mode
      let matchesViewMode = true;
      switch (viewMode) {
        case 'public':
          matchesViewMode = course.isPublic;
          break;
        case 'private':
          matchesViewMode = !course.isPublic;
          break;
        case 'original':
          matchesViewMode = course.isOriginal;
          break;
        case 'forked':
          matchesViewMode = !course.isOriginal;
          break;
      }
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesViewMode;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.ranking?.upvotes || 0) - (a.ranking?.upvotes || 0);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'ranking':
          return (b.ranking?.eloScore || 0) - (a.ranking?.eloScore || 0);
        default:
          return 0;
      }
    });

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const result = await deleteCourse(courseId);
        if (result.success) {
          setCourses(courses.filter(course => course._id !== courseId));
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Failed to delete course:', error);
        alert('Failed to delete course');
      }
    }
  };

  const handleToggleVisibility = async (courseId: string, currentVisibility: boolean) => {
    try {
      const course = courses.find(c => c._id === courseId);
      if (!course) return;

      const result = await updateCourse({
        courseId,
        name: course.name,
        description: course.description,
        background: course.background,
        creator_id: course.creator_id,
        isPublic: !currentVisibility,
        categories: course.categories,
        difficulty: course.difficulty,
        isOriginal: course.isOriginal,
        forkedFrom: course.forkedFrom
      });

      if (result.success) {
        setCourses(courses.map(c => 
          c._id === courseId ? { ...c, isPublic: !currentVisibility } : c
        ));
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to update course visibility:', error);
      alert('Failed to update course visibility');
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch(difficulty) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-500';
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'Advanced':
        return 'bg-red-500/20 text-red-500';
    }
  };

  const getCategoryColor = (category: Category) => {
    switch(category) {
      case 'Web3':
        return 'bg-purple-500/20 text-purple-500';
      case 'AI/ML':
        return 'bg-blue-500/20 text-blue-500';
      case 'Full Stack Development':
        return 'bg-orange-500/20 text-orange-500';
      case 'Marketing':
        return 'bg-pink-500/20 text-pink-500';
      case 'Designs':
        return 'bg-teal-500/20 text-teal-500';
    }
  };

  const getEloScoreColor = (eloScore: number) => {
    if (eloScore >= 2000) return 'text-yellow-500';
    if (eloScore >= 1800) return 'text-gray-400';
    if (eloScore >= 1600) return 'text-amber-600';
    return 'text-white/60';
  };

  const getCourseCounts = () => {
    return {
      total: courses.length,
      public: courses.filter(c => c.isPublic).length,
      private: courses.filter(c => !c.isPublic).length,
      original: courses.filter(c => c.isOriginal).length,
      forked: courses.filter(c => !c.isOriginal).length
    };
  };

  const counts = getCourseCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar/>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8 mt-[50px]">
          {/* Header and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Courses</h1>
              <p className="text-white/60">Manage and organize your courses</p>
            </div>
            <div className="flex gap-4">
              <div className="relative w-full md:w-96">
                <Input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 text-white border-white/20 pl-10"
                />
                <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
              <CreateCourseModal currentUserId={currentUserId} onCourseCreated={fetchUserCourses}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FaPlus className="mr-2" />
                  New Course
                </Button>
              </CreateCourseModal>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-black/50 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{counts.total}</div>
                <div className="text-sm text-white/60">Total Courses</div>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{counts.public}</div>
                <div className="text-sm text-white/60">Public</div>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">{counts.private}</div>
                <div className="text-sm text-white/60">Private</div>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{counts.original}</div>
                <div className="text-sm text-white/60">Original</div>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500">{counts.forked}</div>
                <div className="text-sm text-white/60">Forked</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
            >
              <SelectTrigger className="w-[180px] bg-black/50 text-white border-white/20">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/20">
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="public">Public Only</SelectItem>
                <SelectItem value="private">Private Only</SelectItem>
                <SelectItem value="original">Original Only</SelectItem>
                <SelectItem value="forked">Forked Only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as Category | 'all')}
            >
              <SelectTrigger className="w-[180px] bg-black/50 text-white border-white/20">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/20">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedDifficulty}
              onValueChange={(value) => setSelectedDifficulty(value as Difficulty | 'all')}
            >
              <SelectTrigger className="w-[180px] bg-black/50 text-white border-white/20">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-white/20">
                <SelectItem value="all">All Levels</SelectItem>
                {difficulties.map(difficulty => (
                  <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-grow" />

            <Tabs defaultValue="newest" value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <TabsList className="bg-black/50 border border-white/20">
                <TabsTrigger value="newest" className="data-[state=active]:bg-white/10">
                  Newest
                </TabsTrigger>
                <TabsTrigger value="popular" className="data-[state=active]:bg-white/10">
                  Popular
                </TabsTrigger>
                <TabsTrigger value="ranking" className="data-[state=active]:bg-white/10">
                  Top Rated
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.map((course) => (
              <div
                key={course._id}
                onClick={(e) => {
                  // Check if click target is one of the action buttons
                  if ((e.target as HTMLElement).closest('button')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  e.preventDefault();
                  router.push(`/my-courses/${course._id}`);
                }}
                className="group relative rounded-lg border border-white/10 hover:border-white/20 transition-all overflow-hidden cursor-pointer"
              >
                {/* Course Background Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={course.background || '/default-course-bg.jpg'}
                    alt={course.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge 
                      className={`${getDifficultyColor(course.difficulty)}`}
                    >
                      {course.difficulty}
                    </Badge>
                    {!course.isPublic && (
                      <Badge className="bg-red-500/20 text-red-500">
                        Private
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/50 border-white/20 text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleVisibility(course._id, course.isPublic);
                      }}
                    >
                      {course.isPublic ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/50 border-white/20 text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditCourse(course);
                      }}
                    >
                      <Edit3 />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/50 border-red-500/20 text-red-500 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteCourse(course._id);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{course.name}</h3>
                  <p className="text-white/60 mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.categories.map((category) => (
                      <Badge key={category} className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    ))}
                  </div>

                  {/* Ranking Information */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <FaThumbsUp className="text-green-500" />
                          <span className="text-white">{course.ranking?.upvotes || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaThumbsDown className="text-red-500" />
                          <span className="text-white">{course.ranking?.downvotes || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TbTrophy className={getEloScoreColor(course.ranking?.eloScore || 0)} />
                        <span className={`font-semibold ${getEloScoreColor(course.ranking?.eloScore || 0)}`}>
                          {course.ranking?.eloScore || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-white/40 text-sm">
                      {course.isPublic ? 'Public' : 'Private'} • {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                    {!course.isOriginal && (
                      <Badge variant="outline" className="text-white/60 border-white/20">
                        Forked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg mb-4">
                {courses.length === 0 
                  ? "You haven't created any courses yet" 
                  : "No courses found matching your criteria"
                }
              </p>
              {courses.length === 0 && (
                <CreateCourseModal currentUserId={currentUserId} onCourseCreated={fetchUserCourses}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <FaPlus className="mr-2" />
                    Create Your First Course
                  </Button>
                </CreateCourseModal>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <CreateCourseModal
        currentUserId={currentUserId}
        onCourseCreated={fetchUserCourses}
        editingCourse={editingCourse || undefined}
        open={editModalOpen}
        onOpenChange={handleEditModalClose}
      >
        <div></div>
      </CreateCourseModal>
    </div>
  );
}