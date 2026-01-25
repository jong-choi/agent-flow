"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";

const DEFAULT_DESCRIPTION =
  "검색해서 추가하거나 Enter로 직접 입력하세요.";
const MAX_SUGGESTIONS = 8;

const normalizeTag = (value: string) => value.trim().replace(/\s+/g, " ");
const tagKey = (value: string) => normalizeTag(value).toLowerCase();

type PresetTagInputProps = {
  name?: string;
  id?: string;
  label?: string;
  description?: string;
  placeholder?: string;
};

export function PresetTagInput({
  name = "tags",
  id = "preset-tags",
  label = "태그",
  description = DEFAULT_DESCRIPTION,
  placeholder = "태그 검색 또는 입력",
}: PresetTagInputProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const requestIdRef = useRef(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedKeys = useMemo(
    () => new Set(tags.map((tag) => tagKey(tag))),
    [tags],
  );

  const fetchSuggestions = useCallback(async (value: string) => {
    const query = normalizeTag(value);
    if (!query) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/presets/tags?query=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("태그 검색 실패");
      }

      const payload = (await response.json()) as { tags?: string[] };
      if (requestIdRef.current !== requestId) {
        return;
      }

      const next = Array.isArray(payload.tags) ? payload.tags : [];
      setSuggestions(next.slice(0, MAX_SUGGESTIONS));
    } catch {
      if (requestIdRef.current === requestId) {
        setSuggestions([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const debouncedSearch = useDebounce((value: string) => {
    void fetchSuggestions(value);
  }, 200);

  useEffect(() => {
    debouncedSearch(inputValue);
  }, [debouncedSearch, inputValue]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const addTag = useCallback(
    (value: string) => {
      const normalized = normalizeTag(value);
      if (!normalized) {
        return;
      }

      const key = tagKey(normalized);
      if (selectedKeys.has(key)) {
        setInputValue("");
        return;
      }

      setTags((prev) => [...prev, normalized]);
      setInputValue("");
      setSuggestions([]);
    },
    [selectedKeys],
  );

  const removeTag = useCallback((value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  }, []);

  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter(
        (tag) => !selectedKeys.has(tagKey(tag)) && tag.length > 0,
      ),
    [selectedKeys, suggestions],
  );

  const normalizedInput = normalizeTag(inputValue);
  const showCreateOption =
    normalizedInput.length > 0 &&
    !selectedKeys.has(tagKey(normalizedInput)) &&
    !visibleSuggestions.some((tag) => tagKey(tag) === tagKey(normalizedInput));

  const shouldShowList =
    isOpen &&
    (isLoading || showCreateOption || visibleSuggestions.length > 0);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(inputValue);
      return;
    }

    if (event.key === "Backspace" && inputValue === "" && tags.length > 0) {
      event.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {tags.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {tags.length}개 선택됨
          </span>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-expanded={shouldShowList}
          aria-controls={`${id}-suggestions`}
          autoComplete="off"
        />
        {shouldShowList ? (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md">
            <div
              id={`${id}-suggestions`}
              role="listbox"
              className="max-h-56 overflow-y-auto py-1 text-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                  <Spinner className="size-3" />
                  검색 중...
                </div>
              ) : null}
              {showCreateOption ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(normalizedInput)}
                >
                  <PlusIcon className="size-3" />
                  <span>추가: {normalizedInput}</span>
                </button>
              ) : null}
              {visibleSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(tag)}
                >
                  <span>{tag}</span>
                </button>
              ))}
              {!isLoading && !showCreateOption && visibleSuggestions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 transition hover:bg-muted"
              >
                <XIcon className="size-3" />
                <span className="sr-only">태그 삭제</span>
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {tags.map((tag) => (
        <input key={`${tag}-hidden`} type="hidden" name={name} value={tag} />
      ))}
    </div>
  );
}
