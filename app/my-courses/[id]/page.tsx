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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  FaEye,
  FaCopy,
  FaExpand,
  FaCompress,
  FaListOl,
  FaGraduationCap,
  FaLink,
  FaHeading,
  FaBold,
  FaItalic,
  FaListUl,
  FaQuoteLeft,
  FaCode,
  FaStrikethrough
} from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import { Mic, MicOff, ArrowUp, ArrowDown, Hash, Type, AlignLeft } from 'lucide-react';
import Image from 'next/image';
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
import { Navbar } from '@/components/ui/Navbar';

interface ModuleFormData {
  name: string;
  content: string;
  media: string[];
  index: number;
}

interface Assessment {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface ModuleSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code' | 'divider' | 'media' | 'assessment';
  content: string;
  level?: number; // for headings (1-6)
  listType?: 'ordered' | 'unordered'; // for lists
  items?: string[]; // for lists
  mediaUrl?: string; // for media
  assessment?: Assessment; // for assessments
}

interface OriginalModule {
  _id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  sections?: ModuleSection[];
  isFromOriginal?: boolean;
}

interface ForkCourseModalProps {
  children: React.ReactNode;
  course: Course;
  currentUserId: string;
  onForkSuccess: (newCourseId: string) => void;
}

function ForkCourseModal({ children, course, currentUserId, onForkSuccess }: ForkCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFork = async () => {
    try {
      setLoading(true);
      const newCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await forkCourse({
        originalCourseId: course._id,
        newCourseId,
        creator_id: currentUserId,
      });

      if (result.success) {
        setOpen(false);
        onForkSuccess(newCourseId);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to fork course:', error);
      alert('Failed to fork course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-black border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Fork Course</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to fork "{course.name}"? This will create a copy of the course structure that you can modify.
          </p>
          
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFork}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading}
            >
              {loading ? 'Forking...' : 'Fork Course'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface NotionEditorProps {
  sections: ModuleSection[];
  onChange: (sections: ModuleSection[]) => void;
}

function NotionEditor({ sections, onChange }: NotionEditorProps) {
  const addSection = (type: ModuleSection['type'], index?: number) => {
    const newSection: ModuleSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      ...(type === 'heading' && { level: 1 }),
      ...(type === 'list' && { listType: 'unordered', items: [''] }),
      ...(type === 'assessment' && { 
        assessment: {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      })
    };

    if (index !== undefined) {
      const newSections = [...sections];
      newSections.splice(index + 1, 0, newSection);
      onChange(newSections);
    } else {
      onChange([...sections, newSection]);
    }
  };

  const updateSection = (id: string, updates: Partial<ModuleSection>) => {
    onChange(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (id: string) => {
    onChange(sections.filter(section => section.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    onChange(newSections);
  };

  const embedMedia = (url: string, sectionId: string) => {
    if (!url.trim()) return;
    
    updateSection(sectionId, { mediaUrl: url.trim() });
  };

  const renderSection = (section: ModuleSection, index: number) => {
    return (
      <div key={section.id} className="group relative border border-white/10 rounded-lg p-4 hover:border-white/20">
        {/* Section Controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moveSection(section.id, 'up')}
            disabled={index === 0}
            className="h-6 w-6 p-0"
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moveSection(section.id, 'down')}
            disabled={index === sections.length - 1}
            className="h-6 w-6 p-0"
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteSection(section.id)}
            className="h-6 w-6 p-0 text-red-500"
          >
            <FaTrash className="w-3 h-3" />
          </Button>
        </div>

        {/* Section Content */}
        <div className="space-y-3">
          {section.type === 'heading' && (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Select
                  value={section.level?.toString() || '1'}
                  onValueChange={(value) => updateSection(section.id, { level: parseInt(value) })}
                >
                  <SelectTrigger className="w-20 bg-black/50 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    {[1, 2, 3, 4, 5, 6].map(level => (
                      <SelectItem key={level} value={level.toString()}>H{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FaHeading className="text-white/60" />
              </div>
              <Input
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                placeholder="Enter heading..."
                className="bg-black/50 border-white/20 text-white text-lg font-bold"
              />
            </div>
          )}

          {section.type === 'paragraph' && (
            <Textarea
              value={section.content}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
              placeholder="Type your paragraph here..."
              className="bg-black/50 border-white/20 text-white min-h-[100px]"
            />
          )}

          {section.type === 'list' && (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Select
                  value={section.listType || 'unordered'}
                  onValueChange={(value: 'ordered' | 'unordered') => 
                    updateSection(section.id, { listType: value })}
                >
                  <SelectTrigger className="w-32 bg-black/50 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="unordered">Bullets</SelectItem>
                    <SelectItem value="ordered">Numbers</SelectItem>
                  </SelectContent>
                </Select>
                {section.listType === 'ordered' ? <FaListOl /> : <FaListUl />}
              </div>
              <div className="space-y-2">
                {(section.items || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newItems = [...(section.items || [])];
                        newItems[idx] = e.target.value;
                        updateSection(section.id, { items: newItems });
                      }}
                      placeholder={`Item ${idx + 1}...`}
                      className="bg-black/50 border-white/20 text-white"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newItems = (section.items || []).filter((_, i) => i !== idx);
                        updateSection(section.id, { items: newItems });
                      }}
                      className="text-red-500"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() => {
                    const newItems = [...(section.items || []), ''];
                    updateSection(section.id, { items: newItems });
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FaPlus className="mr-2" /> Add Item
                </Button>
              </div>
            </div>
          )}

          {section.type === 'quote' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaQuoteLeft className="text-white/60" />
                <span className="text-white/60">Quote</span>
              </div>
              <Textarea
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                placeholder="Enter your quote..."
                className="bg-black/50 border-white/20 text-white border-l-4 border-l-blue-500"
              />
            </div>
          )}

          {section.type === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaCode className="text-white/60" />
                <span className="text-white/60">Code Block</span>
              </div>
              <Textarea
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                placeholder="Enter your code..."
                className="bg-black/80 border-white/20 text-green-400 font-mono"
              />
            </div>
          )}

          {section.type === 'media' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FaLink className="text-white/60" />
                <span className="text-white/60">Media Embed</span>
              </div>
              <Input
                value={section.mediaUrl || ''}
                onChange={(e) => updateSection(section.id, { mediaUrl: e.target.value })}
                placeholder="Enter media URL (YouTube, image, etc.)..."
                className="bg-black/50 border-white/20 text-white"
              />
              {section.mediaUrl && (
                <div className="border border-white/10 rounded p-4">
                  {section.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="relative h-48 w-full overflow-hidden rounded">
                      <Image
                        src={section.mediaUrl}
                        alt="Embedded media"
                        fill
                        className="object-cover"
                        sizes="100%"
                      />
                    </div>
                  ) : section.mediaUrl.includes('youtube.com') || section.mediaUrl.includes('youtu.be') ? (
                    <div className="aspect-video">
                      <iframe
                        src={section.mediaUrl.replace('watch?v=', 'embed/')}
                        className="w-full h-full rounded"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 rounded">
                      <a 
                        href={section.mediaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all"
                      >
                        {section.mediaUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {section.type === 'assessment' && (
            <div className="space-y-4 border border-yellow-500/20 rounded-lg p-4 bg-yellow-500/5">
              <div className="flex items-center gap-2">
                <FaGraduationCap className="text-yellow-500" />
                <span className="text-yellow-500 font-medium">Assessment</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-white">Question</Label>
                  <Textarea
                    value={section.assessment?.question || ''}
                    onChange={(e) => updateSection(section.id, {
                      assessment: { 
                        ...section.assessment!, 
                        question: e.target.value 
                      }
                    })}
                    placeholder="Enter your question..."
                    className="bg-black/50 border-white/20 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white">Options</Label>
                  <div className="space-y-2 mt-2">
                    {(section.assessment?.options || []).map((option, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="radio"
                          name={`correct-${section.id}`}
                          checked={section.assessment?.correctAnswer === idx}
                          onChange={() => updateSection(section.id, {
                            assessment: {
                              ...section.assessment!,
                              correctAnswer: idx
                            }
                          })}
                          className="text-green-500"
                        />
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(section.assessment?.options || [])];
                            newOptions[idx] = e.target.value;
                            updateSection(section.id, {
                              assessment: {
                                ...section.assessment!,
                                options: newOptions
                              }
                            });
                          }}
                          placeholder={`Option ${idx + 1}...`}
                          className="bg-black/50 border-white/20 text-white flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white">Explanation (Optional)</Label>
                  <Textarea
                    value={section.assessment?.explanation || ''}
                    onChange={(e) => updateSection(section.id, {
                      assessment: {
                        ...section.assessment!,
                        explanation: e.target.value
                      }
                    })}
                    placeholder="Explain the correct answer..."
                    className="bg-black/50 border-white/20 text-white mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {section.type === 'divider' && (
            <div className="border-t border-white/20 my-4" />
          )}

          {/* Add Section Button */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('heading', index)}
                className="text-xs"
              >
                <FaHeading className="mr-1" /> Heading
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('paragraph', index)}
                className="text-xs"
              >
                <AlignLeft className="mr-1 w-3 h-3" /> Text
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('list', index)}
                className="text-xs"
              >
                <FaListUl className="mr-1" /> List
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('quote', index)}
                className="text-xs"
              >
                <FaQuoteLeft className="mr-1" /> Quote
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('code', index)}
                className="text-xs"
              >
                <FaCode className="mr-1" /> Code
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('media', index)}
                className="text-xs"
              >
                <FaImage className="mr-1" /> Media
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('assessment', index)}
                className="text-xs"
              >
                <FaGraduationCap className="mr-1" /> Quiz
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addSection('divider', index)}
                className="text-xs"
              >
                --- Divider
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-white/20 rounded-lg">
          <p className="text-white/60 mb-4">Start creating your content</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => addSection('heading')} size="sm">
              <FaHeading className="mr-2" /> Add Heading
            </Button>
            <Button onClick={() => addSection('paragraph')} size="sm">
              <AlignLeft className="mr-2 w-4 h-4" /> Add Text
            </Button>
            <Button onClick={() => addSection('media')} size="sm">
              <FaImage className="mr-2" /> Add Media
            </Button>
          </div>
        </div>
      )}

      {sections.map((section, index) => renderSection(section, index))}

      {sections.length > 0 && (
        <div className="flex gap-2 justify-center mt-6 p-4 border border-dashed border-white/20 rounded-lg">
          <Button onClick={() => addSection('heading')} size="sm" variant="ghost">
            <FaHeading className="mr-1" /> Heading
          </Button>
          <Button onClick={() => addSection('paragraph')} size="sm" variant="ghost">
            <AlignLeft className="mr-1 w-3 h-3" /> Text
          </Button>
          <Button onClick={() => addSection('list')} size="sm" variant="ghost">
            <FaListUl className="mr-1" /> List
          </Button>
          <Button onClick={() => addSection('quote')} size="sm" variant="ghost">
            <FaQuoteLeft className="mr-1" /> Quote
          </Button>
          <Button onClick={() => addSection('code')} size="sm" variant="ghost">
            <FaCode className="mr-1" /> Code
          </Button>
          <Button onClick={() => addSection('media')} size="sm" variant="ghost">
            <FaImage className="mr-1" /> Media
          </Button>
          <Button onClick={() => addSection('assessment')} size="sm" variant="ghost">
            <FaGraduationCap className="mr-1" /> Quiz
          </Button>
        </div>
      )}
    </div>
  );
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
  const [sections, setSections] = useState<ModuleSection[]>([]);
  const [editorMode, setEditorMode] = useState<'simple' | 'notion'>('notion');

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

  useEffect(() => {
    if (open && !editingModule && sections.length === 0) {
      setSections([
        {
          id: `section_${Date.now()}`,
          type: 'heading',
          content: '',
          level: 1
        }
      ]);
    }
  }, [open, editingModule, sections.length]);

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      media: [],
      index: moduleCount + 1
    });
    setSections([]);
  };

  const convertSectionsToContent = () => {
    return sections.map(section => {
      switch (section.type) {
        case 'heading':
          return `${'#'.repeat(section.level || 1)} ${section.content}`;
        case 'paragraph':
          return section.content;
        case 'list':
          return (section.items || []).map((item, idx) => 
            section.listType === 'ordered' ? `${idx + 1}. ${item}` : `• ${item}`
          ).join('\n');
        case 'quote':
          return `> ${section.content}`;
        case 'code':
          return `\`\`\`\n${section.content}\n\`\`\``;
        case 'media':
          return `[Media: ${section.mediaUrl}]`;
        case 'assessment':
          return `[Quiz: ${section.assessment?.question}]`;
        case 'divider':
          return '---';
        default:
          return section.content;
      }
    }).join('\n\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a module name');
      return;
    }

    const finalContent = editorMode === 'notion' ? convertSectionsToContent() : formData.content;
    
    if (!finalContent.trim()) {
      alert('Please add some content to the module');
      return;
    }

    try {
      setLoading(true);
      
      let result;
      if (editingModule) {
        result = await updateModule({
          moduleId: editingModule._id,
          ...formData,
          content: finalContent
        });
      } else {
        result = await createModule({
          course_id: courseId,
          ...formData,
          content: finalContent
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-black border-white/20 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-white">Module Content *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={editorMode === 'simple' ? 'default' : 'outline'}
                  onClick={() => setEditorMode('simple')}
                  className="border-white/20"
                >
                  Simple Editor
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editorMode === 'notion' ? 'default' : 'outline'}
                  onClick={() => setEditorMode('notion')}
                  className="border-white/20"
                >
                  <FaListOl className="mr-2" />
                  Notion-like Editor
                </Button>
              </div>
            </div>

            {editorMode === 'simple' ? (
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter module content..."
                className="bg-black/50 border-white/20 text-white min-h-[300px]"
                required
              />
            ) : (
              <div className="border border-white/20 rounded-lg p-4 bg-black/30">
                <NotionEditor sections={sections} onChange={setSections} />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/10">
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
  const [moduleTranscriptions, setModuleTranscriptions] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserId(walletAddress);
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      const loadData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchCourseData(),
            fetchModules()
          ]);
        } catch (error) {
          console.error('Failed to load course data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
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
      const moduleData = await getModulesByCourseId(courseId);
      setModules(moduleData.sort((a, b) => a.index - b.index));
    } catch (error) {
      console.error('Failed to fetch modules:', error);
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
        fetchCourseData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to vote');
    }
  };

  const handleForkSuccess = (newCourseId: string) => {
    alert('Course forked successfully!');
    router.push(`/my-courses`);
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

  const startRecording = () => {
    setIsRecording(true);
    console.log('Starting recording for module:', currentModuleIndex);
  };

  const stopRecording = () => {
    setIsRecording(false);
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
    <div className="min-h-screen bg-black pt-20">
      <Navbar/>
      <div className="container mx-auto py-8 px-4">
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
                    
                    {!isCreator && (
                      <ForkCourseModal
                        course={course}
                        currentUserId={currentUserId}
                        onForkSuccess={handleForkSuccess}
                      >
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <FaCodeFork className="mr-2" />
                          Fork Course
                        </Button>
                      </ForkCourseModal>
                    )}
                  </div>
                </div>
              </div>
            </div>

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