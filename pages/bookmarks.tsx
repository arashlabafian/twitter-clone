import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { orderBy, query } from 'firebase/firestore';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { useCollection } from '@lib/hooks/useCollection';
import { useArrayDocument } from '@lib/hooks/useArrayDocument';
import { clearAllBookmarks } from '@lib/firebase/utils';
import {
  tweetsCollection,
  userBookmarksCollection
} from '@lib/firebase/collections';
import {
  HomeLayout,
  MainLayout,
  ProtectedLayout
} from '@components/layout/common-layout';
import { SEO } from '@components/common/seo';
import { MainHeader } from '@components/home/main-header';
import { MainContainer } from '@components/home/main-container';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { Tweet } from '@components/tweet/tweet';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Button } from '@components/ui/button';
import { ToolTip } from '@components/ui/tooltip';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import type { ReactElement, ReactNode } from 'react';

export default function Bookmarks(): JSX.Element {
  const { user } = useAuth();

  const { open, openModal, closeModal } = useModal();

  const userId = user?.id as string;

  const { data: bookmarksRef, loading: bookmarksRefLoading } = useCollection(
    query(userBookmarksCollection(userId), orderBy('createdAt', 'desc')),
    { allowNull: true }
  );

  const tweetIds = useMemo(
    () => bookmarksRef?.map(({ id }) => id) ?? [],
    [bookmarksRef]
  );

  const { data: tweetData, loading: tweetLoading } = useArrayDocument(
    tweetIds,
    tweetsCollection,
    { includeUser: true }
  );

  const handleClear = async (): Promise<void> => {
    await clearAllBookmarks(userId);
    closeModal();
    toast.success('Successfully cleared all bookmarks');
  };

  return (
    <MainContainer>
      <SEO title='Bookmarks / Twitter' />
      <Modal
        modalClassName='flex flex-col gap-6 max-w-xs bg-black w-full p-8 rounded-2xl'
        open={open}
        closeModal={closeModal}
      >
        <ActionModal
          title='Clear all Bookmarks?'
          description='This can’t be undone and you’ll remove all Tweets you’ve added to your Bookmarks.'
          mainBtnLabel='Clear'
          action={handleClear}
          closeModal={closeModal}
        />
      </Modal>
      <MainHeader className='flex items-center justify-between'>
        <div className='-mb-1 flex flex-col'>
          <h2 className='-mt-1 text-xl font-bold'>Bookmarks</h2>
          <p className='text-xs text-secondary'>@{user?.username}</p>
        </div>
        <Button
          className='group relative p-2 hover:bg-primary/10 active:bg-primary/20'
          onClick={openModal}
        >
          <HeroIcon className='h-5 w-5' iconName='ArchiveBoxXMarkIcon' />
          <ToolTip tip='Clear bookmarks' />
        </Button>
      </MainHeader>
      <section>
        {bookmarksRefLoading || tweetLoading ? (
          <Loading className='mt-5' />
        ) : !bookmarksRef ? (
          <StatsEmpty
            title='Save Tweets for later'
            description='Don’t let the good ones fly away! Bookmark Tweets to easily find them again in the future.'
            imageData={{ src: '/assets/no-bookmarks.png', alt: 'No bookmarks' }}
          />
        ) : (
          <AnimatePresence mode='popLayout'>
            {tweetData?.map((tweet) => (
              <Tweet {...tweet} key={tweet.id} />
            ))}
          </AnimatePresence>
        )}
      </section>
    </MainContainer>
  );
}

Bookmarks.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
