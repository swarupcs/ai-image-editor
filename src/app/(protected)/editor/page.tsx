import EditorWorkspace from '@/components/editor/workspace';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Editor | ImgStudio',
  description: 'AI-powered image editor.',
};

export default async function EditorPage() {
  const session = await auth();
  if (!session) {
    redirect('/signin');
  }

  return <EditorWorkspace />;
}