'use client'

import React, { useEffect, useRef, useState } from 'react';

import { Code } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';

import Button from '@/components/button';

const IntroductionModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          closeModal();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-white/50 dark:bg-black/50 z-50 flex lg:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={modalRef}
            className="bg-gray-1 rounded-xl better-shadow max-w-2xl w-full border border-gray-3 overflow-auto scrollbar-hide relative"
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50, transition: { delay: 0.2 } }}
            transition={{ duration: 0.2 }}
          >
            <div className='w-full border-gray-3 border-b'>
              <div className='flex flex-row items-center gap-2 mx-auto p-2'>
                <div
                  className="flex flex-col w-full relative overflow-hidden bg-hero rounded-lg"
                  style={{
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="w-full">
                    <div className="flex flex-row items-center w-full max-w-7xl mx-auto pt-8 pb-4 justify-between">
                      <div className="flex flex-row items-center w-max mx-auto gap-4 dark">
                        Rōmy
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto py-4 pb-40 px-4 gap-1">
                    <h1 className="text-2xl font-medium text-gray-2 relative z-10 dark:text-gray-12">Find Your Next Major Donors</h1>
                    <p className="text-base text-gray-4 relative z-10 dark:text-gray-11 max-w-xs text-center">AI-powered donor discovery platform helping nonprofits unlock the $600B charitable market.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='w-full border-gray-3'>
              <div className='flex flex-col divide-y divide-gray-3 lg:divide-y-0 lg:grid grid-cols-1 md:grid-cols-3 border-gray-3 dark:border-gray-21 mx-auto'>
                <div className="flex flex-col gap-1 border-gray-3 dark:border-gray-2 lg:border-r p-8">
                  <div className="flex flex-col gap-1 mb-1">
                    <h3 className="text-base font-small text-gray-12 text-pretty">1.4M Nonprofits</h3>
                  </div>
                  <p className="text-xs text-gray-10 text-pretty">
                    Built specifically for the nonprofit sector to find prospective donors.
                  </p>
                </div>
                <div className="flex flex-col gap-1 border-gray-3 dark:border-gray-2 lg:border-r p-8">
                  <div className="flex flex-col gap-1 mb-1">
                    <h3 className="text-base font-small text-gray-12 text-pretty">$600B Market</h3>
                  </div>
                  <p className="text-xs text-gray-10 text-pretty">
                    Disrupting charitable giving by connecting NGOs with ideal donors.
                  </p>
                </div>
                <div className="flex flex-col gap-1 border-gray-3 p-8">
                  <div className="flex flex-col gap-1 mb-1">
                    <h3 className="text-base font-small text-gray-12 text-pretty">AI-Powered Insights</h3>
                  </div>
                  <p className="text-xs text-gray-10 text-pretty">
                    Smart matching to identify major donor prospects for your mission.
                  </p>
                </div>
                <div className="flex flex-col gap-1 border-gray-3 dark:border-gray-2 lg:border-t p-10 col-span-3 items-center justify-center">
                  <div className="flex flex-col gap-1 items-center mb-1 mt-2">
                    <h3 className="text-sm font-medium text-gray-12 text-pretty">Built for Nonprofits</h3>
                    <p className="text-xs text-gray-10 max-w-sm text-center">
                      Rōmy empowers nonprofits with cutting-edge AI technology to discover and connect with major donors who align with their mission.
                    </p>
                  </div>
                  <div className='flex flex-row gap-2 mt-2'>
                    <Button size="small" href="/" target="_blank" className="w-max mt-2 bg-gray-3 hover:bg-gray-4 text-gray-12 border border-gray-5" icon={<Code size={14} weight="bold" />}>Learn More</Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroductionModal;