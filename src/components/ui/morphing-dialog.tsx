'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  motion,
  AnimatePresence,
  MotionConfig,
  type Transition,
  type Variant,
} from 'motion/react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';

export type MorphingDialogContextType = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  uniqueId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const MorphingDialogContext =
  React.createContext<MorphingDialogContextType | null>(null);

export function useMorphingDialog() {
  const context = useContext(MorphingDialogContext);
  if (!context) {
    throw new Error(
      'useMorphingDialog must be used within a MorphingDialogProvider'
    );
  }
  return context;
}

export type MorphingDialogProviderProps = {
  children: React.ReactNode;
  transition?: Transition;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function MorphingDialogProvider({
  children,
  transition,
  open: controlledOpen,
  onOpenChange,
}: MorphingDialogProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setIsOpen = useCallback(
    (action: React.SetStateAction<boolean>) => {
      const next = typeof action === 'function' ? action(isOpen) : action;
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, isOpen, onOpenChange]
  );

  const uniqueId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      uniqueId,
      triggerRef,
    }),
    [isOpen, setIsOpen, uniqueId]
  );

  return (
    <MorphingDialogContext.Provider value={contextValue}>
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </MorphingDialogContext.Provider>
  );
}

export type MorphingDialogProps = {
  children: React.ReactNode;
  transition?: Transition;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function MorphingDialog({ children, transition, open, onOpenChange }: MorphingDialogProps) {
  return (
    <MorphingDialogProvider transition={transition} open={open} onOpenChange={onOpenChange}>
      {children}
    </MorphingDialogProvider>
  );
}

export type MorphingDialogTriggerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function MorphingDialogTrigger({
  children,
  className,
  style,
}: MorphingDialogTriggerProps) {
  const { setIsOpen, isOpen, uniqueId, triggerRef } = useMorphingDialog();

  const handleClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  return (
    <motion.button
      ref={triggerRef}
      layoutId={`dialog-${uniqueId}`}
      className={cn('relative cursor-pointer', className)}
      onClick={handleClick}
      style={style}
      aria-haspopup='dialog'
      aria-expanded={isOpen}
      aria-controls={`motion-ui-morphing-dialog-content-${uniqueId}`}
      aria-label={`Open dialog ${uniqueId}`}
    >
      {children}
    </motion.button>
  );
}

export type MorphingDialogContentProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function MorphingDialogContent({
  children,
  className,
  style,
}: MorphingDialogContentProps) {
  const { setIsOpen, isOpen, uniqueId } = useMorphingDialog();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  useClickOutside(containerRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  return (
    <motion.div
      ref={containerRef}
      layoutId={`dialog-${uniqueId}`}
      className={cn('overflow-hidden relative', className)}
      style={style}
      role='dialog'
      aria-modal='true'
      aria-labelledby={`motion-ui-morphing-dialog-title-${uniqueId}`}
    >
      {children}
    </motion.div>
  );
}

export type MorphingDialogContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function MorphingDialogContainer({ children, className }: MorphingDialogContainerProps) {
  const { isOpen, uniqueId } = useMorphingDialog();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence initial={false} mode='sync'>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key={`backdrop-${uniqueId}`}
            className='fixed inset-0 h-full w-full bg-black/75 backdrop-blur-md'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className={cn('relative z-10 w-full flex items-center justify-center', className)}>
            {children}
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export type MorphingDialogCloseProps = {
  children?: React.ReactNode;
  className?: string;
};

export function MorphingDialogClose({
  children,
  className,
}: MorphingDialogCloseProps) {
  const { setIsOpen, uniqueId } = useMorphingDialog();

  return (
    <motion.button
      onClick={() => setIsOpen(false)}
      type='button'
      aria-label='Kapat'
      key={`dialog-close-${uniqueId}`}
      className={cn('rounded-full p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer', className)}
    >
      {children || <XIcon className="h-5 w-5" />}
    </motion.button>
  );
}
