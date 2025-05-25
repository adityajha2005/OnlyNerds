'use client';

import { useState, useEffect } from 'react';
import { CourseWithRanking, Category, Difficulty } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaThumbsUp, FaThumbsDown, FaMagnifyingGlass, FaSpinner, FaCodeBranch } from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCourses, forkCourse } from '@/lib/actions/course.actions';
import { Navbar } from '@/components/ui/Navbar';

type SortOption = 'createdAt' | 'eloScore' | 'popular';

interface CoursesResponse {
  courses: CourseWithRanking[];
  totalPages: number;
  currentPage: number;
  totalCourses: number;
}

export default function CoursesPage() {
  const router = useRouter();
  
  // State management
  const [courses, setCourses] = useState<CourseWithRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [forkingCourseId, setForkingCourseId] = useState<string | null>(null);
  
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  
  // Search debounce
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const categories: Category[] = ['Web3', 'AI/ML', 'Full Stack Development', 'Marketing', 'Designs'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
  const coursesPerPage = 12;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses();
  }, [debouncedSearchQuery, selectedCategory, selectedDifficulty, sortBy, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCategory, selectedDifficulty, sortBy]);

  useEffect(() => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      setCurrentUserId(walletAddress);
    }
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
        searchQuery: debouncedSearchQuery || undefined,
        page: currentPage,
        limit: coursesPerPage,
        sortBy: sortBy === 'popular' ? 'eloScore' : sortBy as 'createdAt' | 'eloScore'
      };

      const response = await getCourses(params);
      
      // Ensure we have valid courses and convert dates
      const validCourses = response.courses
        .filter((course): course is NonNullable<typeof course> => course !== null)
        .map(course => ({
          ...course,
          createdAt: new Date(course.createdAt),
          updatedAt: new Date(course.updatedAt),
          ranking: course.ranking ? {
            ...course.ranking,
            createdAt: new Date(course.ranking.createdAt),
            updatedAt: new Date(course.ranking.updatedAt)
          } : undefined
        }));

      setCourses(validCourses);
      setTotalPages(response.totalPages);
      setTotalCourses(response.totalCourses);
      
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleForkCourse = async (e: React.MouseEvent, course: CourseWithRanking) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      alert('Please connect your wallet to fork this course');
      return;
    }

    try {
      setForkingCourseId(course._id);
      const newCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await forkCourse({
        originalCourseId: course._id,
        newCourseId,
        creator_id: currentUserId
      });

      if (result.success && result.course) {
        router.push(`/my-courses/${result.course._id}`);
      } else {
        alert(result.message || 'Failed to fork course');
      }
    } catch (error: any) {
      console.error('Failed to fork course:', error);
      alert(error.message || 'Failed to fork course');
    } finally {
      setForkingCourseId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-white/60">...</span>}
          </>
        )}
        
        {pageNumbers.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className={
              page === currentPage
                ? "bg-blue-600 hover:bg-blue-700"
                : "border-white/20 text-white hover:bg-white/10"
            }
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-white/60">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black pt-20">
      <Navbar/>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header and Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Explore Courses</h1>
              <p className="text-white/60">
                Discover and learn from our community&apos;s best courses
                {totalCourses > 0 && (
                  <span className="ml-2">({totalCourses} course{totalCourses !== 1 ? 's' : ''})</span>
                )}
              </p>
            </div>
            <div className="relative w-full md:w-96">
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/50 text-white border-white/20 pl-10"
              />
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              {loading && (
                <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
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

            <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <TabsList className="bg-black/50 border border-white/20">
                <TabsTrigger value="createdAt" className="data-[state=active]:bg-white/10">
                  Newest
                </TabsTrigger>
                <TabsTrigger value="popular" className="data-[state=active]:bg-white/10">
                  Popular
                </TabsTrigger>
                <TabsTrigger value="eloScore" className="data-[state=active]:bg-white/10">
                  Top Rated
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-white/60">
                <FaSpinner className="w-5 h-5 animate-spin" />
                <span>Loading courses...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button 
                onClick={fetchCourses}
                className="bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    onClick={() => handleCourseClick(course._id)}
                    className="group relative rounded-lg border border-white/10 hover:border-white/20 transition-all overflow-hidden cursor-pointer hover:scale-105"
                  >
                    {/* Course Background Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={course.background || '/default-course-bg.jpg'}
                        alt={course.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                      <Badge 
                        className={`${getDifficultyColor(course.difficulty)} absolute top-4 right-4`}
                      >
                        {course.difficulty}
                      </Badge>
                      {currentUserId && currentUserId !== course.creator_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-4 left-4 bg-black/50 border-white/20 text-white hover:bg-white/10"
                          onClick={(e) => handleForkCourse(e, course)}
                          disabled={forkingCourseId === course._id}
                        >
                          {forkingCourseId === course._id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                              Forking...
                            </>
                          ) : (
                            <>
                              <FaCodeBranch className="mr-2" />
                              Fork
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Course Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{course.name}</h3>
                      <p className="text-white/60 mb-4 line-clamp-2 text-sm">{course.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {course.categories.slice(0, 2).map((category) => (
                          <Badge key={category} className={`${getCategoryColor(category)} text-xs`}>
                            {category}
                          </Badge>
                        ))}
                        {course.categories.length > 2 && (
                          <Badge className="bg-white/10 text-white/60 text-xs">
                            +{course.categories.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Ranking Information */}
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <FaThumbsUp className="text-green-500 w-3 h-3" />
                              <span className="text-white text-sm">{course.ranking?.upvotes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaThumbsDown className="text-red-500 w-3 h-3" />
                              <span className="text-white text-sm">{course.ranking?.downvotes || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <TbTrophy className={`${getEloScoreColor(course.ranking?.eloScore || 0)} w-4 h-4`} />
                            <span className={`font-semibold text-sm ${getEloScoreColor(course.ranking?.eloScore || 0)}`}>
                              {course.ranking?.eloScore || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-white/40 text-xs">
                          {new Date(course.createdAt).toLocaleDateString()}
                        </span>
                        {!course.isOriginal && (
                          <Badge variant="outline" className="text-white/60 border-white/20 text-xs">
                            Forked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {courses.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-white/40 text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
                  <p className="text-white/60 mb-6">
                    {searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                      ? "Try adjusting your filters or search terms"
                      : "Be the first to create a course!"}
                  </p>
                  {(searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedDifficulty('all');
                      }}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}