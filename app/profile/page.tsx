'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGithub, FaXTwitter, FaLinkedin } from 'react-icons/fa6';
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

  const handleSave = async () => {
    // TODO: Implement save functionality
    setIsEditing(false);
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
        </div>
      </div>
    </div>
  );
}
