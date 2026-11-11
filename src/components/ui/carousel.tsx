'use client';

import {
  Children,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion, type Transition, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CarouselContextType = {
  index: number;
  setIndex: (newIndex: number) => void;
  itemsCount: number;
  setItemsCount: (newItemsCount: number) => void;
  disableDrag: boolean;
};

const CarouselContext = createContext<CarouselContextType | undefined>(
  undefined
);

export function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within an CarouselProvider');
  }
  return context;
}

export type CarouselProviderProps = {
  children: ReactNode;
  initialIndex?: number;
  index?: number;
  onIndexChange?: (newIndex: number) => void;
  disableDrag?: boolean;
};

export function CarouselProvider({
  children,
  initialIndex = 0,
  index: controlledIndex,
  onIndexChange,
  disableDrag = false,
}: CarouselProviderProps) {
  const [internalIndex, setInternalIndex] = useState<number>(initialIndex);
  const [itemsCount, setItemsCount] = useState<number>(0);

  const isControlled = controlledIndex !== undefined;
  const index = isControlled ? controlledIndex : internalIndex;

  const handleSetIndex = (newIndex: number) => {
    if (!isControlled) {
      setInternalIndex(newIndex);
    }
    onIndexChange?.(newIndex);
  };

  useEffect(() => {
    if (!isControlled) {
      setInternalIndex(initialIndex);
    }
  }, [initialIndex, isControlled]);

  return (
    <CarouselContext.Provider
      value={{
        index,
        setIndex: handleSetIndex,
        itemsCount,
        setItemsCount,
        disableDrag,
      }}
    >
      {children}
    </CarouselContext.Provider>
  );
}

export type CarouselProps = {
  children: ReactNode;
  className?: string;
  initialIndex?: number;
  index?: number;
  onIndexChange?: (newIndex: number) => void;
  disableDrag?: boolean;
};

export function Carousel({
  children,
  className,
  initialIndex = 0,
  index: externalIndex,
  onIndexChange,
  disableDrag = false,
}: CarouselProps) {
  return (
    <CarouselProvider
      initialIndex={initialIndex}
      index={externalIndex}
      onIndexChange={onIndexChange}
      disableDrag={disableDrag}
    >
      <div className={cn('group/hover relative w-full', className)}>
        <div className='overflow-hidden rounded-inherit'>{children}</div>
      </div>
    </CarouselProvider>
  );
}

export type CarouselNavigationProps = {
  className?: string;
  classNameButton?: string;
  alwaysShow?: boolean;
};

export function CarouselNavigation({
  className,
  classNameButton,
  alwaysShow,
}: CarouselNavigationProps) {
  const { index, setIndex, itemsCount } = useCarousel();

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0 top-1/2 flex w-full -translate-y-1/2 justify-between px-3 z-20',
        className
      )}
    >
      <button
        type='button'
        aria-label='Önceki senaryo'
        className={cn(
          'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-container/90 border border-outline-variant/60 text-on-surface shadow-m3-2 backdrop-blur-md transition-all duration-300 ease-m3e-spring-bouncy hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-30 disabled:pointer-events-none',
          alwaysShow
            ? 'opacity-100'
            : 'opacity-0 group-hover/hover:opacity-100',
          classNameButton
        )}
        disabled={index === 0}
        onClick={() => {
          if (index > 0) {
            setIndex(index - 1);
          }
        }}
      >
        <ChevronLeft className='h-4 w-4' />
      </button>
      <button
        type='button'
        className={cn(
          'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-container/90 border border-outline-variant/60 text-on-surface shadow-m3-2 backdrop-blur-md transition-all duration-300 ease-m3e-spring-bouncy hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-30 disabled:pointer-events-none',
          alwaysShow
            ? 'opacity-100'
            : 'opacity-0 group-hover/hover:opacity-100',
          classNameButton
        )}
        aria-label='Sonraki senaryo'
        disabled={index + 1 === itemsCount}
        onClick={() => {
          if (index < itemsCount - 1) {
            setIndex(index + 1);
          }
        }}
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>
  );
}

export type CarouselIndicatorProps = {
  className?: string;
  classNameButton?: string;
};

export function CarouselIndicator({
  className,
  classNameButton,
}: CarouselIndicatorProps) {
  const { index, itemsCount, setIndex } = useCarousel();

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center py-2',
        className
      )}
    >
      <div className='flex space-x-2'>
        {Array.from({ length: itemsCount }, (_, i) => (
          <button
            key={i}
            type='button'
            aria-label={`Senaryo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300 ease-m3e-spring-smooth cursor-pointer',
              index === i
                ? 'w-6 bg-primary shadow-xs'
                : 'w-2 bg-on-surface-variant/30 hover:bg-on-surface-variant/60',
              classNameButton
            )}
          />
        ))}
      </div>
    </div>
  );
}

export type CarouselContentProps = {
  children: ReactNode;
  className?: string;
  transition?: Transition;
};

export function CarouselContent({
  children,
  className,
  transition,
}: CarouselContentProps) {
  const { index, setIndex, setItemsCount, disableDrag } = useCarousel();
  const [visibleItemsCount, setVisibleItemsCount] = useState(1);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsLength = Children.count(children);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const options = {
      root: containerRef.current,
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleCount = entries.filter(
        (entry) => entry.isIntersecting
      ).length;
      setVisibleItemsCount(visibleCount > 0 ? visibleCount : 1);
    }, options);

    const childNodes = containerRef.current.children;
    Array.from(childNodes).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [children, setItemsCount]);

  useEffect(() => {
    if (!itemsLength) {
      return;
    }

    setItemsCount(itemsLength);
  }, [itemsLength, setItemsCount]);

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= -30 && index < itemsLength - 1) {
      setIndex(index + 1);
    } else if (x >= 30 && index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <motion.div
      drag={disableDrag ? false : 'x'}
      dragConstraints={
        disableDrag
          ? undefined
          : {
              left: 0,
              right: 0,
            }
      }
      dragMomentum={disableDrag ? undefined : false}
      style={{
        x: disableDrag ? undefined : dragX,
      }}
      animate={{
        translateX: `-${index * (100 / visibleItemsCount)}%`,
      }}
      onDragEnd={disableDrag ? undefined : onDragEnd}
      transition={
        transition || {
          damping: 24,
          stiffness: 140,
          type: 'spring',
        }
      }
      className={cn(
        'flex items-stretch w-full',
        !disableDrag && 'cursor-grab active:cursor-grabbing',
        className
      )}
      ref={containerRef}
    >
      {children}
    </motion.div>
  );
}

export type CarouselItemProps = {
  children: ReactNode;
  className?: string;
};

export function CarouselItem({ children, className }: CarouselItemProps) {
  return (
    <motion.div
      className={cn(
        'w-full min-w-full shrink-0 grow-0',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
