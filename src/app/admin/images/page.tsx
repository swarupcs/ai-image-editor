import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { ImageActions } from './image-actions';

export const metadata = { title: 'Manage Images | Admin Panel' };

export default async function AdminImagesPage() {
  const images = await prisma.generatedImage.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-zinc-100'>Generated Images</h1>
        <p className='text-zinc-400'>View and moderate all images generated on ImgStudio.</p>
      </div>

      {images.length === 0 ? (
        <div className='text-center py-20 bg-zinc-900/50 border border-zinc-800/50 rounded-xl'>
          <p className='text-zinc-500'>No images found in the system.</p>
        </div>
      ) : (
        <div className='columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4'>
          {images.map((img) => (
            <div key={img.id} className='relative group break-inside-avoid rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50'>
              <Image
                src={img.imageData}
                alt={img.prompt || img.title || 'Generated image'}
                width={512}
                height={512}
                className='w-full h-auto object-cover'
                unoptimized
              />
              
              <ImageActions imageId={img.id} />
              
              {/* Details Overlay */}
              <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end'>
                {img.prompt && (
                  <p className='text-xs text-zinc-300 line-clamp-3 mb-2 font-medium leading-relaxed'>{img.prompt}</p>
                )}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0'>
                      {img.user.image ? (
                        <Image src={img.user.image} alt={img.user.name || ''} width={20} height={20} />
                      ) : (
                        <span className='text-[8px] font-bold text-zinc-500'>
                          {(img.user.name?.[0] || img.user.email[0]).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className='text-[10px] text-zinc-400 truncate'>{img.user.email}</span>
                  </div>
                  <span className='text-[9px] text-zinc-500 shrink-0'>{img.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}