import { Suspense } from 'react';
import { CourseWithRanking } from '@/lib/types';
import { getCourses } from '@/lib/actions/course.actions';
import CourseList from './components/CourseList';
import { Metadata } from 'next';
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: 'Community - OnlyNerds',
  description: 'Discover and vote on the best tech courses in our community.',
};

export const revalidate = 0;

export default async function CommunityPage() {
  const coursesData = await getCourses({ page: 1, limit: 20, sortBy: 'eloScore' });
  
  // Map the courses to ensure they match the CourseWithRanking type
  const validCourses = coursesData.courses
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
  
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8 mt-[50px]">
          <Suspense fallback={<div>Loading courses...</div>}>
            <CourseList initialCourses={validCourses} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
