import { debounce } from 'lodash-es';
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { DEFAULT_LIMIT, MAX_PAGINATION_LIMIT } from '@shared/dto/common/pagination.dto';

import { isAbortError } from '@web/shared/lib/get-api-error-message';

import type { PaginatedResultInterface } from '@shared/dto/common/paginated-result.dto';
import type { ItemFindInterface } from '@shared/dto/item/item-find.dto';
import type { ItemQueryInterface } from '@shared/dto/item/item-query.dto';

interface UsePagedItemsParamsInterface {
  fetchPage: (params: ItemQueryInterface, signal?: AbortSignal) => Promise<PaginatedResultInterface<ItemFindInterface>>;
  scrollElementId: string;
  onError: (error: unknown, fallback: string) => void;
  errorFallback: string;
}

interface ReloadLoadedOptionsInterface {
  silent?: boolean;
}

interface UsePagedItemsResultInterface {
  items: ItemFindInterface[];
  count: number;
  search: string;
  listKey: string;
  isReplacing: boolean;
  isLoadingMore: boolean;
  setSearch: (value: string) => void;
  loadMore: () => void;
  reloadLoaded: (options?: ReloadLoadedOptionsInterface) => Promise<void>;
  setItems: Dispatch<SetStateAction<ItemFindInterface[]>>;
}

interface RequestGenerationInterface {
  generation: number;
  signal: AbortSignal;
}

interface PageChunkInterface {
  offset: number;
  limit: number;
}

const mergeUnique = (current: ItemFindInterface[], incoming: ItemFindInterface[]) => {
  const seen = new Set(current.map(({ id }) => id));
  const extra = incoming.filter(({ id }) => !seen.has(id));
  return [...current, ...extra];
};

const flattenPages = (pages: PaginatedResultInterface<ItemFindInterface>[]) => {
  const items: ItemFindInterface[] = [];
  const seen = new Set<number>();
  let count = 0;
  pages.forEach(page => {
    count = page.count;
    page.items.forEach(item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    });
  });
  return {
    items,
    count,
  };
};

const rangeChunks = (totalWanted: number): PageChunkInterface[] => {
  const chunks: PageChunkInterface[] = [];
  let remaining = Math.max(DEFAULT_LIMIT, totalWanted);
  let offset = 0;
  while (remaining > 0) {
    const limit = Math.min(MAX_PAGINATION_LIMIT, remaining);
    chunks.push({
      offset,
      limit,
    });
    offset += limit;
    remaining -= limit;
  }
  return chunks;
};

export const usePagedItems = ({
  fetchPage,
  scrollElementId,
  onError,
  errorFallback,
}: UsePagedItemsParamsInterface): UsePagedItemsResultInterface => {
  const [items, setItems] = useState<ItemFindInterface[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isReplacing, setIsReplacing] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightOffsetsRef = useRef(new Set<number>());
  const itemsRef = useRef(items);
  const debouncedSearchRef = useRef(debouncedSearch);
  const onErrorRef = useRef(onError);
  const errorFallbackRef = useRef(errorFallback);

  itemsRef.current = items;
  debouncedSearchRef.current = debouncedSearch;
  onErrorRef.current = onError;
  errorFallbackRef.current = errorFallback;

  const pushSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearch(value);
    }, 400),
    [],
  );

  const beginGeneration = (): RequestGenerationInterface => {
    abortRef.current?.abort();
    generationRef.current += 1;
    inFlightOffsetsRef.current.clear();
    const controller = new AbortController();
    abortRef.current = controller;
    return {
      generation: generationRef.current,
      signal: controller.signal,
    };
  };

  const loadRange = async (totalWanted: number, request: RequestGenerationInterface) => {
    const searchValue = debouncedSearchRef.current;
    const chunks = rangeChunks(totalWanted);
    chunks.forEach(chunk => inFlightOffsetsRef.current.add(chunk.offset));

    try {
      const pages = await Promise.all(chunks.map(chunk => fetchPage({
        search: searchValue,
        offset: chunk.offset,
        limit: chunk.limit,
      }, request.signal)));

      if (request.generation !== generationRef.current) {
        return;
      }

      const next = flattenPages(pages);
      setItems(next.items);
      setCount(next.count);
    } finally {
      chunks.forEach(chunk => inFlightOffsetsRef.current.delete(chunk.offset));
    }
  };

  useEffect(() => {
    return () => {
      pushSearch.cancel();
    };
  }, [pushSearch]);

  useEffect(() => {
    const request = beginGeneration();
    setIsReplacing(true);
    setIsLoadingMore(false);
    setItems([]);
    setCount(0);
    document.getElementById(scrollElementId)?.scrollTo({
      top: 0,
    });

    const run = async () => {
      try {
        await loadRange(DEFAULT_LIMIT, request);
      } catch (error) {
        if (!isAbortError(error)) {
          onErrorRef.current(error, errorFallbackRef.current);
        }
      } finally {
        if (request.generation === generationRef.current) {
          setIsReplacing(false);
        }
      }
    };

    run();

    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedSearch, scrollElementId]);

  const setSearch = (value: string) => {
    setSearchState(value);
    pushSearch(value);
  };

  const loadMore = () => {
    if (isReplacing || isLoadingMore) {
      return;
    }

    const offset = itemsRef.current.length;
    if (offset >= count || inFlightOffsetsRef.current.has(offset)) {
      return;
    }

    const generation = generationRef.current;
    const signal = abortRef.current?.signal;
    inFlightOffsetsRef.current.add(offset);
    setIsLoadingMore(true);

    const run = async () => {
      try {
        const page = await fetchPage({
          search: debouncedSearchRef.current,
          offset,
          limit: DEFAULT_LIMIT,
        }, signal);
        if (generation !== generationRef.current) {
          return;
        }
        setCount(page.count);
        setItems(state => mergeUnique(state, page.items));
      } catch (error) {
        if (!isAbortError(error)) {
          onErrorRef.current(error, errorFallbackRef.current);
        }
      } finally {
        inFlightOffsetsRef.current.delete(offset);
        if (generation === generationRef.current) {
          setIsLoadingMore(false);
        }
      }
    };

    run();
  };

  const reloadLoaded = async (options?: ReloadLoadedOptionsInterface) => {
    const request = beginGeneration();
    const silent = options?.silent === true;
    if (!silent) {
      setIsReplacing(true);
    }
    setIsLoadingMore(false);
    try {
      await loadRange(Math.max(DEFAULT_LIMIT, itemsRef.current.length), request);
    } finally {
      if (request.generation === generationRef.current && !silent) {
        setIsReplacing(false);
      }
    }
  };

  return {
    items,
    count,
    search,
    listKey: debouncedSearch,
    isReplacing,
    isLoadingMore,
    setSearch,
    loadMore,
    reloadLoaded,
    setItems,
  };
};
