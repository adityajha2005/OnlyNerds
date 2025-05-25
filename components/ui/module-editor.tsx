import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { FaPlus, FaTrash, FaGripVertical } from 'react-icons/fa6';
import { createModule, updateModule, deleteModule } from '@/lib/actions/module.actions';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from '@hello-pangea/dnd';
import { MCQAssessment } from './mcq-assessment';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// Import MDEditor and Preview dynamically to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
const MDPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

interface ModuleEditorProps {
  courseId: string;
  onModuleChange?: () => void;
  isCreator: boolean;
}

interface Module {
  _id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  assessment?: {
    questions: {
      question: string;
      options: string[];
      correctOption: number;
    }[];
  };
}

export function ModuleEditor({ courseId, onModuleChange, isCreator }: ModuleEditorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    try {
      const response = await fetch(`/api/modules/${courseId}`);
      const data = await response.json();
      setModules(data);
      setUnsavedChanges({});
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!isCreator) return;
    try {
      const result = await createModule({
        course_id: courseId,
        name: 'New Module',
        content: '# Start writing your content here',
        index: modules.length + 1
      });

      if (result.success && result.module) {
        setModules(prevModules => [...prevModules, result.module]);
        setExpandedModule(result.module._id);
        setUnsavedChanges(prev => ({ ...prev, [result.module._id]: true }));
        if (onModuleChange) onModuleChange();
      }
    } catch (error) {
      console.error('Error creating module:', error);
    }
  };

  const handleUpdateModule = async (moduleId: string, updates: Partial<Module>, shouldSave: boolean = false) => {
    if (!isCreator) return;
    try {
      const moduleToUpdate = modules.find(m => m._id === moduleId);
      if (!moduleToUpdate) return;

      const mergedModule = {
        ...moduleToUpdate,
        ...updates,
        assessment: updates.assessment ? {
          ...moduleToUpdate.assessment,
          ...updates.assessment
        } : moduleToUpdate.assessment,
        media: updates.media || moduleToUpdate.media
      };

      setModules(prevModules => 
        prevModules.map(m => 
          m._id === moduleId 
            ? mergedModule
            : m
        )
      );

      if (!shouldSave) {
        setUnsavedChanges(prev => ({ ...prev, [moduleId]: true }));
        return;
      }

      const result = await updateModule({
        moduleId,
        name: mergedModule.name,
        content: mergedModule.content,
        media: mergedModule.media,
        index: mergedModule.index,
        assessment: mergedModule.assessment
      });

      if (result.success) {
        setUnsavedChanges(prev => {
          const newState = { ...prev };
          delete newState[moduleId];
          return newState;
        });
      } else {
        await fetchModules();
      }
    } catch (error) {
      console.error('Error updating module:', error);
      await fetchModules();
    }
  };

  const handleSaveModule = async (moduleId: string) => {
    const moduleToSave = modules.find(m => m._id === moduleId);
    if (!moduleToSave) return;

    await handleUpdateModule(moduleId, moduleToSave, true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      setModules(prevModules => prevModules.filter(m => m._id !== moduleId));
      
      const result = await deleteModule(moduleId);
      if (!result.success) {
        await fetchModules();
      } else if (onModuleChange) {
        onModuleChange();
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      await fetchModules();
    }
  };

  const handleAddMedia = (moduleId: string) => {
    if (!newMediaUrl.trim()) return;

    const module = modules.find(m => m._id === moduleId);
    if (!module) return;

    const updatedMedia = [...module.media, newMediaUrl.trim()];
    handleUpdateModule(moduleId, { media: updatedMedia });
    setNewMediaUrl('');
  };

  const handleRemoveMedia = (moduleId: string, mediaUrl: string) => {
    const module = modules.find(m => m._id === moduleId);
    if (!module) return;

    const updatedMedia = module.media.filter(url => url !== mediaUrl);
    handleUpdateModule(moduleId, { media: updatedMedia });
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedModules = items.map((item, index) => ({
      ...item,
      index: index + 1
    }));

    setModules(updatedModules);

    try {
      await Promise.all(
        updatedModules.map(module =>
          updateModule({
            moduleId: module._id,
            name: module.name,
            content: module.content,
            media: module.media,
            index: module.index,
            assessment: module.assessment
          })
        )
      );
      
      if (onModuleChange) onModuleChange();
    } catch (error) {
      console.error('Error updating module order:', error);
      await fetchModules();
    }
  };

  if (loading) {
    return <div className="text-white">Loading modules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Course Modules</h2>
        {isCreator && (
          <Button
            onClick={handleCreateModule}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <FaPlus className="mr-2" />
            Add Module
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="modules">
          {(provided: DroppableProvided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {modules.map((module, index) => (
                <Draggable
                  key={module._id}
                  draggableId={module._id}
                  index={index}
                  isDragDisabled={!isCreator}
                >
                  {(provided: DraggableProvided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-black/50 border-white/10"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {isCreator && (
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-white/60 hover:text-white"
                            >
                              <FaGripVertical />
                            </div>
                          )}
                          
                          <div className="flex-grow">
                            {isCreator ? (
                              <Input
                                value={module.name}
                                onChange={(e) => handleUpdateModule(module._id, { name: e.target.value })}
                                className="bg-black/50 border-white/20 text-white mb-2"
                              />
                            ) : (
                              <h3 className="text-lg font-semibold text-white mb-2">{module.name}</h3>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setExpandedModule(expandedModule === module._id ? null : module._id)}
                              className="text-white hover:bg-white/10"
                            >
                              {expandedModule === module._id ? 'Collapse' : 'Expand'}
                            </Button>
                            {isCreator && (
                              <>
                                {unsavedChanges[module._id] && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleSaveModule(module._id)}
                                    className="text-green-500 hover:bg-green-500/10"
                                  >
                                    Save Changes
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  onClick={() => handleDeleteModule(module._id)}
                                  className="text-red-500 hover:bg-red-500/10"
                                >
                                  <FaTrash />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {expandedModule === module._id && (
                          <div className="mt-4 space-y-4">
                            <div data-color-mode="dark">
                              {isCreator ? (
                                <MDEditor
                                  value={module.content}
                                  onChange={(value: string | undefined) => handleUpdateModule(module._id, { content: value || '' })}
                                  preview="edit"
                                  height={400}
                                />
                              ) : (
                                <div className="prose prose-invert max-w-none">
                                  <MDPreview source={module.content} />
                                </div>
                              )}
                            </div>

                            {isCreator && (
                              <div className="space-y-2">
                                <Label className="text-white">Media URLs</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newMediaUrl}
                                    onChange={(e) => setNewMediaUrl(e.target.value)}
                                    placeholder="Enter media URL"
                                    className="bg-black/50 border-white/20 text-white"
                                  />
                                  <Button
                                    onClick={() => handleAddMedia(module._id)}
                                    className="bg-white/10 hover:bg-white/20 text-white"
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {module.media.map((url, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <Input
                                        value={url}
                                        readOnly
                                        className="bg-black/50 border-white/20 text-white"
                                      />
                                      <Button
                                        variant="ghost"
                                        onClick={() => handleRemoveMedia(module._id, url)}
                                        className="text-red-500 hover:bg-red-500/10"
                                      >
                                        <FaTrash />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* MCQ Assessment */}
                            <div className="mt-8">
                              <MCQAssessment
                                moduleId={module._id}
                                questions={module.assessment?.questions || []}
                                onSave={(questions) => {
                                  handleUpdateModule(module._id, {
                                    assessment: { questions }
                                  });
                                }}
                                isCreator={isCreator}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 