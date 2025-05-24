'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Course, Module } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FaThumbsUp, 
  FaThumbsDown, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPlay, 
  FaImage, 
  FaFile,
  FaCodeFork,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaEye
} from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import { Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import { Navbar } from '@/components/ui/Navbar';
import { 
  getCourseById, 
  updateCourseRanking, 
  forkCourse 
} from '@/lib/actions/course.actions';
import { 
  getModulesByCourseId, 
  createModule, 
  updateModule, 
  deleteModule 
} from '@/lib/actions/module.actions';

interface ModuleFormData {
  name: string;
  content: string;
  media: string[];
  index: number;
}

interface CreateModuleModalProps {
  children: React.ReactNode;
  courseId: string;
  onModuleCreated: () => void;
  moduleCount: number;
  editingModule?: Module;
}

function CreateModuleModal({ 
  children, 
  courseId, 
  onModuleCreated, 
  moduleCount,
  editingModule 
}: CreateModuleModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ModuleFormData>({
    name: editingModule?.name || '',
    content: editingModule?.content || '',
    media: editingModule?.media || [],
    index: editingModule?.index || moduleCount + 1
  });
  const [newMediaUrl, setNewMediaUrl] = useState('');

  useEffect(() => {
    if (editingModule) {
      setFormData({
        name: editingModule.name,
        content: editingModule.content,
        media: editingModule.media,
        index: editingModule.index
      });
    }
  }, [editingModule]);

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      media: [],
      index: moduleCount + 1
    });
    setNewMediaUrl('');
  };

  const addMediaUrl = () => {
    if (newMediaUrl.trim() && !formData.media.includes(newMediaUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, newMediaUrl.trim()]
      }));
      setNewMediaUrl('');
    }
  };

  const removeMediaUrl = (url: string) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter(m => m !== url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      let result;
      if (editingModule) {
        result = await updateModule({
          moduleId: editingModule._id,
          ...formData
        });
      } else {
        result = await createModule({
          course_id: courseId,
          ...formData
        });
      }

      if (result.success) {
        setOpen(false);
        resetForm();
        onModuleCreated();
        alert(`Module ${editingModule ? 'updated' : 'created'} successfully!`);
      } else {
        alert(result.message || `Failed to ${editingModule ? 'update' : 'create'} module`);
      }
    } catch (error) {
      console.error(`Failed to ${editingModule ? 'update' : 'create'} module:`, error);
      alert(`Failed to ${editingModule ? 'update' : 'create'} module`);
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
      return <FaPlay className="text-red-500" />;
    }
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <FaImage className="text-blue-500" />;
    }
    return <FaFile className="text-gray-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-black border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Module Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter module name..."
                className="bg-black/50 border-white/20 text-white"
                required
              />
            </div>

            {/* Module Index */}
            <div className="space-y-2">
              <Label htmlFor="index" className="text-white">Module Index *</Label>
              <Input
                id="index"
                type="number"
                min="1"
                value={formData.index}
                onChange={(e) => setFormData(prev => ({ ...prev, index: parseInt(e.target.value) || 1 }))}
                className="bg-black/50 border-white/20 text-white"
                required
              />
            </div>
          </div>

          {/* Module Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Module Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter module content..."
              className="bg-black/50 border-white/20 text-white min-h-[200px]"
              required
            />
          </div>

          {/* Media URLs */}
          <div className="space-y-2">
            <Label className="text-white">Media Files</Label>
            
            {/* Add new media URL */}
            <div className="flex gap-2">
              <Input
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder="Enter media URL (video, image, etc.)"
                className="bg-black/50 border-white/20 text-white flex-1"
              />
              <Button type="button" onClick={addMediaUrl} className="bg-blue-600 hover:bg-blue-700">
                <FaPlus />
              </Button>
            </div>

            {/* Display existing media URLs */}
            {formData.media.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-white/60">Added Media Files:</p>
                {formData.media.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10">
                    {getMediaIcon(url)}
                    <span className="flex-1 text-sm text-white/80 truncate">{url}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeMediaUrl(url)}
                      className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingModule ? 'Update Module' : 'Create Module'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  // AI Transcription state for each module
  const [moduleTranscriptions, setModuleTranscriptions] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserId(walletAddress);
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      fetchModules();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const moduleData = await getModulesByCourseId(courseId);
      setModules(moduleData.sort((a, b) => a.index - b.index));
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (isUpvote: boolean) => {
    try {
      const result = await updateCourseRanking({
        courseId,
        isUpvote
      });

      if (result.success) {
        setUserVote(isUpvote ? 'up' : 'down');
        // Refetch course data to update vote counts
        fetchCourseData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to vote');
    }
  };

  const handleForkCourse = async () => {
    if (!course || !currentUserId) return;

    const newCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const result = await forkCourse({
        originalCourseId: courseId,
        newCourseId,
        creator_id: currentUserId
      });

      if (result.success) {
        alert('Course forked successfully!');
        router.push(`/my-courses/${newCourseId}`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to fork course:', error);
      alert('Failed to fork course');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      try {
        const result = await deleteModule(moduleId);
        if (result.success) {
          fetchModules();
          if (currentModuleIndex >= modules.length - 1) {
            setCurrentModuleIndex(Math.max(0, modules.length - 2));
          }
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Failed to delete module:', error);
        alert('Failed to delete module');
      }
    }
  };

  // AI Transcription handlers
  const startRecording = () => {
    setIsRecording(true);
    // Implement Web Speech API or external transcription service
    console.log('Starting recording for module:', currentModuleIndex);
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Save transcription for current module
    if (modules[currentModuleIndex]) {
      setModuleTranscriptions(prev => ({
        ...prev,
        [modules[currentModuleIndex]._id]: transcription
      }));
    }
    console.log('Stopping recording');
  };

  const isCreator = course?.creator_id === currentUserId;
  const currentModule = modules[currentModuleIndex];

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-500';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-500';
      case 'Advanced': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Web3': return 'bg-purple-500/20 text-purple-500';
      case 'AI/ML': return 'bg-blue-500/20 text-blue-500';
      case 'Full Stack Development': return 'bg-orange-500/20 text-orange-500';
      case 'Marketing': return 'bg-pink-500/20 text-pink-500';
      case 'Designs': return 'bg-teal-500/20 text-teal-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading course...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto py-8 px-4 mt-[80px]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Course Header */}
          <div className="relative">
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={course.background || '/default-course-bg.jpg'}
                alt={course.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{course.name}</h1>
                    <p className="text-white/80 mb-4">{course.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                      {course.categories.map((category) => (
                        <Badge key={category} className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                      ))}
                      {!course.isOriginal && (
                        <Badge className="bg-orange-500/20 text-orange-500">
                          <FaCodeFork className="mr-1" /> Forked
                        </Badge>
                      )}
                      {!course.isPublic && (
                        <Badge className="bg-red-500/20 text-red-500">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {/* Voting */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={userVote === 'up' ? 'default' : 'outline'}
                        onClick={() => handleVote(true)}
                        className="border-white/20"
                      >
                        <FaThumbsUp className="mr-2" />
                        {course.ranking?.upvotes || 0}
                      </Button>
                      <Button
                        size="sm"
                        variant={userVote === 'down' ? 'default' : 'outline'}
                        onClick={() => handleVote(false)}
                        className="border-white/20"
                      >
                        <FaThumbsDown className="mr-2" />
                        {course.ranking?.downvotes || 0}
                      </Button>
                    </div>
                    
                    {/* Fork Button */}
                    {!isCreator && (
                      <Button onClick={handleForkCourse} className="bg-purple-600 hover:bg-purple-700">
                        <FaCodeFork className="mr-2" />
                        Fork Course
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="flex justify-between items-center mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FaUser className="text-white/60" />
                  <span className="text-white/80">
                    {isCreator ? 'You' : `Creator: ${course.creator_id.slice(0, 8)}...`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TbTrophy className="text-yellow-500" />
                  <span className="text-white font-semibold">{course.ranking?.eloScore || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaEye className="text-white/60" />
                  <span className="text-white/80">{modules.length} modules</span>
                </div>
              </div>
              
              {!course.isOriginal && course.forkedFrom && (
                <div className="text-white/60 text-sm">
                  Forked from: {course.forkedFrom.slice(0, 12)}...
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Module Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-black/50 border-white/10">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Modules</CardTitle>
                    {isCreator && (
                      <CreateModuleModal 
                        courseId={courseId} 
                        onModuleCreated={fetchModules}
                        moduleCount={modules.length}
                      >
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <FaPlus />
                        </Button>
                      </CreateModuleModal>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {modules.map((module, index) => (
                    <div
                      key={module._id}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        index === currentModuleIndex 
                          ? 'bg-blue-600/20 border border-blue-500/30' 
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                      onClick={() => setCurrentModuleIndex(index)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{module.name}</h4>
                          <p className="text-white/60 text-sm">Module {module.index}</p>
                        </div>
                        {isCreator && (
                          <div className="flex gap-1">
                            <CreateModuleModal 
                              courseId={courseId} 
                              onModuleCreated={fetchModules}
                              moduleCount={modules.length}
                              editingModule={module}
                            >
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <FaEdit className="h-3 w-3" />
                              </Button>
                            </CreateModuleModal>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(module._id);
                              }}
                            >
                              <FaTrash className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {modules.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/60 mb-4">No modules yet</p>
                      {isCreator && (
                        <CreateModuleModal 
                          courseId={courseId} 
                          onModuleCreated={fetchModules}
                          moduleCount={0}
                        >
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <FaPlus className="mr-2" />
                            Add First Module
                          </Button>
                        </CreateModuleModal>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {currentModule ? (
                <div className="space-y-6">
                  {/* Module Navigation */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{currentModule.name}</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                        disabled={currentModuleIndex === 0}
                        className="border-white/20 text-white"
                      >
                        <FaChevronLeft />
                      </Button>
                      <span className="px-4 py-2 bg-white/5 rounded text-white">
                        {currentModuleIndex + 1} / {modules.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentModuleIndex(Math.min(modules.length - 1, currentModuleIndex + 1))}
                        disabled={currentModuleIndex === modules.length - 1}
                        className="border-white/20 text-white"
                      >
                        <FaChevronRight />
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="bg-black/50 border border-white/20">
                      <TabsTrigger value="content" className="data-[state=active]:bg-white/10">
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="media" className="data-[state=active]:bg-white/10">
                        Media ({currentModule.media.length})
                      </TabsTrigger>
                      <TabsTrigger value="transcription" className="data-[state=active]:bg-white/10">
                        AI Notes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="mt-6">
                      <Card className="bg-black/50 border-white/10">
                        <CardContent className="p-6">
                          <div className="prose prose-invert max-w-none">
                            <div className="text-white whitespace-pre-wrap">
                              {currentModule.content}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="media" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentModule.media.map((url, index) => (
                          <Card key={index} className="bg-black/50 border-white/10">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                {url.includes('youtube.com') || url.includes('youtu.be') ? (
                                  <FaPlay className="text-red-500" />
                                ) : url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <FaImage className="text-blue-500" />
                                ) : (
                                  <FaFile className="text-gray-500" />
                                )}
                                <span className="text-white font-medium">Media {index + 1}</span>
                              </div>
                              
                              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div className="relative h-48 w-full overflow-hidden rounded">
                                  <Image
                                    src={url}
                                    alt={`Media ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                  />
                                </div>
                              ) : url.includes('youtube.com') || url.includes('youtu.be') ? (
                                <div className="aspect-video">
                                  <iframe
                                    src={url.replace('watch?v=', 'embed/')}
                                    className="w-full h-full rounded"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <div className="p-4 bg-white/5 rounded border border-white/10">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 break-all"
                                  >
                                    {url}
                                  </a>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        
                        {currentModule.media.length === 0 && (
                          <div className="col-span-full text-center py-8">
                            <p className="text-white/60">No media files for this module</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="transcription" className="mt-6">
                      <Card className="bg-black/50 border-white/10">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-white">AI Transcription & Notes</CardTitle>
                            <Button
                              onClick={isRecording ? stopRecording : startRecording}
                              className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                              {isRecording ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
                              {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {isRecording && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded">
                              <p className="text-red-400 text-sm">🔴 Recording in progress...</p>
                            </div>
                          )}
                          
                          <Textarea
                            value={moduleTranscriptions[currentModule._id] || ''}
                            onChange={(e) => setModuleTranscriptions(prev => ({
                              ...prev,
                              [currentModule._id]: e.target.value
                            }))}
                            placeholder="AI transcription and your notes will appear here..."
                            className="bg-black/50 border-white/20 text-white min-h-[300px]"
                          />
                          
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              // Save transcription logic
                              console.log('Saving transcription for module:', currentModule._id);
                            }}
                          >
                            Save Notes
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-white/60 text-lg mb-4">No modules available</p>
                  {isCreator && (
                    <CreateModuleModal 
                      courseId={courseId} 
                      onModuleCreated={fetchModules}
                      moduleCount={0}
                    >
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <FaPlus className="mr-2" />
                        Create First Module
                      </Button>
                    </CreateModuleModal>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}