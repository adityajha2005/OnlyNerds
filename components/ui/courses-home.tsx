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
import { FaThumbsUp, FaThumbsDown, FaMagnifyingGlass } from 'react-icons/fa6';
import { TbTrophy } from 'react-icons/tb';
import Image from 'next/image';

type SortOption = 'popular' | 'newest' | 'ranking';

export default function CoursesPage() {
  // Mock courses data - replace with API call
  const [courses] = useState<CourseWithRanking[]>([
    {
      _id: '1',
      name: 'Introduction to Web3',
      description: 'Learn the basics of Web3 development and blockchain technology. Build your first smart contract and decentralized application.',
      background: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop',
      creator_id: '1',
      isPublic: true,
      categories: ['Web3'],
      difficulty: 'Beginner',
      isOriginal: true,
      createdAt: new Date('2024-03-20'),
      updatedAt: new Date(),
      ranking: {
        _id: '1',
        creator_id: '1',
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
      description: 'Deep dive into AI and Machine Learning. Learn about neural networks, deep learning, and practical applications.',
      background: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop',
      creator_id: '2',
      isPublic: true,
      categories: ['AI/ML'],
      difficulty: 'Advanced',
      isOriginal: true,
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date(),
      ranking: {
        _id: '2',
        creator_id: '2',
        upvotes: 280,
        downvotes: 20,
        eloScore: 2100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      _id: '3',
      name: 'Full Stack Development with Next.js',
      description: 'Master full stack development using Next.js, React, and modern backend technologies.',
      background: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=2832&auto=format&fit=crop',
      creator_id: '3',
      isPublic: true,
      categories: ['Full Stack Development'],
      difficulty: 'Intermediate',
      isOriginal: true,
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date(),
      ranking: {
        _id: '3',
        creator_id: '3',
        upvotes: 200,
        downvotes: 15,
        eloScore: 1900,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const categories: Category[] = ['Web3', 'AI/ML', 'Full Stack Development', 'Marketing', 'Designs'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.categories.includes(selectedCategory as Category);
      const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
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
        <div className="max-w-7xl mx-auto space-y-8 mt-[50px]">
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCourses.map((course) => (
              <div
                key={course._id}
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

          {filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">No courses found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
