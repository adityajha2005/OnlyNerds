'use client';

import { useState } from 'react';
import { User, CourseWithRanking, Category, Difficulty } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaGithub, FaXTwitter, FaLinkedin, FaThumbsUp, FaThumbsDown } from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import Image from 'next/image';
import { Navbar } from '@/components/ui/Navbar';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<Partial<User>>({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer passionate about building great products.',
    avatar: 'https://github.com/shadcn.png',
    socials: {
      github: 'https://github.com/johndoe',
      x: 'https://x.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe'
    }
  });

  // Mock courses data with ranking - replace with actual API call
  const [courses] = useState<CourseWithRanking[]>([
    {
      _id: '1',
      name: 'Introduction to Web3',
      description: 'Learn the basics of Web3 development',
      creator_id: user._id || '',
      isPublic: true,
      categories: ['Web3'],
      difficulty: 'Beginner',
      isOriginal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ranking: {
        _id: '1',
        creator_id: user._id || '',
        upvotes: 150,
        downvotes: 10,
        eloScore: 1800,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      _id: '2',
      name: 'Advanced AI/ML Concepts',
      description: 'Deep dive into AI and Machine Learning',
      creator_id: user._id || '',
      isPublic: true,
      categories: ['AI/ML'],
      difficulty: 'Advanced',
      isOriginal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ranking: {
        _id: '2',
        creator_id: user._id || '',
        upvotes: 280,
        downvotes: 20,
        eloScore: 2100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  ]);

  // Sort courses by eloScore
  const sortedCourses = [...courses].sort((a, b) => 
    (b.ranking?.eloScore || 0) - (a.ranking?.eloScore || 0)
  );

  const handleSave = async () => {
    // TODO: Implement save functionality
    setIsEditing(false);
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

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8 px-4">
        <Navbar />
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="mt-[60px] border-2 border-white/20 shadow-lg bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white mt-4">Profile</CardTitle>
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
                        <label className="text-sm font-medium text-white">Name</label>
                        <Input
                          value={user.name}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          className="mt-1 bg-black/50 text-white border-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white">Email</label>
                        <Input
                          type="email"
                          value={user.email}
                          onChange={(e) => setUser({ ...user, email: e.target.value })}
                          className="mt-1 bg-black/50 text-white border-white/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white">Bio</label>
                        <Textarea
                          value={user.bio}
                          onChange={(e) => setUser({ ...user, bio: e.target.value })}
                          className="mt-1 bg-black/50 text-white border-white/20"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-white">Avatar URL</label>
                        <Input
                          value={user.avatar}
                          onChange={(e) => setUser({ ...user, avatar: e.target.value })}
                          className="mt-1 bg-black/50 text-white border-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Social Links</label>
                        <div className="space-y-2">
                          <Input
                            value={user.socials?.github}
                            onChange={(e) => setUser({
                              ...user,
                              socials: { ...user.socials, github: e.target.value }
                            })}
                            placeholder="GitHub URL"
                            className="mt-1 bg-black/50 text-white border-white/20"
                          />
                          <Input
                            value={user.socials?.x}
                            onChange={(e) => setUser({
                              ...user,
                              socials: { ...user.socials, x: e.target.value }
                            })}
                            placeholder="X/Twitter URL"
                            className="mt-1 bg-black/50 text-white border-white/20"
                          />
                          <Input
                            value={user.socials?.linkedin}
                            onChange={(e) => setUser({
                              ...user,
                              socials: { ...user.socials, linkedin: e.target.value }
                            })}
                            placeholder="LinkedIn URL"
                            className="mt-1 bg-black/50 text-white border-white/20"
                          />
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
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-white text-black hover:bg-white/90"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          className="bg-white text-black hover:bg-white/90"
                        >
                          Save Changes
                        </Button>
                      </>
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

          <Card className="border-2 border-white/20 shadow-lg bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-3xl font-bold text-white">My Courses</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Sort by:</span>
                <Badge variant="outline" className="text-white border-white/20">
                  Ranking
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedCourses.map((course) => (
                  <div
                    key={course._id}
                    className="p-6 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{course.name}</h3>
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                    </div>
                    <p className="text-white/60 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.categories.map((category) => (
                        <Badge key={category} className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Ranking Information */}
                    <div className="border-t border-white/10 pt-4 mt-4">
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
