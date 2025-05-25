'use client';

import { useState, useEffect } from 'react';
import { User, CourseWithRanking, Category, Difficulty } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaGithub, FaXTwitter, FaLinkedin, FaThumbsUp, FaThumbsDown } from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import Image from 'next/image';
import { useMetaMaskStore } from '@/lib/stores/metamask-store';
import { updateUser, getUser, createUser, checkUserProfileComplete } from '@/lib/actions/user.actions';
import { getCourseByCreatorId, getUserCourseStats, getUserTopCourses, getUserRecentActivity } from '@/lib/actions/course.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Navbar } from '@/components/ui/Navbar';

export default function ProfilePage() {
  const router = useRouter();
  const  [walletAddress,setwalletAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  // Initialize user state with default values to ensure controlled inputs
  const [user, setUser] = useState<Partial<User>>({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    socials: {
      github: '',
      x: '',
      linkedin: ''
    }
  });
  const [courses, setCourses] = useState<CourseWithRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [courseStats, setCourseStats] = useState<any>(null);
  const [topCourses, setTopCourses] = useState<CourseWithRanking[]>([]);
  const [recentActivity, setRecentActivity] = useState<CourseWithRanking[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'recent'>('all');

  // Initialize MetaMask connection
  useEffect(() => {
    const wallet = localStorage.getItem("walletAddress")
    if(wallet){
      setwalletAddress(wallet);
    }
  }, [setwalletAddress]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch existing user data
        const userData = await getUser(walletAddress);
        if (userData) {
          // Ensure all fields have default values
          setUser({
            name: userData.name || '',
            email: userData.email || '',
            bio: userData.bio || '',
            avatar: userData.avatar || '',
            socials: {
              github: userData.socials?.github || '',
              x: userData.socials?.x || '',
              linkedin: userData.socials?.linkedin || ''
            }
          });
          setIsNewUser(false);
        } else {
          // Keep default initialized values for new user
          setIsNewUser(true);
        }

        // Check if profile is complete
        const isComplete = await checkUserProfileComplete(walletAddress);
        if (!isComplete) {
          setIsEditing(true);
        }

        // Fetch course-related data
        const [userCourses, stats, topPerforming, recent] = await Promise.all([
          getCourseByCreatorId(walletAddress),
          getUserCourseStats(walletAddress),
          getUserTopCourses(walletAddress, 5),
          getUserRecentActivity(walletAddress, 10)
        ]);

        // Convert dates for each course
        const convertDates = (course: any): CourseWithRanking => ({
          ...course,
          createdAt: new Date(course.createdAt),
          updatedAt: new Date(course.updatedAt),
          ranking: course.ranking ? {
            ...course.ranking,
            createdAt: new Date(course.ranking.createdAt),
            updatedAt: new Date(course.ranking.updatedAt)
          } : undefined
        });

        // Process and set the courses
        setCourses((userCourses || []).map(convertDates));
        setCourseStats(stats);
        setTopCourses((topPerforming || []).map(convertDates));
        setRecentActivity((recent || []).map(convertDates));
      } catch (error) {
        // If user doesn't exist, create a new one
        if ((error as Error).message.includes('User not found')) {
          const newUser = await createUser(walletAddress);
          if (newUser) {
            setUser({
              name: newUser.name || '',
              email: newUser.email || '',
              bio: newUser.bio || '',
              avatar: newUser.avatar || '',
              socials: {
                github: newUser.socials?.github || '',
                x: newUser.socials?.x || '',
                linkedin: newUser.socials?.linkedin || ''
              }
            });
            setIsNewUser(true);
            setIsEditing(true); // Automatically open edit form for new users
          } else {
            // Keep default initialized values
            toast.error('Failed to create user profile');
          }
        } else {
          console.error('Error fetching data:', error);
          toast.error('Failed to load profile data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (walletAddress) {
      fetchData();
    }
  }, [walletAddress]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!user.name || user.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!user.email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(user.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!user.bio || user.bio.length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    }
    if (user.avatar && !/^(https?:\/\/)?.+\..+/.test(user.avatar)) {
      newErrors.avatar = 'Please enter a valid URL';
    }
    if (user.socials?.github && user.socials.github && !user.socials.github.startsWith('https://github.com/')) {
      newErrors.github = 'Please enter a valid GitHub URL';
    }
    if (user.socials?.x && user.socials.x && !user.socials.x.startsWith('https://x.com/')) {
      newErrors.x = 'Please enter a valid X/Twitter URL';
    }
    if (user.socials?.linkedin && user.socials.linkedin && !(user.socials.linkedin.startsWith('https://linkedin.com/') || user.socials.linkedin.startsWith('https://www.linkedin.com/'))) {
      newErrors.linkedin = 'Please enter a valid LinkedIn URL starting with https://linkedin.com/ or https://www.linkedin.com/';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!walletAddress) return;

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUser({
        userId: walletAddress,
        name: user.name || '',
        bio: user.bio,
        avatar: user.avatar,
        email: user.email,
        socials: user.socials
      });

      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setIsNewUser(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Sort courses by eloScore
  const sortedCourses = [...courses].sort((a, b) => 
    (b.ranking?.eloScore || 0) - (a.ranking?.eloScore || 0)
  );

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

  const isProfileIncomplete = !user.name || !user.email || !user.bio;

  const renderCoursesSection = () => (
    <Card className="border-2 border-white/20 shadow-lg bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <CardHeader className="space-y-4">
        <div className="flex flex-row justify-between items-center">
          <CardTitle className="text-3xl font-bold text-white">My Courses</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
                className="text-sm"
              >
                All Courses
              </Button>
              <Button
                variant={activeTab === 'top' ? 'default' : 'outline'}
                onClick={() => setActiveTab('top')}
                className="text-sm"
              >
                Top Performing
              </Button>
              <Button
                variant={activeTab === 'recent' ? 'default' : 'outline'}
                onClick={() => setActiveTab('recent')}
                className="text-sm"
              >
                Recent Activity
              </Button>
            </div>
          </div>
        </div>

        {courseStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white/60 text-sm">Total Courses</h4>
              <p className="text-2xl font-bold text-white">{courseStats.totalCourses}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white/60 text-sm">Total Upvotes</h4>
              <p className="text-2xl font-bold text-green-500">{courseStats.totalUpvotes}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white/60 text-sm">Average Score</h4>
              <p className="text-2xl font-bold text-blue-500">{Math.round(courseStats.averageEloScore)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white/60 text-sm">Original/Forked</h4>
              <p className="text-2xl font-bold text-white">
                {courseStats.originalCourses}/{courseStats.forkedCourses}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(activeTab === 'all' ? courses :
            activeTab === 'top' ? topCourses :
            recentActivity
          ).map((course) => (
            <div
              key={course._id}
              className="group relative rounded-lg border border-white/10 hover:border-white/20 transition-all overflow-hidden"
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
                <Badge 
                  className={`${getDifficultyColor(course.difficulty)} absolute top-4 right-4`}
                >
                  {course.difficulty}
                </Badge>
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
                    Created {new Date(course.createdAt).toLocaleDateString()}
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

        {(activeTab === 'all' ? courses :
          activeTab === 'top' ? topCourses :
          recentActivity
        ).length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/60">No courses found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Please connect your MetaMask wallet to view your profile</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
        <Navbar/>
      <div className="container mx-auto py-8 px-4">
]        <div className="max-w-4xl mx-auto space-y-8">
          {isProfileIncomplete && !isEditing && (
            <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please complete your profile by adding your name, email, and bio to start creating courses.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mt-[60px] border-2 border-white/20 shadow-lg bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white mt-4">
                {isNewUser ? 'Welcome to OnlyNerds!' : 'Profile'}
              </CardTitle>
              {isNewUser && (
                <p className="text-white/60 mt-2">
                  Please complete your profile to start creating and sharing courses.
                  Add your details below to get started.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10">
                    <Image
                      src={user.avatar || 'https://github.com/shadcn.png'}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <div className="flex-grow space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white">Name *</label>
                        <Input
                          value={user.name || ''}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          className={`mt-1 bg-black/50 text-white border-white/20 ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white">Email *</label>
                        <Input
                          type="email"
                          value={user.email || ''}
                          onChange={(e) => setUser({ ...user, email: e.target.value })}
                          className={`mt-1 bg-black/50 text-white border-white/20 ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white">Bio *</label>
                        <Textarea
                          value={user.bio || ''}
                          onChange={(e) => setUser({ ...user, bio: e.target.value })}
                          className={`mt-1 bg-black/50 text-white border-white/20 ${errors.bio ? 'border-red-500' : ''}`}
                          rows={4}
                        />
                        {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white">Avatar URL</label>
                        <Input
                          value={user.avatar || ''}
                          onChange={(e) => setUser({ ...user, avatar: e.target.value })}
                          className={`mt-1 bg-black/50 text-white border-white/20 ${errors.avatar ? 'border-red-500' : ''}`}
                        />
                        {errors.avatar && <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Social Links</label>
                        <div className="space-y-2">
                          <Input
                            value={user.socials?.github || ''}
                            onChange={(e) => setUser({
                              ...user,
                              socials: { ...user.socials, github: e.target.value }
                            })}
                            placeholder="GitHub URL (https://github.com/...)"
                            className={`mt-1 bg-black/50 text-white border-white/20 ${errors.github ? 'border-red-500' : ''}`}
                          />
                          {errors.github && <p className="text-red-500 text-sm mt-1">{errors.github}</p>}
                          <Input
                            value={user.socials?.x || ''}
                            onChange={(e) => setUser({
                              ...user,
                              socials: { ...user.socials, x: e.target.value }
                            })}
                            placeholder="X/Twitter URL (https://x.com/...)"
                            className={`mt-1 bg-black/50 text-white border-white/20 ${errors.x ? 'border-red-500' : ''}`}
                          />
                          {errors.x && <p className="text-red-500 text-sm mt-1">{errors.x}</p>}
                          <Input
                            value={user.socials?.linkedin || ''}
                            onChange={(e) => setUser({
                              ...user,
                              socials: { ...user.socials, linkedin: e.target.value }
                            })}
                            placeholder="LinkedIn URL (https://linkedin.com/...)"
                            className={`mt-1 bg-black/50 text-white border-white/20 ${errors.linkedin ? 'border-red-500' : ''}`}
                          />
                          {errors.linkedin && <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                        <p className="text-white/60">{user.email}</p>
                      </div>
                      <p className="text-white/80">{user.bio}</p>
                      <div className="flex gap-4">
                        {user.socials?.github && (
                          <a
                            href={user.socials.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            <FaGithub size={24} />
                          </a>
                        )}
                        {user.socials?.x && (
                          <a
                            href={user.socials.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            <FaXTwitter size={24} />
                          </a>
                        )}
                        {user.socials?.linkedin && (
                          <a
                            href={user.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            <FaLinkedin size={24} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-4 pt-4">
                    {isEditing ? (
                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setErrors({});
                          }}
                          className="bg-white text-black hover:bg-white/90"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          className="bg-white text-black hover:bg-white/90"
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {renderCoursesSection()}
        </div>
      </div>
    </div>
  );
}